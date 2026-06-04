import type { Design, DesignWithFile } from './types';

const CSV_URL = import.meta.env.GOOGLE_SHEET_CSV_URL || process.env.GOOGLE_SHEET_CSV_URL || '';

/**
 * Parse a CSV line handling quoted fields with commas inside them.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped double quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse raw CSV text into an array of raw row objects.
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split('\n')
    .map(l => l.replace(/\r$/, ''))
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function rowToDesign(row: Record<string, string>): Design {
  return {
    ma_mau: row['ma_mau'] ?? '',
    ten: row['ten'] ?? '',
    loai: (row['loai'] as Design['loai']) ?? 'nha-pho',
    dien_tich_dat: parseFloat(row['dien_tich_dat'] ?? '0') || 0,
    so_tang: parseInt(row['so_tang'] ?? '0', 10) || 0,
    so_phong_ngu: parseInt(row['so_phong_ngu'] ?? '0', 10) || 0,
    phong_cach: row['phong_cach'] ?? '',
    huong: row['huong'] ?? '',
    chi_phi_xay_du_kien: parseFloat(row['chi_phi_xay_du_kien'] ?? '0') || 0,
    gia_ban_ho_so: parseFloat(row['gia_ban_ho_so'] ?? '0') || 0,
    anh_url: row['anh_url'] ?? '',
    mo_ta: row['mo_ta'] ?? '',
    trang_thai: (row['trang_thai'] as Design['trang_thai']) ?? 'draft',
  };
}

function rowToDesignWithFile(row: Record<string, string>): DesignWithFile {
  return {
    ...rowToDesign(row),
    file_url: row['file_url'] ?? '',
  };
}

const DEV_SAMPLE_ROWS: Record<string, string>[] = [
  {
    ma_mau: 'NP-01', ten: 'Nhà Phố Hiện Đại 2 Tầng — Mặt Tiền 5m', loai: 'nha-pho',
    dien_tich_dat: '60', so_tang: '2', so_phong_ngu: '3', phong_cach: 'hien-dai',
    huong: 'dong-nam', chi_phi_xay_du_kien: '890000000', gia_ban_ho_so: '4500000',
    anh_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    mo_ta: 'Mẫu nhà phố 2 tầng thiết kế hiện đại tối giản với mặt tiền 5m. Tầng 1 gồm phòng khách liên thông bếp, 1 phòng ngủ phụ. Tầng 2 có 2 phòng ngủ chính với ban công riêng.',
    file_url: 'https://drive.google.com/uc?id=SAMPLE_FILE_ID_01&export=download', trang_thai: 'active',
  },
  {
    ma_mau: 'BT-01', ten: 'Biệt Thự Vườn Cổ Điển Pháp 3 Tầng', loai: 'biet-thu',
    dien_tich_dat: '250', so_tang: '3', so_phong_ngu: '5', phong_cach: 'biet-thu-phap',
    huong: 'nam', chi_phi_xay_du_kien: '4500000000', gia_ban_ho_so: '12000000',
    anh_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    mo_ta: 'Biệt thự vườn 3 tầng phong cách Pháp cổ điển sang trọng, phù hợp với lô đất 200-300m².',
    file_url: 'https://drive.google.com/uc?id=SAMPLE_FILE_ID_02&export=download', trang_thai: 'active',
  },
  {
    ma_mau: 'NP-02', ten: 'Nhà Phố Tân Cổ Điển 3 Tầng — Mặt Tiền 6m', loai: 'nha-pho',
    dien_tich_dat: '80', so_tang: '3', so_phong_ngu: '4', phong_cach: 'tan-co-dien',
    huong: 'tay-nam', chi_phi_xay_du_kien: '1800000000', gia_ban_ho_so: '6000000',
    anh_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
    mo_ta: 'Nhà phố 3 tầng phong cách tân cổ điển với mặt tiền 6m. Chi tiết cornice, cột tròn và cửa sổ vòm trang trí mặt tiền.',
    file_url: 'https://drive.google.com/uc?id=SAMPLE_FILE_ID_03&export=download', trang_thai: 'active',
  },
];

async function fetchCSV(): Promise<Record<string, string>[]> {
  if (!CSV_URL) {
    if (import.meta.env.DEV) {
      console.info('[sheets] DEV mode — using sample data (set GOOGLE_SHEET_CSV_URL to use real sheet)');
      return DEV_SAMPLE_ROWS;
    }
    console.warn('[sheets] GOOGLE_SHEET_CSV_URL not set, returning empty dataset');
    return [];
  }

  const res = await fetch(CSV_URL, {
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseCSV(text);
}

/**
 * Fetch a single active design by ma_mau — safe for public use (no file_url).
 */
export async function fetchDesign(ma_mau: string): Promise<Design | null> {
  const rows = await fetchCSV();
  const row = rows.find(r => r['ma_mau'] === ma_mau && r['trang_thai'] === 'active');
  if (!row) return null;
  return rowToDesign(row);
}

/**
 * Fetch all active designs (without file_url) — safe for public use.
 */
export async function fetchDesigns(): Promise<Design[]> {
  const rows = await fetchCSV();
  return rows
    .filter(row => row['trang_thai'] === 'active' && row['ma_mau'])
    .map(rowToDesign);
}

/**
 * Fetch a single design including file_url — server-side use only.
 * file_url must never be sent to the browser.
 */
export async function fetchDesignWithFile(ma_mau: string): Promise<DesignWithFile | null> {
  const rows = await fetchCSV();
  const row = rows.find(r => r['ma_mau'] === ma_mau && r['trang_thai'] === 'active');
  if (!row) return null;
  return rowToDesignWithFile(row);
}
