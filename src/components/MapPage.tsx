import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { VintageShop } from "../types";
import { 
  ArrowLeft, Search, MapPin, Phone, Clock, Calendar, 
  Compass, RefreshCw, Layers, SlidersHorizontal, Info, Tag,
  Menu, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getShopPhoto, getShopLogoPreset } from "../utils/shopMedia";

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

    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 150);

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
    <div className="absolute inset-0 bg-[#080706] text-stone-200 overflow-hidden font-sans w-full h-full select-none animate-fade-in">
      
      {/* Map Container - Full Screen Background */}
      <div 
        ref={mapContainerRef} 
        className={`absolute inset-0 w-full h-full z-0 transition-all duration-300 ${isOldMapEffect ? "sepia-65 contrast-105 brightness-95 hue-rotate-[-8deg]" : ""}`}
      />

      {/* Top Left Floating Header & Search Bar Widget */}
      <div className="absolute top-4 left-4 z-[1001] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-[calc(100vw-32px)]">
        {/* Back To Landing Button */}
        <button
          onClick={onBackToLanding}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0c0a08]/95 backdrop-blur-md border border-amber-500/35 text-amber-500 hover:text-amber-400 hover:border-amber-400 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          title="Açılış Sayfası"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Search Input Container */}
        <div className="relative w-64 sm:w-80 shadow-2xl shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Dükkan veya semt ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0a08]/95 backdrop-blur-md border border-amber-900/40 rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Controls Dashboard (Right Top) */}
      <div className="absolute top-4 right-4 z-[1001] flex flex-col sm:flex-row gap-2 pointer-events-auto">
        {/* Map theme style toggle button */}
        <button
          onClick={() => setMapStyle(prev => prev === "dark" ? "standard" : "dark")}
          className="flex items-center gap-2 px-3 py-2 h-10 rounded-xl bg-[#0c0a08]/95 backdrop-blur-md border border-amber-900/40 shadow-2xl text-xs font-semibold uppercase tracking-wider text-amber-400 hover:border-amber-500 hover:bg-[#12100d] transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{mapStyle === "dark" ? "Gece Haritası" : "Sokak Haritası"}</span>
        </button>

        {/* Sepia vintage effect toggle button */}
        <button
          onClick={() => setIsOldMapEffect(prev => !prev)}
          className={`flex items-center gap-2 px-3 py-2 h-10 rounded-xl border shadow-2xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 ${
            isOldMapEffect 
              ? "bg-amber-950/80 border-amber-500 text-amber-400" 
              : "bg-[#0c0a08]/95 border-amber-900/40 text-stone-400 hover:border-amber-500 font-medium"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eski Kağıt Efekti</span>
        </button>

        {/* Refresh CSV data */}
        <button
          onClick={onRefresh}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0c0a08]/95 border border-amber-900/40 text-amber-400 hover:text-amber-300 hover:border-amber-300 hover:border-amber-500 shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Verileri Yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom Card List Slider (list of places) */}
      <div className="absolute bottom-6 left-4 right-4 z-[1001] pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          {/* Floating Shops Counter Label */}
          <div className="flex items-center justify-between px-1 pointer-events-auto">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase bg-[#0c0a08]/95 backdrop-blur-md px-3 py-1 rounded-full border border-amber-900/40 shadow-xl">
              {filteredShops.length} Vintage Dükkanı Haritalandı
            </span>
          </div>
          
          {/* Horizontally scrolling list of places */}
          <div className="w-full overflow-x-auto pointer-events-auto flex gap-3.5 py-1 px-0.5 scroll-smooth snap-x scrollbar-thin scrollbar-thumb-amber-950/80 scrollbar-track-transparent">
            {isLoading ? (
              <div className="snap-start shrink-0 w-80 h-28 bg-[#0c0a08]/95 backdrop-blur-md rounded-2xl border border-amber-900/30 flex items-center justify-center gap-3 shadow-xl">
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="text-xs text-stone-400 font-serif italic">Yükleniyor...</span>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="snap-start shrink-0 w-80 h-28 bg-[#0c0a08]/95 backdrop-blur-md rounded-2xl border border-amber-900/30 flex flex-col items-center justify-center p-4 text-center gap-1 shadow-xl">
                <Info className="w-5 h-5 text-amber-600/60" />
                <p className="text-xs text-stone-400 font-serif">Kriterlere uygun dükkan kaydı bulunamadı.</p>
                <button 
                  onClick={() => setSearchTerm("")}
                  className="text-[10px] text-amber-500 hover:underline font-semibold"
                >
                  Aramayı Sıfırla
                </button>
              </div>
            ) : (
              filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => handleShopSelectInSidebar(shop)}
                  className={`snap-start shrink-0 w-72 sm:w-80 h-28 p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 shadow-[0_12px_36px_rgba(0,0,0,0.7)] group ${
                    activeShopId === shop.id
                      ? "bg-gradient-to-br from-amber-950/95 to-stone-900/95 border-amber-500 shadow-[0_12px_40px_rgba(245,158,11,0.2)] -translate-y-1.5"
                      : "bg-[#0c0a08]/95 backdrop-blur-md border-amber-950/65 hover:border-amber-800/60 hover:bg-[#12100d] hover:-translate-y-1"
                  }`}
                >
                  {/* Photo Thumbnail or Badge Icon */}
                  <div className="w-20 h-full rounded-xl overflow-hidden shrink-0 border border-amber-900/25 relative bg-stone-950 shadow-inner">
                    {getShopPhoto(shop) ? (
                      <img 
                        src={getShopPhoto(shop) || ""} 
                        alt={shop.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-serif text-lg font-bold ${getShopLogoPreset(String(shop.id), shop.name).bg} ${getShopLogoPreset(String(shop.id), shop.name).text} border-2 ${getShopLogoPreset(String(shop.id), shop.name).border}`}>
                        {shop.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Shop Text Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className={`font-serif font-bold text-xs sm:text-sm leading-tight truncate transition-colors ${
                          activeShopId === shop.id ? "text-amber-400" : "text-stone-200 group-hover:text-amber-500"
                        }`}>
                          {shop.name}
                        </h3>
                        <span className="text-[9px] shrink-0 font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-900/40 text-amber-500">
                          {shop.year}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-stone-400 font-serif italic">
                        <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{shop.type}</span>
                        <span className="text-amber-800/40">•</span>
                        <span className="uppercase text-[8px] font-bold font-mono tracking-wider bg-stone-900 px-1 py-0.2 rounded border border-amber-950/40 text-stone-300 truncate font-semibold">
                          {shop.district}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-400 space-y-0.5 border-t border-amber-900/10 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate text-stone-500">{shop.hours}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vintage Aesthetic Frame Ornament around map (Desktop only) */}
      <div className="absolute right-4 bottom-40 z-[1001] hidden lg:flex flex-col p-4 w-60 rounded-2xl bg-[#0d0c0a]/95 border border-amber-800/30 shadow-2xl backdrop-blur-md pointer-events-auto select-none font-serif">
        <div className="border-b border-amber-900/30 pb-2 mb-2 flex items-center justify-between">
          <span className="font-cinzel text-xs text-amber-400 tracking-widest font-bold">ZAMAN PUSULASI</span>
          <Compass className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
          Haritadaki dükkan simgelerine dokunarak detayları görüntüleyebilir, fareyi üzerlerinde tutarak isimlerini görebilirsiniz.
        </p>
        <div className="flex gap-2.5 items-center mt-3 pt-2.5 border-t border-amber-900/10 font-sans text-[10px]">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-950 shadow-[0_0_4px_#f59e0b]"></div>
          <span className="text-stone-500 tracking-wide font-medium">Vintage Noktaları</span>
        </div>
      </div>
    </div>
  );
}
