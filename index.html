import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cgfzogwhglbvgfppyhpc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_srnrQzpnFTlsVaCTylDm3A_mzheWcyv";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const searchInput = document.getElementById("search");

let currentUser = null;

// ===== 登录 =====
async function login() {
  const email = prompt("请输入你的邮箱以登录：");
  if (!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) alert("登录失败：" + error.message);
  else alert("已发送登录邮件，请前往邮箱点击链接完成登录。");
}

// ===== 登出 =====
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  alert("已登出");
  await loadFiles();
}

// 登录状态变化
supabase.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user || null;
  loginBtn.style.display = currentUser ? "none" : "inline-block";
  logoutBtn.style.display = currentUser ? "inline-block" : "none";
  await loadFiles();
});

// ===== 上传文件 =====
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) {
    alert("请先登录!");
    return;
  }

  const fileName = sanitizeFileName(file.name);
  const { error: uploadError } = await supabase.storage
    .from("ppt-files")
    .upload(`${Date.now()}_${fileName}`, file);

  if (uploadError) {
    alert("上传失败: " + uploadError.message);
    return;
  }

  await supabase.from("uploads").insert([
    {
      file_name: fileName,
      user_id: currentUser.id,
      email: currentUser.email,
    },
  ]);

  alert("✅ 上传成功!");
  loadFiles();
});

// ===== 加载文件 =====
async function loadFiles() {
  const { data: files, error } = await supabase.storage
    .from("ppt-files")
    .list("");
  if (error) {
    console.error(error);
    return;
  }

  const { data: uploads } = await supabase.from("uploads").select("*");
  renderFiles(files, uploads);
}

function renderFiles(files, uploads) {
  const keyword = searchInput.value.toLowerCase();
  fileListEl.innerHTML = "";
  files
    .filter((f) => f.name.toLowerCase().includes(keyword))
    .forEach((f) => {
      const u = uploads.find((x) => f.name.includes(x.file_name));
      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = `
        <div class="file-name">${f.name}</div>
        <div class="uploader">上传者：${u?.email || "未知"}</div>
      `;
      card.onclick = () => openViewer(f.name);
      fileListEl.appendChild(card);
    });
}

function openViewer(name) {
  window.location.href = `viewer.html?file=${encodeURIComponent(name)}`;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

searchInput.addEventListener("input", loadFiles);
loginBtn.onclick = login;
logoutBtn.onclick = logout;
loadFiles();
