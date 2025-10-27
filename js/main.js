import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cgfzogwhglbvgfppyhpc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_srnrQzpnFTlsVaCTylDm3A_mzheWcyv";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const searchInput = document.getElementById("search");

// 上传文件
function sanitizeFileName(fileName) {
  return fileName
    .replace(/ /g, '_')  // 替换空格为下划线
    .replace(/[^\w\-\.]/g, '')  // 移除其他特殊字符，保留字母、数字、下划线、连字符
    .toLowerCase();  // 统一转小写（可选）
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 格式化文件名
  const sanitizedFileName = sanitizeFileName(file.name);

  const { data, error } = await supabase.storage
    .from("ppt-files")
    .upload(`${Date.now()}_${sanitizedFileName}`, file, { upsert: true });

  if (error) {
    alert("上传失败: " + error.message);
  } else {
    alert("✅ 上传成功！");
    loadFiles();
  }
});


// 加载文件列表
async function loadFiles() {
  const { data, error } = await supabase.storage.from("ppt-files").list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) {
    console.error(error);
    return;
  }

  renderFiles(data);
}

function renderFiles(files) {
  const keyword = searchInput.value.toLowerCase();
  fileListEl.innerHTML = "";

  files
    .filter((f) => f.name.toLowerCase().includes(keyword))
    .forEach((f) => {
      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = `
        <div class="file-name">${f.name}</div>
        <div class="file-date">${new Date(f.created_at).toLocaleString()}</div>
      `;
      card.onclick = () => openViewer(f.name);
      fileListEl.appendChild(card);
    });
}

function openViewer(filename) {
  window.location.href = `viewer.html?file=${encodeURIComponent(filename)}`;
}

searchInput.addEventListener("input", loadFiles);

loadFiles();
