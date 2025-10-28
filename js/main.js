import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cgfzogwhglbvgfppyhpc.supabase.co"; // 替换成你的
const SUPABASE_ANON_KEY = "sb_publishable_srnrQzpnFTlsVaCTylDm3A_mzheWcyv"; // 替换成你的
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const searchInput = document.getElementById("search");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userEmailEl = document.getElementById("user-email");

let currentUser = null;

// init: check session and subscribe to auth changes
(async function initAuth(){
  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    currentUser = data.session.user;
    onUserChanged();
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    onUserChanged();
  });
  // initial list
  await loadFiles();
})();

function onUserChanged(){
  if (currentUser) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userEmailEl.textContent = currentUser.email ?? currentUser.user_metadata?.email ?? currentUser.id;
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userEmailEl.textContent = "";
  }
}

// --- Auth actions ---
// sign in with OAuth (opens provider popup/redirect)
loginBtn.addEventListener("click", async () => {
  // 使用 OAuth 的示例（会重定向到 provider）
  // 你也可以改成 email magic link: supabase.auth.signInWithOtp({ email })
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) console.error("登录出错", error.message);
});

// sign out
logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("登出出错", error.message);
});

// --- Upload handling ---
function sanitizeFileName(name){
  // 保留中文、英文、数字、下划线、连字符、点号；把空格替换为下划线
  return name.replace(/\s+/g, "_").replace(/[^\u4e00-\u9fa5\w.\-]/g, "");
}

fileInput.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!currentUser) { alert("请先登录后上传"); return; }

  const cleanName = sanitizeFileName(f.name);
  const storagePath = `${Date.now()}_${cleanName}`;

  // upload to storage
  const { data, error: upErr } = await supabase.storage.from("ppt-files").upload(storagePath, f, { upsert: true });
  if (upErr) {
    alert("上传失败: " + upErr.message);
    console.error(upErr);
    return;
  }

  // insert record to uploads table
  const rec = {
    file_name: cleanName,
    storage_path: storagePath,
    user_id: currentUser.id,
    email: currentUser.email ?? null
  };
  const { error: insErr } = await supabase.from("uploads").insert(rec);
  if (insErr) {
    // 若写入失败，考虑删除刚上传的文件（可选）
    console.error("写入 uploads 表失败", insErr);
    alert("上传已完成，但记录保存失败：" + insErr.message);
  } else {
    alert("上传成功！");
    await loadFiles();
  }
});

// --- List & render ---
async function loadFiles(){
  fileListEl.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:var(--muted)">加载中…</div>`;

  // list objects from storage
  const { data: listData, error: listErr } = await supabase.storage.from("ppt-files").list("", {limit: 200});
  if (listErr) {
    console.error("读取存储失败", listErr);
    fileListEl.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#b00">无法读取文件列表：${listErr.message}</div>`;
    return;
  }

  // load uploads table to map uploader -> storage_path
  const { data: uploads, error: upErr } = await supabase.from("uploads").select("*");
  if (upErr) {
    console.error("读取 uploads 失败", upErr);
  }

  renderFiles(listData || [], uploads || []);
}

function renderFiles(files, uploads){
  const q = (searchInput.value || "").toLowerCase().trim();
  fileListEl.innerHTML = "";
  const rows = (files||[]).filter(f => {
    const name = (f.name||"").toLowerCase();
    const upload = (uploads || []).find(u => u.storage_path === f.name || u.file_name === f.name);
    const uploader = upload?.email ?? "";
    return !q || name.includes(q) || uploader.toLowerCase().includes(q);
  });

  if (rows.length === 0) {
    fileListEl.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:var(--muted)">未找到文件</div>`;
    return;
  }

  rows.forEach(f => {
    const upload = (uploads || []).find(u => u.storage_path === f.name || u.file_name === f.name);
    const card = document.createElement("div");
    card.className = "file-card";

    const title = upload?.file_name ?? f.name;
    const uploader = upload?.email ?? "未知";
    const created = f.created_at ? new Date(f.created_at).toLocaleString() : "";

    card.innerHTML = `
      <div class="file-name">${escapeHtml(title)}</div>
      <div class="file-meta">
        <div>${created}</div>
        <div>上传者：<strong>${escapeHtml(uploader)}</strong></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="action-btn" onclick="downloadFile('${encodeURIComponent(f.name)}')">下载</button>
        <button class="action-btn primary" onclick="viewFile('${encodeURIComponent(f.name)}')">预览</button>
      </div>
    `;

    fileListEl.appendChild(card);
  });
}

function escapeHtml(s){ return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

window.viewFile = function(storageName){
  // direct to viewer.html
  location.href = `viewer.html?file=${storageName}`;
};

window.downloadFile = async function(encodedName){
  const name = decodeURIComponent(encodedName);
  const { data } = supabase.storage.from("ppt-files").getPublicUrl(name);
  const url = data?.publicUrl;
  if (!url) { alert("无法获取文件 URL"); return; }
  window.open(url, "_blank");
};

// search binding
searchInput.addEventListener("input", () => loadFiles());
