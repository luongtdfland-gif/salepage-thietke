import type { APIRoute } from 'astro';
import { getPayOSOrderStatus } from '../../lib/payos';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const orderCode = url.searchParams.get('orderCode');

  if (!orderCode || !/^\d+$/.test(orderCode)) {
    return new Response(
      JSON.stringify({ error: 'orderCode không hợp lệ — phải là số nguyên dương' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await getPayOSOrderStatus(orderCode);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi kiểm tra đơn hàng';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
