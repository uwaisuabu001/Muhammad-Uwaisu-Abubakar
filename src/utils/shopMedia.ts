/**
 * Utility to resolve high-quality images and logo/avatar presets for Istanbul Vintage shops.
 * Extracts direct images from Google Maps URLs and respects the user's Excel database entries.
 */

// Helper to extract clean direct static image URL from Google Maps links if present in the spreadsheet
export function extractGoogleUserContent(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('http')) return null;

  try {
    const decoded = decodeURIComponent(trimmed);
    const match = decoded.match(/https?:\/\/[a-zA-Z0-9-]+\.googleusercontent\.com\/[^\s\"'!&?#]+/);
    if (match) {
      let extracted = match[0];
      if (extracted.includes('=')) {
        extracted = extracted.split('=')[0] + '=w800-h600-k-no';
      } else {
        extracted = extracted + '=w800-h600-k-no';
      }
      return extracted;
    }
  } catch (e) {
    console.error("Error parsing googleusercontent URL:", e);
  }
  
  return trimmed;
}

// Curated vector-styled geometric color presets for custom-styled shop logo emblems
const LOGO_PRESETS = [
  { bg: 'bg-[#1e130c]', border: 'border-amber-700/60', text: 'text-amber-500' }, // Dark walnut
  { bg: 'bg-[#1c1d1a]', border: 'border-emerald-800/60', text: 'text-emerald-400' }, // Sage moss
  { bg: 'bg-[#21161d]', border: 'border-purple-800/60', text: 'text-purple-400' }, // Antique purple
  { bg: 'bg-[#151a21]', border: 'border-sky-800/60', text: 'text-sky-400' }, // Navy blue
  { bg: 'bg-[#1c1c1c]', border: 'border-stone-800', text: 'text-amber-500' }, // Classic gold-carbon
  { bg: 'bg-[#29171b]', border: 'border-red-800/60', text: 'text-red-400' }, // Ruby wood
];

/**
 * Returns the spreadsheet-provided photo URL or null if empty.
 */
export function getShopPhoto(shop: { name: string; type: string; id: string | number; foto?: string }): string | null {
  if (shop.foto && shop.foto.trim().startsWith('http')) {
    const extracted = extractGoogleUserContent(shop.foto);
    if (extracted) return extracted;
  }
  return null;
}

/**
 * Returns a styling preset for custom initial-letter logos
 */
export function getShopLogoPreset(shopId: string, shopName: string) {
  const hash = Math.abs(hashCode(shopId || shopName));
  return LOGO_PRESETS[hash % LOGO_PRESETS.length];
}

// Simple deterministic string hashing helper
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Escapes values so that they format correctly in Excel/Google Sheets CSV formats
 */
function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads the full dataset as a CSV matching the exact columns in the original Google Sheet.
 * Inserts photographic links directly into the "Foto" column if present.
 */
export function downloadShopsCSV(shops: any[]) {
  const headers = ['Adı', 'Mekan Türü', 'İlçe Adı', 'Açılış Yılı', 'Adres', 'Telefon', 'Çalışma Saatleri', 'cordinates', 'Foto'];
  
  const rows = shops.map(shop => {
    const coords = `${shop.latitude}, ${shop.longitude}`;
    const photoUrl = getShopPhoto(shop) || '';
    return [
      escapeCSVCell(shop.name),
      escapeCSVCell(shop.type),
      escapeCSVCell(shop.district),
      escapeCSVCell(shop.year),
      escapeCSVCell(shop.address),
      escapeCSVCell(shop.phone),
      escapeCSVCell(shop.hours),
      escapeCSVCell(coords),
      escapeCSVCell(photoUrl)
    ];
  });

  // Include Unicode BOM (\uFEFF) for Excel Turkish characters compatibility
  const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "istanbul_vintage_spots_photo_enriched.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates newline-separated URLs matching rows 2-101 exactly,
 * allowing instant column-paste (select cell I2 in Sheets, hit paste, and the whole column fills up!).
 * If there is no photo, copies empty line.
 */
export function getPhotoColumnLines(shops: any[]): string {
  return shops.map(shop => getShopPhoto(shop) || '').join('\n');
}
