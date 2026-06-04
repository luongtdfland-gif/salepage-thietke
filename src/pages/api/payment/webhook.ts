import type { APIRoute } from 'astro';
import { verifyPayOSWebhook } from '../../../lib/payos';
import { createDownloadToken, sendDeliveryEmail } from '../../../lib/delivery';
import { fetchDesigns } from '../../../lib/sheets';
import type { PayOSWebhookBody } from '../../../lib/types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse webhook body
    const body = await request.json() as PayOSWebhookBody;

    // Verify PayOS signature — reject if invalid
    if (!verifyPayOSWebhook(body)) {
      console.warn('[webhook] Invalid PayOS signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only process PAID status
    if (body.code !== '00' || !body.success) {
      // PayOS sends webhook for various states; acknowledge but don't process
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { orderCode, description } = body.data;

    // description holds the ma_mau (set during payment creation)
    const ma_mau = description.trim();

    // Get buyer email from webhook data (PayOS includes buyerEmail in the data object)
    const buyerEmail = (body.data as unknown as Record<string, string>).buyerEmail ?? '';
    const buyerName = (body.data as unknown as Record<string, string>).buyerName ?? 'Quý khách';

    if (!ma_mau) {
      console.error('[webhook] Could not extract ma_mau from description:', description);
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot identify design' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!buyerEmail) {
      console.error('[webhook] No buyer email in webhook payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No buyer email' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch design name for the email
    const designs = await fetchDesigns();
    const design = designs.find(d => d.ma_mau === ma_mau);
    const designName = design?.ten ?? ma_mau;

    // Create signed download token
    const downloadToken = createDownloadToken(ma_mau, String(orderCode), buyerEmail);

    // Send delivery email
    try {
      await sendDeliveryEmail(buyerEmail, buyerName, designName, downloadToken);
      console.log(`[webhook] Delivery email sent to ${buyerEmail} for ${ma_mau} (order: ${orderCode})`);
    } catch (emailErr) {
      console.error('[webhook] Failed to send delivery email:', emailErr);
      // Don't return error — payment was confirmed, email failure is secondary
      // In production, add to a retry queue here
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[webhook] Unhandled error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
