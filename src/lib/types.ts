export interface Design {
  ma_mau: string;
  ten: string;
  loai: 'nha-pho' | 'biet-thu' | 'chung-cu' | 'nha-vuon';
  dien_tich_dat: number;
  so_tang: number;
  so_phong_ngu: number;
  phong_cach: string;
  huong: string;
  chi_phi_xay_du_kien: number;
  gia_ban_ho_so: number;
  anh_url: string;
  mo_ta: string;
  // file_url intentionally omitted from public type
  trang_thai: 'active' | 'draft';
}

export interface DesignWithFile extends Design {
  file_url: string; // only used server-side
}

export interface PayOSPaymentParams {
  orderCode: number;
  amount: number;
  description: string;
  buyerEmail: string;
  buyerName: string;
  cancelUrl: string;
  returnUrl: string;
}

export interface PayOSPaymentResult {
  checkoutUrl: string;
  qrCode: string;
}

export interface PayOSWebhookBody {
  code: string;
  desc: string;
  success: boolean;
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
  };
  signature: string;
}

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}
