import type { APIRoute } from 'astro';
import { createPayOSPayment } from '../../../lib/payos';
import { fetchDesigns } from '../../../lib/sheets';

export const prerender = false;

interface RequestBody {
  ma_mau: string;
  email: string;
  name: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as RequestBody;
    const { ma_mau, email, name } = body;

    if (!ma_mau || !email || !name) {
      return new Response(
        JSON.stringify({ error: 'ma_mau, email và name là bắt buộc' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return new Response(
        JSON.stringify({ error: 'Email không hợp lệ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch design to get price
    const designs = await fetchDesigns();
    const design = designs.find(d => d.ma_mau === ma_mau);

    if (!design) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy mẫu thiết kế' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order code (timestamp-based, fits in JS safe integer)
    const orderCode = Math.floor(Date.now() / 1000) % 9_000_000 + 1_000_000;

    // PayOS description max 25 chars — use ma_mau as description
    // We'll get email from the webhook buyerEmail field
    const description = ma_mau.substring(0, 25);

    const siteUrl = process.env.SITE_URL ?? 'http://localhost:4321';

    const result = await createPayOSPayment({
      orderCode,
      amount: design.gia_ban_ho_so,
      description,
      buyerEmail: email,
      buyerName: name,
      cancelUrl: `${siteUrl}/thiet-ke/${ma_mau}?payment=cancelled`,
      returnUrl: `${siteUrl}/thiet-ke/${ma_mau}?payment=success`,
    });

    return new Response(
      JSON.stringify({
        checkoutUrl: result.checkoutUrl,
        qrCode: result.qrCode,
        orderCode,
        amount: design.gia_ban_ho_so,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[payment/create] Error:', err);
    const message = err instanceof Error ? err.message : 'Lỗi tạo thanh toán';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
