import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cqmusijxss.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5sT9N2eNdgeah_8xlpSnTQ_PGbNDpr9";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const viewerEl = document.getElementById("viewer");
const titleEl = document.getElementById("fileTitle");

const urlParams = new URLSearchParams(window.location.search);
const fileName = urlParams.get("file");
titleEl.textContent = fileName || "未知文件";

if (!fileName) {
  viewerEl.innerHTML = "<p>❌ 未指定文件。</p>";
} else {
  loadFile(fileName);
}

async function loadFile(name) {
  const { data } = await supabase.storage.from("ppt-files").getPublicUrl(name);
  const fileUrl = data.publicUrl;

  if (name.endsWith(".pdf")) {
    // 直接使用 PDF.js
    const viewerURL = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;
    viewerEl.innerHTML = `<iframe src="${viewerURL}" width="100%" height="800px"></iframe>`;
  } else if (name.endsWith(".ppt") || name.endsWith(".pptx")) {
    // 使用微软 Office 在线预览
    const viewerURL = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    viewerEl.innerHTML = `<iframe src="${viewerURL}" width="100%" height="800px"></iframe>`;
  } else {
    viewerEl.innerHTML = `<p>⚠️ 暂不支持的文件类型。</p>`;
  }
}
