import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cgfzogwhglbvgfppyhpc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_srnrQzpnFTlsVaCTylDm3A_mzheWcyv";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const params = new URLSearchParams(location.search);
const file = params.get("file");
const root = document.getElementById("viewerArea");

if (!file) {
  root.innerHTML = '<div style="padding:24px;color:#b00">未指定文件</div>';
} else {
  const name = decodeURIComponent(file);
  // get public url
  const { data } = supabase.storage.from("ppt-files").getPublicUrl(name);
  const url = data?.publicUrl;
  if (!url) {
    root.innerHTML = `<div style="padding:24px;color:#b00">无法获取文件链接</div>`;
  } else {
    if (name.toLowerCase().endsWith(".pdf")) {
      // embed via PDF.js viewer hosted (quick way)
      const viewer = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
      root.innerHTML = `<iframe src="${viewer}" style="width:100%;height:80vh;border:0"></iframe>`;
    } else {
      // ppt/pptx -> use office viewer embed
      const viewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      root.innerHTML = `<iframe src="${viewer}" style="width:100%;height:80vh;border:0"></iframe>`;
    }
  }
}
