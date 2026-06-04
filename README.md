# Nhà Đẹp Thiết Kế — Hướng Dẫn Cài Đặt

Trang bán hồ sơ thiết kế nhà trực tuyến với AI tư vấn, thanh toán VietQR và giao hồ sơ tự động qua email.

---

## Mục Lục

1. [Thiết lập Google Sheet](#1-thiết-lập-google-sheet)
2. [Lấy PayOS API Key](#2-lấy-payos-api-key)
3. [Lấy Resend API Key](#3-lấy-resend-api-key)
4. [Lấy Anthropic API Key](#4-lấy-anthropic-api-key)
5. [Deploy lên Vercel](#5-deploy-lên-vercel)
6. [Thêm mẫu thiết kế mới](#6-thêm-mẫu-thiết-kế-mới)
7. [Trigger rebuild thủ công](#7-trigger-rebuild-thủ-công)

---

## 1. Thiết lập Google Sheet

### Tạo Google Sheet

1. Vào [Google Sheets](https://sheets.google.com) → Tạo spreadsheet mới
2. Đặt tên sheet tab là `Sheet1`
3. Dòng đầu tiên (row 1) là header — nhập chính xác 14 cột theo thứ tự:

```
ma_mau | ten | loai | dien_tich_dat | so_tang | so_phong_ngu | phong_cach | huong | chi_phi_xay_du_kien | gia_ban_ho_so | anh_url | mo_ta | file_url | trang_thai
```

4. Từ dòng 2 trở đi là dữ liệu mẫu thiết kế (xem `docs/google-sheet-schema.md`)

### Publish Sheet thành CSV

1. Vào **File → Share → Publish to web**
2. Chọn sheet `Sheet1`
3. Chọn định dạng `Comma-separated values (.csv)`
4. Bấm **Publish**
5. Copy URL xuất hiện — đây là `GOOGLE_SHEET_CSV_URL`

URL có dạng:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv
```

**Lưu ý:** Mỗi khi thêm/sửa dữ liệu, sheet tự cập nhật. Website sẽ đọc dữ liệu mới sau 1 tiếng (ISR revalidation) hoặc khi rebuild.

---

## 2. Lấy PayOS API Key

1. Đăng ký tài khoản tại [payos.vn](https://payos.vn)
2. Hoàn thành KYC (xác minh danh tính doanh nghiệp)
3. Vào **Developer → API Keys**
4. Lưu 3 giá trị:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`

5. Cấu hình webhook URL trong PayOS dashboard:
   ```
   https://your-domain.vn/api/payment/webhook
   ```

---

## 3. Lấy Resend API Key

1. Đăng ký tại [resend.com](https://resend.com)
2. Vào **API Keys → Create API Key**
3. Tên key: `nhadepthietke-prod`
4. Copy `RESEND_API_KEY` (dạng `re_...`)

5. Xác minh domain email của bạn tại Resend → **Domains → Add Domain**
   - Thêm DNS records theo hướng dẫn của Resend
   - Sau khi xác minh, email sẽ gửi từ `no-reply@your-domain.vn`

**Chú ý:** Nếu chưa xác minh domain, email sẽ gửi từ `onboarding@resend.dev` (chỉ nhận được ở địa chỉ email đã đăng ký tài khoản Resend).

---

## 4. Lấy Anthropic API Key

1. Vào [console.anthropic.com](https://console.anthropic.com)
2. Tạo tài khoản và nạp credit (AI Advisor dùng Claude Haiku — rất rẻ, ~$0.25/1M tokens)
3. Vào **API Keys → Create Key**
4. Copy `ANTHROPIC_API_KEY` (dạng `sk-ant-...`)

---

## 5. Deploy lên Vercel

### Bước 1: Push code lên GitHub

```bash
cd projects/salepage-thietke
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/salepage-thietke.git
git push -u origin main
```

### Bước 2: Import vào Vercel

1. Vào [vercel.com](https://vercel.com) → **Add New Project**
2. Import từ GitHub → chọn repository `salepage-thietke`
3. Framework: **Astro** (Vercel tự detect)
4. Build command: `npm run build` (tự điền)
5. Output directory: `dist` (tự điền)

### Bước 3: Cấu hình Environment Variables

Trong Vercel project settings → **Environment Variables**, thêm:

| Key | Value |
|-----|-------|
| `GOOGLE_SHEET_CSV_URL` | URL CSV từ bước 1 |
| `PAYOS_CLIENT_ID` | Client ID từ PayOS |
| `PAYOS_API_KEY` | API Key từ PayOS |
| `PAYOS_CHECKSUM_KEY` | Checksum Key từ PayOS |
| `DOWNLOAD_SECRET` | Random string 32 ký tự (xem bên dưới) |
| `RESEND_API_KEY` | API Key từ Resend |
| `ANTHROPIC_API_KEY` | API Key từ Anthropic |
| `SITE_URL` | `https://your-domain.vn` |

**Tạo DOWNLOAD_SECRET:**
```bash
openssl rand -hex 32
# hoặc
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bước 4: Deploy

Bấm **Deploy** — Vercel sẽ build và deploy tự động. Mỗi lần push code lên GitHub, Vercel tự deploy lại.

### Bước 5: Cấu hình domain

1. Vercel project → **Settings → Domains**
2. Thêm domain của bạn (ví dụ: `nhadepthietke.vn`)
3. Cập nhật DNS theo hướng dẫn của Vercel

---

## 6. Thêm Mẫu Thiết Kế Mới

Không cần động vào code. Chỉ cần:

1. Mở Google Sheet
2. Thêm dòng mới với đầy đủ dữ liệu (xem `docs/google-sheet-schema.md`)
3. Đặt `trang_thai = active`
4. Trigger rebuild Vercel (xem mục 7)

Trang web sẽ tự động có thêm trang `/thiet-ke/[ma_mau]` cho mẫu mới.

---

## 7. Trigger Rebuild Thủ Công

### Cách 1: Vercel Dashboard

1. Vào Vercel project → **Deployments**
2. Bấm vào deployment mới nhất
3. Bấm **Redeploy**

### Cách 2: Deploy Hook (tự động hóa)

1. Vercel project → **Settings → Git → Deploy Hooks**
2. Tạo hook mới, đặt tên `sheet-update`
3. Copy URL hook (dạng `https://api.vercel.com/v1/integrations/deploy/...`)
4. Dán URL này vào Google Apps Script để tự động rebuild khi sheet thay đổi:

```javascript
// Google Sheets → Extensions → Apps Script
function onEdit(e) {
  const HOOK_URL = 'https://api.vercel.com/v1/integrations/deploy/YOUR_HOOK_ID';
  UrlFetchApp.fetch(HOOK_URL, { method: 'post' });
}
```

### Cách 3: GitHub Action

Tạo file `.github/workflows/rebuild.yml`:

```yaml
name: Rebuild on Schedule
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

---

## Cấu Trúc File Chính

```
src/
├── lib/
│   ├── types.ts      — TypeScript interfaces
│   ├── sheets.ts     — Google Sheets CSV reader
│   ├── payos.ts      — PayOS payment + webhook verification
│   └── delivery.ts   — Token generation + email sending
├── pages/
│   ├── index.astro              — Trang chủ
│   ├── thiet-ke/[slug].astro    — Trang chi tiết mẫu
│   └── api/
│       ├── advisor.ts           — AI tư vấn (Claude Haiku)
│       ├── payment/create.ts    — Tạo đơn hàng PayOS
│       ├── payment/webhook.ts   — Xử lý webhook PayOS
│       └── download/[token].ts  — Xác thực và chuyển hướng download
└── components/
    ├── DesignCard.astro    — Card mẫu thiết kế
    ├── FilterBar.astro     — Bộ lọc phía client
    ├── AIAdvisor.astro     — Widget chat AI
    └── PaymentModal.astro  — Modal thanh toán VietQR
```

---

## Tech Stack

- **Astro 5** with hybrid output (static + server)
- **Vercel** — hosting với Serverless Functions
- **Tailwind CSS 4** — styling
- **Claude Haiku** (Anthropic) — AI tư vấn
- **PayOS** — thanh toán VietQR
- **Resend** — gửi email giao hồ sơ
- **Google Sheets** — database không cần backend

---

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề kỹ thuật, kiểm tra:
1. Vercel Function Logs: Project → **Functions** → xem logs
2. Vercel Deployment Logs: **Deployments** → chọn deploy → **View Build Logs**
3. Kiểm tra tất cả Environment Variables đã được set đúng
