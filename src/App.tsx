import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import MapPage from './components/MapPage';
import { VintageShop } from './types';
import { parseVintageCSV } from './utils/geo';
import { RAW_VINTAGE_CSV } from './utils/vintageData';

export default function App() {
  const [page, setPage] = useState<'landing' | 'map'>('landing');
  const [shops, setShops] = useState<VintageShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shops');
      if (!response.ok) {
        throw new Error('Server returned non-ok status');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.shops)) {
        setShops(data.shops);
      } else {
        throw new Error('API format mismatch');
      }
    } catch (error) {
      console.warn('API error fetching shops, falling back to local fallback data...', error);
      // Fallback parser mapping to types.ts format
      const rawShops = parseVintageCSV(RAW_VINTAGE_CSV);
      const mappedFallbacks: VintageShop[] = rawShops.map((shop, index) => ({
        id: index + 1,
        name: shop.name,
        type: shop.type,
        district: shop.district,
        year: shop.year,
        address: shop.address,
        phone: shop.phone,
        hours: shop.hours,
        lat: shop.latitude,
        lng: shop.longitude,
        foto: shop.foto
      }));
      setShops(mappedFallbacks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return (
    <>
      {page === 'landing' ? (
        <LandingPage 
          onNavigateToMap={() => setPage('map')} 
          shopCount={shops.length} 
        />
      ) : (
        <MapPage 
          shops={shops} 
          onBackToLanding={() => setPage('landing')} 
          isLoading={loading} 
          onRefresh={fetchShops} 
        />
      )}
    </>
  );
}
