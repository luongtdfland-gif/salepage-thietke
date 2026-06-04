import { createHmac, timingSafeEqual } from 'crypto';
import { Resend } from 'resend';

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.DOWNLOAD_SECRET || (import.meta.env as Record<string, string>).DOWNLOAD_SECRET || '';
  if (!secret) throw new Error('Missing DOWNLOAD_SECRET env var');
  return secret;
}

function getSiteUrl(): string {
  return process.env.SITE_URL || (import.meta.env as Record<string, string>).SITE_URL || 'http://localhost:4321';
}

function base64urlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padding), 'base64').toString('utf8');
}

interface TokenPayload {
  ma_mau: string;
  order_code: string;
  email: string;
  exp: number;
}

/**
 * Create a signed download token with 7-day expiry.
 * Format: base64url(JSON payload).<hmac>
 */
export function createDownloadToken(ma_mau: string, order_code: string, email: string): string {
  const payload: TokenPayload = {
    ma_mau,
    order_code,
    email,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const payloadStr = base64urlEncode(JSON.stringify(payload));
  const hmac = createHmac('sha256', getSecret())
    .update(payloadStr)
    .digest('hex');

  return `${payloadStr}.${hmac}`;
}

/**
 * Verify a download token. Returns payload if valid, null if invalid or expired.
 */
export function verifyDownloadToken(token: string): { ma_mau: string; email: string } | null {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payloadStr = token.slice(0, dotIndex);
    const providedHmac = token.slice(dotIndex + 1);

    // Verify HMAC using constant-time comparison to prevent timing attacks
    const expectedHmac = createHmac('sha256', getSecret())
      .update(payloadStr)
      .digest('hex');

    const a = Buffer.from(expectedHmac, 'hex');
    const b = Buffer.from(providedHmac, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    // Decode payload
    const payload: TokenPayload = JSON.parse(base64urlDecode(payloadStr));

    // Check expiry
    if (Date.now() > payload.exp) return null;

    return { ma_mau: payload.ma_mau, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Send delivery email with download link using Resend.
 */
export async function sendDeliveryEmail(
  email: string,
  name: string,
  designName: string,
  downloadToken: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || (import.meta.env as Record<string, string>).RESEND_API_KEY || '';
  if (!apiKey) throw new Error('Missing RESEND_API_KEY env var');

  const resend = new Resend(apiKey);
  const siteUrl = getSiteUrl();
  const downloadUrl = `${siteUrl}/api/download/${downloadToken}`;

  const siteDomain = new URL(siteUrl).hostname;
  const fromEmail = siteDomain === 'localhost' ? 'onboarding@resend.dev' : `no-reply@${siteDomain}`;

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Hồ sơ thiết kế "${designName}" — Tải xuống ngay`,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hồ Sơ Thiết Kế</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(120,80,20,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1A1715;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#C49A2E;font-family:Georgia,serif;font-size:24px;font-weight:600;letter-spacing:1px;">
                NHÀ ĐẸP THIẾT KẾ
              </h1>
              <p style="margin:8px 0 0;color:#786B5E;font-size:13px;">Kiến Trúc Hà Nội</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1A1715;font-size:20px;font-weight:600;">
                Xin chào ${name}!
              </h2>
              <p style="margin:0 0 16px;color:#786B5E;font-size:15px;line-height:1.7;">
                Cảm ơn bạn đã tin tưởng lựa chọn <strong style="color:#1A1715;">${designName}</strong>.
                Hồ sơ thiết kế của bạn đã sẵn sàng để tải xuống.
              </p>
              <p style="margin:0 0 8px;color:#786B5E;font-size:13px;">
                Link tải có hiệu lực trong <strong>7 ngày</strong> kể từ thời điểm này.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background:#C49A2E;border-radius:8px;">
                    <a href="${downloadUrl}"
                       style="display:inline-block;padding:16px 40px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">
                      Tải Hồ Sơ Thiết Kế
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#786B5E;font-size:13px;">
                Hoặc copy link sau vào trình duyệt:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${downloadUrl}" style="color:#C49A2E;font-size:12px;">${downloadUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #E4DAD0;margin:24px 0;">

              <p style="margin:0;color:#786B5E;font-size:13px;line-height:1.6;">
                Nếu bạn gặp bất kỳ vấn đề gì, hãy liên hệ với chúng tôi qua email này.
                Chúc bạn xây dựng ngôi nhà mơ ước thành công!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F2EDE5;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#786B5E;font-size:12px;">
                © 2026 Nhà Đẹp Thiết Kế. Mã hồ sơ: ${designName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
