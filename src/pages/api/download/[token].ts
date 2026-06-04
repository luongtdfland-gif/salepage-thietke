import type { APIRoute } from 'astro';
import { verifyDownloadToken } from '../../../lib/delivery';
import { fetchDesignWithFile } from '../../../lib/sheets';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { token } = params;

  if (!token) {
    return new Response('Token không hợp lệ', { status: 400 });
  }

  // Verify the download token
  const payload = verifyDownloadToken(token);

  if (!payload) {
    return new Response(
      `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Hết Hạn</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #FAF8F4; }
    .box { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 400px; }
    h1 { color: #1A1715; font-size: 24px; margin-bottom: 12px; }
    p { color: #786B5E; font-size: 15px; line-height: 1.6; }
    a { color: #C49A2E; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Link Đã Hết Hạn</h1>
    <p>Link tải xuống này không hợp lệ hoặc đã hết hạn (7 ngày).</p>
    <p>Vui lòng liên hệ <a href="mailto:lienhe@nhadepthietke.vn">lienhe@nhadepthietke.vn</a> để được hỗ trợ.</p>
  </div>
</body>
</html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  const { ma_mau, email } = payload;

  // Fetch the design including server-side-only file_url
  const design = await fetchDesignWithFile(ma_mau);

  if (!design || !design.file_url) {
    console.error(`[download] Design not found or no file_url for ma_mau: ${ma_mau}`);
    return new Response('Không tìm thấy file thiết kế', { status: 404 });
  }

  // Log the download
  console.log(`[download] ${ma_mau} downloaded by ${email} at ${new Date().toISOString()}`);

  // Redirect to Google Drive download URL
  // For MVP this is a 302 redirect — the file_url never appears in public HTML
  return new Response(null, {
    status: 302,
    headers: {
      Location: design.file_url,
    },
  });
};
