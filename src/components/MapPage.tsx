import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { VintageShop } from "../types";
import { 
  ArrowLeft, Search, MapPin, Phone, Clock, Calendar, 
  Compass, RefreshCw, Layers, SlidersHorizontal, Info, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapPageProps {
  shops: VintageShop[];
  onBackToLanding: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function MapPage({ shops, onBackToLanding, isLoading, onRefresh }: MapPageProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  
  // Custom theme filter for map visual effects
  const [isOldMapEffect, setIsOldMapEffect] = useState(true);
  const [mapStyle, setMapStyle] = useState<"dark" | "standard">("dark");
  const [tileLayerRef, setTileLayerRef] = useState<L.TileLayer | null>(null);

  // Selected shop for highlighting in list
  const [activeShopId, setActiveShopId] = useState<number | null>(null);

  // Extract unique districts and types for filter dropdowns
  const districts = ["all", ...Array.from(new Set(shops.map((s) => s.district))).sort()];
  const types = ["all", ...Array.from(new Set(shops.map((s) => s.type))).sort()];

  // Filtered lists
  const filteredShops = shops.filter((shop) => {
    const matchesSearch = 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDistrict = selectedDistrict === "all" || shop.district === selectedDistrict;
    const matchesType = selectedType === "all" || shop.type === selectedType;

    return matchesSearch && matchesDistrict && matchesType;
  });

  // 1. Initialize Map Instance (Only Once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Istanbul
    const centerLatLng: L.LatLngExpression = [41.015, 28.979];
    
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // will add customized zoom control at specific position
    }).setView(centerLatLng, 12);

    mapInstanceRef.current = map;

    // Standard Zoom Control placement
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial tile layer loader
    const tileUrl = mapStyle === "dark" 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = mapStyle === "dark"
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, { attribution }).addTo(map);
    setTileLayerRef(tiles);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle map style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const tileUrl = mapStyle === "dark" 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = mapStyle === "dark"
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';

    // Remove existing layer
    if (tileLayerRef) {
      map.removeLayer(tileLayerRef);
    }

    const newTiles = L.tileLayer(tileUrl, { attribution }).addTo(map);
    setTileLayerRef(newTiles);
  }, [mapStyle]);

  // 3. Render and Update Leaflet markers on filter/shop state change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    filteredShops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      // Classy custom SVG divicon resembling vintage seal/pin
      const customIcon = L.divIcon({
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center rounded-full bg-stone-900 border-2 border-amber-500 shadow-[0_4px_10px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 duration-200 transition-all cursor-pointer ${
            activeShopId === shop.id ? "ring-4 ring-amber-400 border-amber-300" : ""
          }">
            <div class="w-2.5 h-2.5 bg-amber-500 rounded-full ${activeShopId === shop.id ? "animate-ping" : ""}"></div>
            <div class="absolute -bottom-1 w-2 h-2 bg-stone-900 rotate-45 border-r border-b border-amber-500"></div>
          </div>
        `,
        className: "custom-vintage-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      // Bind dynamic Popup with elegant styles
      const popupContent = `
        <div class="font-sans text-stone-200" style="min-width: 220px;">
          <div class="border-b border-amber-600/30 pb-2 mb-2 flex items-start justify-between">
            <div>
              <h3 class="font-serif font-bold text-amber-400 text-sm leading-tight">${shop.name}</h3>
              <p class="text-[10px] text-amber-600 font-mono tracking-wider font-semibold uppercase mt-0.5">${shop.type}</p>
            </div>
            <span class="text-[10px] bg-amber-950/80 text-amber-500 border border-amber-800/30 px-1.5 py-0.5 rounded font-mono font-bold">${shop.year}</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <p class="flex items-start gap-1">
              <strong class="text-amber-600/80 font-semibold shrink-0">📍 Adres:</strong>
              <span class="text-stone-300 leading-normal">${shop.address}</span>
            </p>
            <p class="flex items-center gap-1">
              <strong class="text-amber-600/80 font-semibold">📞 Tel:</strong>
              <a href="tel:${shop.phone}" class="text-amber-400 hover:underline hover:text-amber-300">${shop.phone}</a>
            </p>
            <p class="flex items-center gap-1">
              <strong class="text-amber-600/80 font-semibold">⏰ Saat:</strong>
              <span class="text-stone-300">${shop.hours}</span>
            </p>
            <p class="flex items-center gap-1">
              <strong class="text-amber-600/80 font-semibold">🏛️ Semt:</strong>
              <span class="text-stone-300 px-1.5 py-0.2 bg-stone-800 text-[10px] uppercase rounded font-bold tracking-wider">${shop.district}</span>
            </p>
          </div>
        </div>
      `;

      const marker = L.marker([shop.lat, shop.lng], { icon: customIcon })
        .addTo(map)
        .bindTooltip(`
          <div class="px-1 text-center font-serif font-bold">
            <div class="text-stone-100 text-xs">${shop.name}</div>
            <div class="text-amber-500 text-[10px] uppercase font-mono tracking-wider mt-0.5">${shop.district}</div>
          </div>
        `, {
          direction: "top",
          sticky: true,
          className: "custom-vintage-tooltip"
        })
        .bindPopup(popupContent);

      // Synced state on popup interaction
      marker.on("click", () => {
        setActiveShopId(shop.id);
        map.setView([shop.lat, shop.lng], 15);
      });

      markersRef.current[shop.id] = marker;
    });

    // Fit map bounds to show all markers if any match
    if (filteredShops.length > 0 && searchTerm === "" && selectedDistrict === "all" && selectedType === "all") {
      // Just keep normal zoom
    } else if (filteredShops.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [filteredShops, activeShopId]);

  // Click handler for sidebar shop cards
  const handleShopSelectInSidebar = (shop: VintageShop) => {
    setActiveShopId(shop.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([shop.lat, shop.lng], 16);
      const marker = markersRef.current[shop.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row bg-[#080706] text-stone-200 overflow-hidden font-sans">
      
      {/* Sidebar - Shop Filters and Match List */}
      <aside className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-amber-900/20 bg-[#0c0a08] flex flex-col z-10 shadow-2xl relative">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-amber-900/20 bg-[#0f0d0a]">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 group text-stone-400 hover:text-amber-500 transition-colors text-xs font-semibold uppercase tracking-wider mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Açılış Sayfası
          </button>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-cinzel tracking-widest text-lg font-bold text-amber-500 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500 shrink-0" />
              VİNTAGE REHBERİ
            </h1>
            <span className="text-xs bg-amber-950 px-2.5 py-1 rounded-full border border-amber-900/40 text-amber-400 font-semibold font-mono">
              {filteredShops.length} Dükkan
            </span>
          </div>
          <p className="text-xs text-stone-400 font-serif italic">Zaman tünelinde yolunuzu bulun, semt semt vintage dükkanları haritalayın.</p>
        </div>

        {/* Filters Panel */}
        <div className="p-4 border-b border-amber-900/15 bg-[#0e0c09] space-y-3.5">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Dükkan, adres veya semt ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#13100c] border border-amber-900/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Semt filter */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-amber-600/80 tracking-widest block font-mono pl-0.5">Semt (İlçe)</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-[#13100c] border border-amber-900/30 rounded-xl px-2.5 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
              >
                <option value="all">Farketmez (Tümü)</option>
                {districts.filter(d => d !== "all").map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Tür filter */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-amber-600/80 tracking-widest block font-mono pl-0.5">Mekan Türü</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#13100c] border border-amber-900/30 rounded-xl px-2.5 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-medium"
              >
                <option value="all">Farketmez (Tümü)</option>
                {types.filter(t => t !== "all").map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Shops Card List */}
        <div className="flex-1 overflow-y-auto divide-y divide-amber-950/20 bg-[#0a0907]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-48 space-y-3">
              <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
              <p className="text-sm text-stone-400 font-serif italic">İstanbul dükkanları ve koordinatları taranıyor...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-12 text-center text-stone-500 text-sm space-y-2">
              <Info className="w-8 h-8 text-amber-600/50 mx-auto" />
              <p className="font-serif">Aradığınız kriterlerde dükkan bulunamadı.</p>
              <button 
                onClick={() => { setSearchTerm(""); setSelectedDistrict("all"); setSelectedType("all"); }}
                className="text-xs text-amber-500 hover:underline mt-2 font-semibold"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => handleShopSelectInSidebar(shop)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer transform hover:-translate-y-0.5 ${
                    activeShopId === shop.id
                      ? "bg-gradient-to-br from-amber-950/40 to-stone-900/40 border-amber-500/60 shadow-lg"
                      : "bg-[#110f0d]/80 border-amber-950/40 hover:border-amber-800/20 hover:bg-[#161411]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className={`font-serif font-bold text-sm leading-tight ${
                      activeShopId === shop.id ? "text-amber-400" : "text-stone-200 hover:text-amber-500"
                    }`}>
                      {shop.name}
                    </h3>
                    <span className="text-[10px] shrink-0 font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-900/30 text-amber-500">
                      {shop.year}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-serif italic mb-2.5">
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>{shop.type}</span>
                    <span className="text-amber-800/40">•</span>
                    <span className="uppercase text-[9px] font-bold font-mono tracking-wider bg-stone-900 px-1 py-0.2 rounded border border-amber-950/40 text-stone-300">
                      {shop.district}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-400 border-t border-amber-900/10 pt-2 font-sans">
                    <p className="flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{shop.address}</span>
                    </p>
                    {activeShopId === shop.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5 pt-1.5 border-t border-amber-900/5 mt-1.5 overflow-hidden"
                      >
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <a href={`tel:${shop.phone}`} className="hover:underline text-amber-400">{shop.phone}</a>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{shop.hours}</span>
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Map Display & Controls Panel */}
      <section className="flex-1 relative h-[50vh] md:h-auto min-h-[300px]">
        {/* Retro style Sepia overlay container based on checkmark */}
        <div 
          ref={mapContainerRef} 
          className={`w-full h-full z-0 transition-all duration-300 ${isOldMapEffect ? "sepia-65 contrast-105 brightness-95 hue-rotate-[-8deg]" : ""}`}
        />

        {/* Map View Custom Control Widgets Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
          {/* Back button overlay */}
          <button
            onClick={onBackToLanding}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[#0c0a08]/90 border border-amber-600/30 text-amber-500 hover:text-amber-400 shadow-xl"
            title="Açılış Sayfası"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Controls Dashboard (Right Top) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col sm:flex-row gap-2 pointer-events-auto">
          {/* Map theme style toggle button */}
          <button
            onClick={() => setMapStyle(prev => prev === "dark" ? "standard" : "dark")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c0a08]/90 border border-amber-900/30 shadow-lg text-xs font-semibold uppercase tracking-wider text-amber-400 hover:border-amber-500 hover:bg-[#12100d] transition-all cursor-pointer backdrop-blur"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapStyle === "dark" ? "Gece Haritası" : "Sokak Haritası"}</span>
          </button>

          {/* Sepia vintage effect toggle button */}
          <button
            onClick={() => setIsOldMapEffect(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer backdrop-blur ${
              isOldMapEffect 
                ? "bg-amber-950/80 border-amber-500 text-amber-400" 
                : "bg-[#0c0a08]/90 border-amber-900/30 text-stone-400 hover:border-amber-500"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Eski Kağıt Efekti</span>
          </button>

          {/* Refresh CSV data */}
          <button
            onClick={onRefresh}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0c0a08]/90 border border-amber-900/30 text-amber-400 hover:text-amber-300 hover:border-amber-500 shadow-lg transition-all cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Vintage Aesthetic Frame Ornament around map (Desktop only) */}
        <div className="absolute right-4 bottom-14 z-10 hidden md:flex flex-col p-4 w-60 rounded-2xl bg-[#0d0c0a]/95 border border-amber-800/30 shadow-2xl backdrop-blur-md pointer-events-auto select-none font-serif">
          <div className="border-b border-amber-900/30 pb-2 mb-2 flex items-center justify-between">
            <span className="font-cinzel text-xs text-amber-400 tracking-widest font-bold">ZAMAN PUSULASI</span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
            Haritadaki dükkan simgelerine dokunarak detayları görüntüleyebilir, fareyi üzerlerinde tutarak isimlerini görebilirsiniz.
          </p>
          <div className="flex gap-2.5 items-center mt-3 pt-2.5 border-t border-amber-900/10 font-sans text-[10px]">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-950 shadow-[0_0_4px_#f59e0b]"></div>
            <span className="text-stone-500 tracking-wide font-medium">Aktif Seçilmeyen Vintage Noktası</span>
          </div>
        </div>
      </section>
    </div>
  );
}
