# Data Flow Architecture

## System Overview

```
salepage-thietke
├── Static layer (Astro SSG)     — homepage + design pages
├── Server layer (Astro SSR)     — API routes on Vercel Functions
└── External services            — Google Sheets, PayOS, Anthropic, Resend
```

---

## Full Data Flow Diagram

```mermaid
graph TD
    subgraph Owner["Owner (Google Sheets)"]
        GS["Google Sheet\nma_mau | ten | loai | gia_ban_ho_so | file_url | ..."]
        GS_CSV["Published CSV URL\n(public, no API key needed)"]
        GS --> GS_CSV
    end

    subgraph Build["Astro Build Time (Vercel)"]
        BUILD["getStaticPaths()\nfetchDesigns()"]
        PAGES["Static HTML pages\n/thiet-ke/[slug]"]
        INDEX["Homepage\n/index.html"]
        GS_CSV -->|"fetch CSV\n(build time)"| BUILD
        BUILD --> PAGES
        BUILD --> INDEX
        NOTE_FILEURL["file_url is NEVER\nincluded in public HTML"]
    end

    subgraph Visitor["Visitor (Mobile Browser)"]
        V_BROWSE["Browse design catalog\nhomepage + filter"]
        V_DETAIL["View design detail page\n/thiet-ke/NP-01"]
        V_CHAT["Chat with AI Advisor"]
        V_BUY["Click 'Mua Hồ Sơ'"]
        V_QR["Scan VietQR code"]
        V_EMAIL["Receive email with\ndownload link"]
        V_DOWNLOAD["Click download link\nin email"]
    end

    subgraph API["Vercel Server Functions (SSR)"]
        API_ADVISOR["/api/advisor\nPOST — Claude Haiku chat"]
        API_CREATE["/api/payment/create\nPOST — create PayOS order"]
        API_WEBHOOK["/api/payment/webhook\nPOST — handle PayOS callback"]
        API_DOWNLOAD["/api/download/[token]\nGET — verify token + redirect"]
    end

    subgraph External["External Services"]
        ANTHROPIC["Anthropic API\nClaude Haiku\nclaude-haiku-4-5"]
        PAYOS["PayOS\nPayment gateway\nVietQR generation"]
        RESEND["Resend\nTransactional email"]
        GDRIVE["Google Drive\nFile storage\n(private files)"]
    end

    %% Browsing flow
    INDEX -->|renders| V_BROWSE
    V_BROWSE -->|click design| V_DETAIL
    PAGES -->|renders| V_DETAIL

    %% AI Advisor flow
    V_CHAT -->|POST message + history| API_ADVISOR
    API_ADVISOR -->|fetch active designs\nfor context| GS_CSV
    API_ADVISOR -->|claude-haiku-4-5\nmax 500 tokens| ANTHROPIC
    ANTHROPIC -->|reply| API_ADVISOR
    API_ADVISOR -->|JSON reply| V_CHAT

    %% Payment flow
    V_BUY -->|open PaymentModal\nenter name + email| V_DETAIL
    V_DETAIL -->|POST ma_mau, email, name| API_CREATE
    API_CREATE -->|lookup price from CSV| GS_CSV
    API_CREATE -->|create payment request\nHMAC-SHA256 signed| PAYOS
    PAYOS -->|checkoutUrl + qrCode| API_CREATE
    API_CREATE -->|qrCode URL + checkoutUrl| V_QR

    %% Webhook + delivery flow
    V_QR -->|complete payment| PAYOS
    PAYOS -->|POST webhook\n(HMAC-SHA256 signature)| API_WEBHOOK
    API_WEBHOOK -->|verify signature| API_WEBHOOK
    API_WEBHOOK -->|createDownloadToken\nbase64url payload + HMAC| API_WEBHOOK
    API_WEBHOOK -->|send email with\ndownload link| RESEND
    RESEND -->|delivery email| V_EMAIL

    %% Download flow
    V_EMAIL -->|click download link\n/api/download/TOKEN| V_DOWNLOAD
    V_DOWNLOAD -->|GET /api/download/[token]| API_DOWNLOAD
    API_DOWNLOAD -->|verifyDownloadToken\ncheck HMAC + expiry| API_DOWNLOAD
    API_DOWNLOAD -->|fetchDesignWithFile\nserver-side only| GS_CSV
    API_DOWNLOAD -->|302 redirect\nfile_url never in HTML| GDRIVE
    GDRIVE -->|file download| V_DOWNLOAD
```

---

## Security Boundaries

```
PUBLIC ZONE (browser-visible HTML)
├── Design name, description, loai, specs
├── anh_url (Google Drive image — public)
├── Price (gia_ban_ho_so)
└── ma_mau (slug identifier)

PRIVATE ZONE (server-side only)
├── file_url — never sent to browser, only used in redirect
├── PAYOS_CHECKSUM_KEY — webhook signature verification
├── DOWNLOAD_SECRET — HMAC token signing
├── ANTHROPIC_API_KEY — AI calls
└── RESEND_API_KEY — email delivery
```

---

## Token Security Model

```
Download Token Format:
  base64url(JSON.stringify({ma_mau, order_code, email, exp}))
  +
  "."
  +
  HMAC-SHA256(payload, DOWNLOAD_SECRET)

Verification:
  1. Split token at last "."
  2. Recompute HMAC of payload
  3. Constant-time compare with provided HMAC (prevents timing attacks)
  4. Decode payload JSON
  5. Check exp < Date.now()

Expiry: 7 days from creation
No download count limit (MVP — add Redis counter later if needed)
```

---

## ISR / Caching Strategy

```
Google Sheet CSV:
  - Fetched at build time with cache: 'force-cache'
  - ISR revalidation: every 3600 seconds (1 hour)
  - To force rebuild: push to git or trigger Vercel deploy webhook

Static pages (/thiet-ke/[slug]):
  - Pre-rendered at build time
  - Served from Vercel Edge CDN
  - Rebuilt when new designs are added (owner triggers Vercel redeploy)

API routes:
  - prerender: false
  - Run as Vercel Serverless Functions (Node.js runtime)
  - No persistent state — stateless design
```

---

## Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| Google Sheet CSV unreachable at build | Build fails, no new pages | Fix sheet publish settings, redeploy |
| Google Sheet CSV unreachable at runtime | AI advisor returns no designs context | Cached designs still shown (ISR) |
| PayOS API down | Payment creation fails, user sees error | User retries; no data lost |
| PayOS webhook not received | Email not sent despite payment | Manual: check PayOS dashboard, resend email with token |
| Resend API down | Email not sent | Retry logic needed (not in MVP); check Resend dashboard |
| Download token expired | 403 error on download page | User contacts support; generate new token manually |
| Google Drive file removed | 302 redirect to 404 | Update file_url in sheet, trigger rebuild |
