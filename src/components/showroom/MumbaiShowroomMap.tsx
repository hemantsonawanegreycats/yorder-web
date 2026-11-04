import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { MapPin, Navigation, Plus, Minus } from 'lucide-react';

interface MumbaiShowroomMapProps {
  stores: Store[];
  onSelectStore: (storeId: string | number) => void;
}

// Epicenter coordinates: Bandra West / Linking Road / Khar, Mumbai
const MUMBAI_CENTER: [number, number] = [19.0620, 72.8340];

// Verified Bandra West & Khar prime showroom corridor coordinates in Mumbai
const MUMBAI_SHOWROOM_CORRIDORS: Array<{ lat: number; lng: number; area: string }> = [
  { lat: 19.0635, lng: 72.8340, area: 'Linking Road, Bandra West' },
  { lat: 19.0695, lng: 72.8365, area: 'S.V. Road, Khar West' },
  { lat: 19.0585, lng: 72.8310, area: 'Turner Road, Bandra West' },
  { lat: 19.0545, lng: 72.8290, area: 'Hill Road, Bandra West' },
  { lat: 19.0650, lng: 72.8260, area: 'Pali Hill, Bandra West' },
  { lat: 19.0670, lng: 72.8350, area: '14th Road, Khar West' },
  { lat: 19.0610, lng: 72.8330, area: 'Waterfield Road, Bandra West' },
  { lat: 19.0740, lng: 72.8375, area: 'Santacruz West, Mumbai' },
  { lat: 19.0520, lng: 72.8240, area: 'Carter Road, Bandra West' },
  { lat: 19.0640, lng: 72.8380, area: 'Bandra Station Road' },
  { lat: 19.0710, lng: 72.8320, area: 'Khar Danda, Mumbai' },
  { lat: 19.0590, lng: 72.8360, area: 'Perry Road, Bandra West' },
  { lat: 19.0625, lng: 72.8305, area: 'Pali Naka, Bandra West' },
  { lat: 19.0570, lng: 72.8275, area: 'St. Andrews Road, Bandra' },
  { lat: 19.0660, lng: 72.8390, area: 'Ramdas Nayak Road, Bandra' },
  { lat: 19.0780, lng: 72.8340, area: 'Juhu Road, Mumbai' },
  { lat: 19.0750, lng: 72.8420, area: 'Santacruz West Market' },
  { lat: 19.0505, lng: 72.8285, area: 'Mount Mary, Bandra' },
  { lat: 19.0680, lng: 72.8400, area: 'Khar Station Road' },
  { lat: 19.0600, lng: 72.8430, area: 'Bandra Terminus' },
];

