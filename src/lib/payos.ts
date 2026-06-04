import { createHmac, timingSafeEqual } from 'crypto';
import type { PayOSPaymentParams, PayOSPaymentResult, PayOSWebhookBody } from './types';

const PAYOS_BASE_URL = 'https://api-merchant.payos.vn/v2/payment-requests';

function getEnv(key: string): string {
  const val = process.env[key] || (import.meta.env as Record<string, string>)[key] || '';
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

/**
 * Generate PayOS HMAC-SHA256 signature.
 * Fields in alphabetical order: amount, cancelUrl, description, orderCode, returnUrl
 */
function generateSignature(params: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}): string {
  const checksumKey = getEnv('PAYOS_CHECKSUM_KEY');
  const data = [
    `amount=${params.amount}`,
    `cancelUrl=${params.cancelUrl}`,
    `description=${params.description}`,
    `orderCode=${params.orderCode}`,
    `returnUrl=${params.returnUrl}`,
  ].join('&');

  return createHmac('sha256', checksumKey).update(data).digest('hex');
}

/**
 * Create a PayOS payment request and return checkout URL + QR code.
 */
export async function createPayOSPayment(
  params: PayOSPaymentParams
): Promise<PayOSPaymentResult> {
  const clientId = getEnv('PAYOS_CLIENT_ID');
  const apiKey = getEnv('PAYOS_API_KEY');

  const signature = generateSignature({
    amount: params.amount,
    cancelUrl: params.cancelUrl,
    description: params.description,
    orderCode: params.orderCode,
    returnUrl: params.returnUrl,
  });

  const body = {
    orderCode: params.orderCode,
    amount: params.amount,
    description: params.description,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    cancelUrl: params.cancelUrl,
    returnUrl: params.returnUrl,
    signature,
  };

  const res = await fetch(PAYOS_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayOS API error ${res.status}: ${errorText}`);
  }

  const json = await res.json() as {
    code: string;
    desc: string;
    data?: {
      checkoutUrl: string;
      qrCode: string;
    };
  };

  if (json.code !== '00' || !json.data) {
    throw new Error(`PayOS returned error: ${json.desc} (code: ${json.code})`);
  }

  return {
    checkoutUrl: json.data.checkoutUrl,
    qrCode: json.data.qrCode,
  };
}

/**
 * Fetch PayOS order status by orderCode.
 */
export async function getPayOSOrderStatus(orderCode: string | number): Promise<{
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | string;
  amount: number;
  description: string;
  buyerEmail: string;
  buyerName: string;
  orderCode: number;
}> {
  const clientId = getEnv('PAYOS_CLIENT_ID');
  const apiKey = getEnv('PAYOS_API_KEY');

  const res = await fetch(`${PAYOS_BASE_URL}/${orderCode}`, {
    method: 'GET',
    headers: {
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayOS API error ${res.status}: ${errorText}`);
  }

  const json = await res.json() as {
    code: string;
    desc: string;
    data?: {
      status: string;
      amount: number;
      description: string;
      buyerEmail: string;
      buyerName: string;
      orderCode: number;
    };
  };

  if (json.code !== '00' || !json.data) {
    throw new Error(`PayOS error: ${json.desc} (code: ${json.code})`);
  }

  return json.data;
}

/**
 * Verify a PayOS webhook signature.
 * PayOS signs the webhook data object fields in alphabetical order.
 */
export function verifyPayOSWebhook(body: PayOSWebhookBody): boolean {
  try {
    const checksumKey = getEnv('PAYOS_CHECKSUM_KEY');
    const { data, signature } = body;

    // Sort data keys alphabetically and build the signature string
    const sortedKeys = Object.keys(data).sort();
    const signatureData = sortedKeys
      .map(key => `${key}=${(data as Record<string, unknown>)[key]}`)
      .join('&');

    const expectedSignature = createHmac('sha256', checksumKey)
      .update(signatureData)
      .digest('hex');

    const a = Buffer.from(expectedSignature, 'hex');
    const b = Buffer.from(signature, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
