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

async function fetchCSV(): Promise<Record<string, string>[]> {
  if (!CSV_URL) {
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