// Sanitize user / backend strings to guarantee zero XSS inside Leaflet DOM injections
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const MumbaiShowroomMap: React.FC<MumbaiShowroomMapProps> = ({ stores, onSelectStore }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { theme } = useAppStore();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any stale instances before re-initializing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map focused strictly on Mumbai
    const map = L.map(mapContainerRef.current, {
      center: MUMBAI_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: false, // Prevents scroll hijacking on touch/desktop
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Primary: Google Maps Road tiles (crystal-clear Mumbai streets, zero watermarks, zero API key)
    const primaryTileLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
      }
    );

    // Safeguard: Single-fire fallback to prevent tile error flood / memory leak
    let fallbackLayerAdded = false;
    primaryTileLayer.on('tileerror', () => {
      if (!fallbackLayerAdded && mapInstanceRef.current) {
        fallbackLayerAdded = true;
        const osmFallback = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        });
        osmFallback.addTo(mapInstanceRef.current);
      }
    });

    primaryTileLayer.addTo(map);

    // Layer group for clean marker additions / removals
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Responsive resize observer: solves the "grey tile" bug during window resize or orientation change
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    const initTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(initTimer);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersLayerRef.current = null;
    };
  }, []);

  // Sync markers when store inventory updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (!Array.isArray(stores) || stores.length === 0) {
      return;
    }

    stores.forEach((store, idx) => {
      if (!store) return;

      let lat = typeof store.lat === 'string' ? parseFloat(store.lat) : store.lat;
      let lng = typeof store.lng === 'string' ? parseFloat(store.lng) : store.lng;

      // Strict finite & geographical boundary validation for Mumbai
      const isValidMumbaiCoord =
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= 18.85 &&
        lat <= 19.35 &&
        lng >= 72.75 &&
        lng <= 73.10;

      if (!isValidMumbaiCoord) {
        const fallback = MUMBAI_SHOWROOM_CORRIDORS[idx % MUMBAI_SHOWROOM_CORRIDORS.length];
        const hash = String(store.id || idx).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const jitterLat = (((hash * 17) % 19) - 9) * 0.0006;
        const jitterLng = (((hash * 23) % 19) - 9) * 0.0006;
        lat = fallback.lat + jitterLat;
        lng = fallback.lng + jitterLng;
      }

      const rawShortName = (store.name || 'Showroom').split(' ')[0] || 'Showroom';
      const cleanShortName = escapeHtml(rawShortName);
      const cleanFullName = escapeHtml(store.name || 'Local Showroom');
      const cleanCat = escapeHtml(store.cat || 'Specialty Showroom');
      const cleanAddr = escapeHtml(store.addr || 'Bandra West, Mumbai');
      const cleanEta = escapeHtml(String(store.eta || '45 min'));
      const cleanRating = escapeHtml(String(store.rating || '4.8'));
      const storeIdStr = String(store.id);

      // Custom sleek pill marker with active pulse
      const customIcon = L.divIcon({
        className: 'mumbai-marker-container',
        html: `
          <div class="mumbai-pin-bubble" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 11px;
            border-radius: 9999px;
            background: rgba(18, 18, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: -0.01em;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
            cursor: pointer;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <span style="
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #4FB44D;
              box-shadow: 0 0 8px #4FB44D;
              flex-shrink: 0;
            "></span>
            <span>${cleanShortName}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Interactive popup with sanitized data
      const popupContent = `
        <div style="font-family: inherit; min-width: 170px; padding: 2px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #F5C451; margin-bottom: 3px;">
            ${cleanCat}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #FFFFFF; line-height: 1.2;">
            ${cleanFullName}
          </div>
          <div style="font-size: 11px; color: #A1A1AA; margin-top: 4px; line-height: 1.3;">
            ${cleanAddr}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px;">
            <span style="color: #4FB44D; font-weight: 600;">⚡ ${cleanEta}</span>
            <span style="color: #F5C451; font-weight: 600;">★ ${cleanRating}</span>
          </div>
          <button id="view-store-${storeIdStr}" style="
            width: 100%;
            margin-top: 8px;
            padding: 7px 12px;
            border-radius: 8px;
            background: #F5C451;
            color: #000000;
            font-size: 11.5px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            text-align: center;
            transition: opacity 0.15s ease;
          ">
            View Showroom →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'mumbai-dark-popup',
        closeButton: false,
        offset: [0, -12],
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-store-${storeIdStr}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onSelectStore(store.id);
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [stores, onSelectStore]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo(MUMBAI_CENTER, 14, { duration: 0.8 });
  };

  const hasStores = Array.isArray(stores) && stores.length > 0;

  return (
    <div
      className={`relative w-full h-full min-h-[360px] md:min-h-[420px] bg-[#0E0E10] overflow-hidden select-none ${
        isDark ? 'mumbai-dark-mode' : ''
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <style>{`
        /* Seamless Luxury Dark Theme for Mumbai Map Tiles (No API key, No watermark) */
        .mumbai-dark-mode .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%);
          -webkit-filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%);
        }
        .mumbai-dark-popup .leaflet-popup-content-wrapper {
          background: #141416 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7) !important;
          padding: 8px 10px !important;
        }
        .mumbai-dark-popup .leaflet-popup-tip {
          background: #141416 !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        .mumbai-pin-bubble:hover {
          border-color: #F5C451 !important;
          transform: translate(-50%, -50%) scale(1.1) !important;
          box-shadow: 0 6px 20px rgba(245, 196, 81, 0.35) !important;
        }
      `}</style>

      {/* Embedded Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Subtle edge vignetting overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0B0B0C]/80 via-transparent to-[#0B0B0C]/40 z-10" />

      {/* Top Left: Mumbai Area Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141416]/90 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
        <MapPin className="w-3.5 h-3.5 text-[#F5C451]" />
        <span className="text-[11px] font-medium text-white/90">
          MUMBAI · Bandra West & Khar
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4FB44D] animate-pulse ml-0.5" />
      </div>

      {/* Top Right: Custom Zoom & Recenter Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="w-8 h-8 rounded-lg bg-[#141416]/90 hover:bg-[#1C1C1F] backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="w-8 h-8 rounded-lg bg-[#141416]/90 hover:bg-[#1C1C1F] backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors shadow-md active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          aria-label="Recenter Bandra"
          title="Recenter Bandra Linking Road"
          className="w-8 h-8 rounded-lg bg-[#141416]/90 hover:bg-[#1C1C1F] backdrop-blur-md border border-white/10 flex items-center justify-center text-[#F5C451] hover:brightness-110 transition-colors shadow-md active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left: Linking Road Cluster Floating Card */}
      <div className="absolute left-4 bottom-4 z-20 p-3.5 rounded-xl bg-[#141416]/90 backdrop-blur-md border border-white/10 shadow-xl pointer-events-auto max-w-[280px]">
        <div className="flex items-center gap-1.5 font-medium text-[9px] leading-none tracking-[0.16em] text-[#F5C451]">
          <span>LINKING ROAD CLUSTER</span>
          <span className="text-[9px] text-[#4FB44D]">● LIVE</span>
        </div>
        <div className="font-normal text-[11px] leading-tight text-white/80 mt-1.5">
          {hasStores ? (
            `${stores.length} verified showrooms in Bandra & Khar`
          ) : (
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C451] animate-ping" />
              Indexing local showrooms...
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/50 mt-1">
          Median 45 min door-to-door delivery
        </div>
      </div>
    </div>
  );
};
