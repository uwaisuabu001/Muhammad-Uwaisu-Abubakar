import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure cache directory exists
  const cacheDir = path.join(process.cwd(), "src", "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cacheFilePath = path.join(cacheDir, "coordinates_cache.json");
  let coordinatesCache: Record<string, { lat: number; lng: number }> = {};

  if (fs.existsSync(cacheFilePath)) {
    try {
      coordinatesCache = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
    } catch (e) {
      console.error("Error reading cache file, resetting cache", e);
      coordinatesCache = {};
    }
  }

  // Robust custom CSV parser to handle quotes, commas, and newlines
  function parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

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
        if (currentRow.length > 1 || currentRow[0] !== "") {
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
    return lines;
  }

  // Sleep utility for Nominatim rate limiting
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Geocoding helper with caching and OSM Nominatim rate limit safety
  async function getCoordinates(
    shopName: string,
    district: string,
    address: string
  ): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `${shopName} - ${district}`.toLowerCase().trim();
    
    // Check cache first
    if (coordinatesCache[cacheKey]) {
      return coordinatesCache[cacheKey];
    }

    // nominatim lookup logic
    try {
      console.log(`Geocoding with Nominatim: ${shopName} in ${district}`);
      // OSM Nominatim requires an explicit User-Agent
      const searchQueries = [
        `${shopName}, ${district}, Istanbul, Turkey`,
        `${address}, ${district}, Istanbul, Turkey`,
        `${district}, Istanbul, Turkey`
      ];

      for (const query of searchQueries) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "IstanbulVintageShopsNavigator/1.0 (uwaisuabu001@gmail.com)"
            }
          }
        );

        if (response.ok) {
          const results = await response.json() as any[];
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            const coords = { lat, lng };
            
            // Save to memory cache and write to file
            coordinatesCache[cacheKey] = coords;
            fs.writeFileSync(cacheFilePath, JSON.stringify(coordinatesCache, null, 2), "utf8");
            
            // Respect Nominatim rate limits (max 1 request per sec)
            await sleep(1000);
            return coords;
          }
        }
        await sleep(1000);
      }
    } catch (err) {
      console.error(`Failed to geocode: ${shopName}`, err);
    }

    return null;
  }

  // Debug route to list Google Sheets tabs/sheets and their GIDs
  app.get("/api/sheets", async (req, res) => {
    try {
      const url = "https://docs.google.com/spreadsheets/d/162-T2YiFXaXQvx1ycfFskSAZohMkOW2Mvxmkx4ckWu8/htmlview";
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(500).json({ success: false, error: "Failed to fetch spreadsheet HTML" });
      }
      const html = await response.text();
      
      const sheetsFound: Record<string, string> = {};
      
      // Try multiple regex patterns to find sheet tabs and matching gids
      const tabRegex = /<li[^>]*id="sheet-button-([0-9]+)"[^>]*>\s*<a[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = tabRegex.exec(html)) !== null) {
        sheetsFound[match[1]] = match[2].trim();
      }

      const hrefRegex = /gid=([0-9]+)[^>]*>(.*?)<\/a>/g;
      while ((match = hrefRegex.exec(html)) !== null) {
        const text = match[2].replace(/<[^>]*>?/gm, '').trim();
        if (text && !text.includes("Report Abuse")) {
          sheetsFound[match[1]] = text;
        }
      }

      const bootstrapRegex = /"sheetId":\s*([0-9]+),\s*"title":\s*"([^"]+)"/g;
      while ((match = bootstrapRegex.exec(html)) !== null) {
        sheetsFound[match[1]] = match[2];
      }

      const sheetsList = Object.keys(sheetsFound).map(gid => ({
        gid,
        name: sheetsFound[gid]
      }));

      res.json({
        success: true,
        sheets: sheetsList,
        debugLength: html.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API router to fetch, process, cache, and serve vintage shops
  app.get("/api/shops", async (req, res) => {
    try {
      const googleSheetUrl =
        "https://docs.google.com/spreadsheets/d/162-T2YiFXaXQvx1ycfFskSAZohMkOW2Mvxmkx4ckWu8/export?format=csv&gid=323722995";

      const response = await fetch(googleSheetUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch Google Sheets CSV data");
      }

      const csvText = await response.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        return res.status(500).json({ success: false, message: "Parsed CSV is empty" });
      }

      const headers = rows[0].map(h => h.trim());
      const shopNameIdx = headers.indexOf("Adı");
      const shopTypeIdx = headers.indexOf("Mekan Türü");
      const districtIdx = headers.indexOf("İlçe Adı");
      const openYearIdx = headers.indexOf("Açılış Yılı");
      const addressIdx = headers.indexOf("Adres");
      const phoneIdx = headers.indexOf("Telefon");
      const hoursIdx = headers.indexOf("Çalışma Saatleri");
      const coordsIdx = headers.indexOf("cordinates");
      const fotoIdx = headers.findIndex(h => {
        const lh = h.toLowerCase();
        return lh === "foto" || lh === "photos";
      });

      const processedShops = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;

        const name = row[shopNameIdx] || "Bilinmeyen Mağaza";
        const type = row[shopTypeIdx] || "Vintage Giyim";
        const district = row[districtIdx] || "İstanbul";
        const year = row[openYearIdx] || "Bilinmiyor";
        const address = row[addressIdx] || "";
        const phone = row[phoneIdx] || "Bilinmiyor";
        const hours = row[hoursIdx] || "Bilinmiyor";
        const coordsText = row[coordsIdx] || "";
        const foto = fotoIdx !== -1 ? row[fotoIdx] || "" : "";

        let lat = 0;
        let lng = 0;
        let coordsFound = false;

        // Try parsing coordinates from the sheet
        if (coordsText && coordsText.includes(",")) {
          const parts = coordsText.split(",");
          const parsedLat = parseFloat(parts[0].trim());
          const parsedLng = parseFloat(parts[1].trim());
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
            coordsFound = true;
          }
        }

        // Nominatim Geocoding fallback
        if (!coordsFound) {
          const geoData = await getCoordinates(name, district, address);
          if (geoData) {
            lat = geoData.lat;
            lng = geoData.lng;
            coordsFound = true;
          }
        }

        // If still not of coords, set default coordinates (e.g. Beyoğlu center coords as placeholder)
        if (!coordsFound) {
          lat = 41.0315;
          lng = 28.9812;
        }

        processedShops.push({
          id: i,
          name,
          type,
          district,
          year,
          address,
          phone,
          hours,
          lat,
          lng,
          foto,
        });
      }

      res.json({
        success: true,
        count: processedShops.length,
        shops: processedShops,
      });
    } catch (err: any) {
      console.error("API error fetching shops:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Serve static client assets or use Vite development server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
