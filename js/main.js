import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cgfzogwhglbvgfppyhpc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_srnrQzpnFTlsVaCTylDm3A_mzheWcyv";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 获取页面元素
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const searchInput = document.getElementById("search");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

// 登录
async function login() {
  const { user, error } = await supabase.auth.signIn({
    provider: 'google',  // 你也可以使用 email/password 认证
  });

  if (error) {
    alert("登录失败：" + error.message);
  } else {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    alert("登录成功！");
    loadFiles(); // 登录后加载文件
  }
}

// 登出
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  alert("已登出");
  loadFiles(); // 登出后重新加载文件
}

// 上传文件
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) {
    alert("请先登录");
    return;
  }

  const sanitizedFileName = sanitizeFileName(file.name);

  // 上传文件
  const { data, error } = await supabase.storage
    .from("ppt-files")
    .upload(`${Date.now()}_${sanitizedFileName}`, file, {
      upsert: true
    });

  if (error) {
    alert("上传失败: " + error.message);
  } else {
    // 保存上传者信息
    await supabase.from("uploads").insert([
      {
        file_name: sanitizedFileName,
        user_id: currentUser.id,     // 当前登录用户的 ID
        email: currentUser.email,    // 当前登录用户的邮箱
        created_at: new Date(),      // 文件上传时间
      }
    ]);

    alert("✅ 上传成功！");
    loadFiles();
});

// 加载文件列表并显示上传者信息
async function loadFiles() {
  const { data: files, error } = await supabase.storage.from("ppt-files").list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    console.error(error);
    return;
  }

  // 加载上传者信息
  const { data: uploads } = await supabase.from("uploads").select("*");

  renderFiles(files, uploads);
}

// 渲染文件列表
function renderFiles(files, uploads) {
  const keyword = searchInput.value.toLowerCase();
  fileListEl.innerHTML = "";

  files
    .filter((f) => f.name.toLowerCase().includes(keyword))
    .forEach((f) => {
      const upload = uploads.find((upload) => upload.file_name === f.name);

      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = `
        <div class="file-name">${f.name}</div>
        <div class="file-date">${new Date(f.created_at).toLocaleString()}</div>
        <div class="file-uploader">上传者：${upload ? upload.email : '未知'}</div>
      `;
      card.onclick = () => openViewer(f.name);
      fileListEl.appendChild(card);
    });
}

// 打开文件预览页面
function openViewer(filename) {
  window.location.href = `viewer.html?file=${encodeURIComponent(filename)}`;
}

searchInput.addEventListener("input", loadFiles);
loadFiles();

