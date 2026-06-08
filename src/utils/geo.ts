/**
 * Types & Utilities for Geocoding and CSV Parsing
 */

export interface VintageShop {
  id: string;
  name: string;
  type: string;
  district: string;
  year: string;
  address: string;
  phone: string;
  hours: string;
  latitude: number;
  longitude: number;
  source: 'csv' | 'nominatim' | 'user';
  isCustom?: boolean;
  foto?: string;
}

/**
 * Parses raw CSV into structured objects.
 */
export function parseVintageCSV(csvText: string): VintageShop[] {
  const shops: VintageShop[] = [];
  
  // Custom CSV parser to handle quotes and commas safely
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    lines.push(currentRow);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim().toLowerCase());
  
  const nameIdx = headers.indexOf('adı');
  const typeIdx = headers.indexOf('mekan türü');
  const districtIdx = headers.indexOf('ilçe adı');
  const yearIdx = headers.indexOf('açılış yılı');
  const addressIdx = headers.indexOf('adres');
  const phoneIdx = headers.indexOf('telefon');
  const hoursIdx = headers.indexOf('çalışma saatleri');
  const coordsIdx = headers.indexOf('cordinates');
  const fotoIdx = headers.findIndex(h => {
    const lh = h.toLowerCase();
    return lh === 'foto' || lh === 'photos';
  });

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < Math.max(nameIdx, typeIdx, districtIdx, addressIdx)) continue;

    const name = row[nameIdx] || 'Bilinmeyen Dükkan';
    const type = row[typeIdx] || 'Vintage Dükkanı';
    const district = row[districtIdx] || 'İstanbul';
    const year = row[yearIdx] || 'Bilinmiyor';
    const address = row[addressIdx] || 'İstanbul, Türkiye';
    const phone = row[phoneIdx] || 'Bilinmiyor';
    const hours = row[hoursIdx] || '10:00 - 20:00';
    const coordsStr = row[coordsIdx] || '';
    const foto = fotoIdx !== -1 ? row[fotoIdx] || '' : '';

    // Parse pre-existing coordinates if available
    let latitude = 41.0082; // Istanbul center default
    let longitude = 28.9784;
    let source: 'csv' | 'nominatim' = 'csv';

    if (coordsStr && coordsStr.includes(',')) {
      const parts = coordsStr.split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        latitude = lat;
        longitude = lng;
      }
    }

    const id = `shop-${i}-${name.replace(/\s+/g, '-').toLowerCase()}`;

    // Look for a cached Nominatim resolved value in localStorage.
    // If we have one, we prioritize the cached Nominatim coordinate!
    const cacheKey = `vintage_geo_cache_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.lat && parsed.lng) {
          latitude = parsed.lat;
          longitude = parsed.lng;
          source = 'nominatim';
        }
      } catch (e) {
        // ignore invalid cache
      }
    }

    shops.push({
      id,
      name,
      type,
      district,
      year,
      address,
      phone,
      hours,
      latitude,
      longitude,
      source,
      foto
    });
  }

  return shops;
}

/**
 * Geocodes a specific shop's address on Nominatim API and caches the result.
 */
export async function geocodeWithNominatim(
  id: string,
  address: string,
  district: string
): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `vintage_geo_cache_${id}`;
  
  // 1. Check local storage cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.lat && parsed.lng) {
        return parsed;
      }
    } catch {
      // ignore empty/broken cache
    }
  }

  // 2. Fetch from Nominatim API
  // We formulate a structured query for high accuracy in Istanbul.
  // Many addresses are detailed, so we query: "address, district, Istanbul, Turkey"
  // If structured search fails, we'll try a relaxed query: "district, Istanbul, Turkey"
  const queries = [
    `${address}, ${district}, İstanbul, Türkiye`,
    `${district} İstanbul, Türkiye`
  ];

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'tr-TR,tr;q=0.9',
          'User-Agent': 'Istanbul-Vintage-Guide-Application-Agent' // Required by Nominatim Terms
        }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify(coords));
        return coords;
      }
    } catch (err) {
      console.error(`Nominatim lookup failed for query "${q}":`, err);
    }
    
    // Brief sleep to respect Nominatim API usage policy (max 1 request per second)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

/**
 * Bulk resolves un-geocoded coordinates using a progress callback to prevent rate limits.
 */
export async function bulkGeocode(
  shops: VintageShop[],
  onProgress: (current: number, total: number, resolvedName: string) => void,
  onComplete: (updatedShops: VintageShop[]) => void,
  onStop: () => void
): Promise<{ stop: () => void }> {
  let active = true;
  
  const stop = () => {
    active = false;
    onStop();
  };

  const processAll = async () => {
    const updated = [...shops];
    const total = shops.length;
    
    for (let i = 0; i < updated.length; i++) {
      if (!active) break;
      
      const shop = updated[i];
      onProgress(i + 1, total, shop.name);
      
      // Call Nominatim resolver
      const coords = await geocodeWithNominatim(shop.id, shop.address, shop.district);
      if (coords && active) {
        updated[i] = {
          ...shop,
          latitude: coords.lat,
          longitude: coords.lng,
          source: 'nominatim'
        };
      }
      
      // Enforce 1000ms pause between external Nominatim API calls to adhere to OSM rate limits
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    
    if (active) {
      onComplete(updated);
    }
  };

  processAll();

  return { stop };
}
