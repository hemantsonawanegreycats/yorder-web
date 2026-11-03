import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Trash2,
  Plus,
  Home,
  Briefcase,
  Compass,
  ArrowLeft,
  ChevronRight,
  Navigation,
  Building,
} from 'lucide-react';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  UserAddress,
  CreateAddressPayload,
} from '../../api/address.api';
import { useCartStore } from '../../stores/useCartStore';
import { useAppStore } from '../../stores/useAppStore';
import { loadGoogleMapsScript } from '../../utils/googleMaps';

interface AddressMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchLocationItem {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  placeId?: string;
  type?: 'locality' | 'street' | 'landmark';
}

// Comprehensive local Mumbai & Western Suburbs Gazetteer for 0ms instant search
const MUMBAI_LOCALITIES: SearchLocationItem[] = [
  // Vakola & Santacruz East
  {
    id: 'vakola-datta-mandir',
    name: 'Shree Datta Mandir, Vakola',
    subtitle: 'Datta Mandir Road, Vakola, Santacruz East, Mumbai 400055',
    lat: 19.0837,
    lng: 72.8532,
    type: 'landmark',
  },
  {
    id: 'vakola-datta-mandir-rd',
    name: 'Datta Mandir Road, Vakola',
    subtitle: 'Near Vakola Pipeline, Santacruz East, Mumbai 400055',
    lat: 19.0835,
    lng: 72.853,
    type: 'street',
  },
  {
    id: 'vakola-bridge',
    name: 'Vakola Junction / WEH',
    subtitle: 'Western Express Highway, Santacruz East, Mumbai 400055',
    lat: 19.0815,
    lng: 72.852,
    type: 'street',
  },
  {
    id: 'vakola-market',
    name: 'Vakola Market',
    subtitle: 'Nehru Road, Vakola, Santacruz East, Mumbai 400055',
    lat: 19.0845,
    lng: 72.854,
    type: 'locality',
  },

  // Khar & Danda
  {
    id: 'khar-danda',
    name: 'Khar Danda',
    subtitle: 'Khar West / Carter Road, Mumbai, Maharashtra 400052',
    lat: 19.0706,
    lng: 72.8258,
    type: 'locality',
  },
  {
    id: 'danda-village',
    name: 'Danda Village',
    subtitle: 'Off Carter Road, Khar Danda, Mumbai 400052',
    lat: 19.0685,
    lng: 72.8242,
    type: 'locality',
  },
  {
    id: 'danda-koliwada',
    name: 'Danda Koliwada',
    subtitle: 'Khar Danda, Mumbai, Maharashtra 400052',
    lat: 19.0718,
    lng: 72.8231,
    type: 'locality',
  },
  {
    id: 'khar-14th-rd',
    name: '14th Road, Khar West',
    subtitle: 'Near Madhu Park, Khar, Mumbai 400052',
    lat: 19.0715,
    lng: 72.834,
    type: 'street',
  },
  {
    id: 'khar-gymkhana',
    name: 'Khar Gymkhana',
    subtitle: '15th Road, Khar West, Mumbai 400052',
    lat: 19.0735,
    lng: 72.8355,
    type: 'landmark',
  },

  // Bandra West
  {
    id: 'bandra-hill-rd',
    name: 'Hill Road',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0549,
    lng: 72.8293,
    type: 'street',
  },
  {
    id: 'bandra-linking-rd',
    name: 'Linking Road',
    subtitle: 'Bandra West / Khar West, Mumbai 400050',
    lat: 19.0645,
    lng: 72.8358,
    type: 'street',
  },
  {
    id: 'bandra-pali-hill',
    name: 'Pali Hill',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0628,
    lng: 72.8286,
    type: 'locality',
  },
  {
    id: 'bandra-carter-rd',
    name: 'Carter Road Promenade',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0682,
    lng: 72.8239,
    type: 'landmark',
  },
  {
    id: 'bandra-bandstand',
    name: 'Bandstand Promenade',
    subtitle: 'Mount Mary, Bandra West, Mumbai 400050',
    lat: 19.0435,
    lng: 72.8198,
    type: 'landmark',
  },
  {
    id: 'bandra-mount-mary',
    name: 'Mount Mary Steps',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0469,
    lng: 72.8227,
    type: 'landmark',
  },
  {
    id: 'bandra-turner-rd',
    name: 'Turner Road',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0587,
    lng: 72.8315,
    type: 'street',
  },
  {
    id: 'bandra-perry-cross',
    name: 'Perry Cross Road',
    subtitle: 'Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0598,
    lng: 72.827,
    type: 'street',
  },

  // Juhu & Vile Parle
  {
    id: 'juhu-beach',
    name: 'Juhu Beach',
    subtitle: 'Juhu Tara Road, Juhu, Mumbai 400049',
    lat: 19.1025,
    lng: 72.8268,
    type: 'landmark',
  },
  {
    id: 'juhu-jvpd',
    name: 'JVPD Scheme',
    subtitle: 'Vile Parle West / Juhu, Mumbai 400049',
    lat: 19.1085,
    lng: 72.8345,
    type: 'locality',
  },

  // Santacruz West & Andheri
  {
    id: 'santacruz-west',
    name: 'Santacruz West',
    subtitle: 'Podar School / Station Area, Mumbai 400054',
    lat: 19.0825,
    lng: 72.836,
    type: 'locality',
  },
  {
    id: 'versova',
    name: 'Versova Beach & Village',
    subtitle: 'Andheri West, Mumbai, Maharashtra 400061',
    lat: 19.135,
    lng: 72.815,
    type: 'locality',
  },
  {
    id: 'lokhandwala',
    name: 'Lokhandwala Complex',
    subtitle: 'Andheri West, Mumbai, Maharashtra 400053',
    lat: 19.141,
    lng: 72.828,
    type: 'locality',
  },
  {
    id: 'lower-parel',
    name: 'Lower Parel / Palladium',
    subtitle: 'Senapati Bapat Marg, Mumbai 400013',
    lat: 18.995,
    lng: 72.825,
    type: 'locality',
  },
  {
    id: 'dadar-shivaji-park',
    name: 'Shivaji Park',
    subtitle: 'Dadar West, Mumbai, Maharashtra 400028',
    lat: 19.027,
    lng: 72.838,
    type: 'landmark',
  },
];

// Quick 1-click filter chips
const QUICK_LOCATIONS = [
  { name: 'Datta Mandir (Vakola)', lat: 19.0837, lng: 72.8532 },
  { name: 'Khar Danda', lat: 19.0706, lng: 72.8258 },
  { name: 'Hill Road (Bandra W)', lat: 19.0549, lng: 72.8293 },
  { name: 'Linking Road', lat: 19.0645, lng: 72.8358 },
  { name: 'Pali Hill', lat: 19.0628, lng: 72.8286 },
  { name: 'Juhu', lat: 19.1025, lng: 72.8268 },
];

declare global {
  interface Window {
    google?: any;
  }
}

export const AddressMapModal: React.FC<AddressMapModalProps> = ({ isOpen, onClose }) => {
  const { data: addresses, isLoading: isAddressesLoading } = useAddressesQuery();
  const createAddressMutation = useCreateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  const { selectedAddressId, setSelectedAddressId } = useCartStore();
  const { setDeliverTo, showToast } = useAppStore();

  const [view, setView] = useState<'list' | 'map' | 'form'>('list');

  // Map position and interactive state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.0596,
    lng: 72.8295,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchLocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDebounceRef = useRef<any>(null);

  // Address details state
  const [detectedAddress, setDetectedAddress] = useState<string>(
    'Bandra West, Mumbai, Maharashtra 400050'
  );
  const [detectedDetails, setDetectedDetails] = useState<any>({
    road: 'Hill Road',
    neighbourhood: 'Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    postcode: '400050',
  });

  // Flat form details
  const [addressType, setAddressType] = useState<'user_home' | 'user_office' | 'user_other'>('user_home');
  const [flatNo, setFlatNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400050');

  // Switch to map view directly if user has no saved addresses & initialize Google Maps SDK if key exists
  useEffect(() => {
    if (isOpen) {
      loadGoogleMapsScript().catch(() => {});
      if (addresses && addresses.length === 0) {
        setView('map');
      } else {
        setView('list');
      }
    }
  }, [isOpen, addresses]);

  // Reverse geocoding on coordinates change
  const fetchReverseGeocode = useCallback(async (lat: number, lng: number) => {
    // 1. Try Google Geocoder if SDK is available
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const first = results[0];
            const components = first.address_components || [];
            let route = '';
            let sublocality = '';
            let locality = 'Mumbai';
            let postal = '400050';

            components.forEach((c: any) => {
              if (c.types.includes('route')) route = c.long_name;
              if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality'))
                sublocality = c.long_name;
              if (c.types.includes('locality')) locality = c.long_name;
              if (c.types.includes('postal_code')) postal = c.long_name;
            });

            const roadName = route || sublocality || 'Selected Spot';
            setDetectedAddress(first.formatted_address);
            setDetectedDetails({
              road: roadName,
              neighbourhood: sublocality || locality,
              city: locality,
              state: 'Maharashtra',
              postcode: postal,
            });
            setStreet(roadName);
            setLandmark(sublocality || locality);
            setCity(locality);
            setPincode(postal);
            return;
          }
        });
      } catch (err) {
        // Fallback to OpenStreetMap geocoder below
      }
    }

    // 2. OpenStreetMap / Nominatim fallback
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'YorderWeb/1.0' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.suburb || addr.neighbourhood || 'Selected Spot';
        const locality = addr.suburb || addr.neighbourhood || addr.city_district || 'Mumbai';
        const cCity = addr.city || addr.town || 'Mumbai';
        const cState = addr.state || 'Maharashtra';
        const cPostcode = addr.postcode || '400050';

        setDetectedAddress(data.display_name || `${road}, ${locality}, ${cCity}`);
        setDetectedDetails({
          road,
          neighbourhood: locality,
          city: cCity,
          state: cState,
          postcode: cPostcode,
        });

        setStreet(road);
        setLandmark(locality);
        setCity(cCity);
        setState(cState);
        setPincode(cPostcode);
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  }, []);

  // Initialize Leaflet map with 100% visible, crystal-clear Google & OSM Tiles
  useEffect(() => {
    if (view !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: false,
      });

      // Primary: Google Maps Road tiles (crystal-clear streets, buildings, landmarks, 100% visible)
      const tileLayer = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          attribution: '&copy; Google Maps',
          maxZoom: 20,
        }
      );

      // Automatic fallback to OpenStreetMap if Google tile is unavailable
      tileLayer.on('tileerror', () => {
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
      });

      tileLayer.addTo(map);

      // Track dragging physics
      map.on('movestart', () => {
        setIsDragging(true);
      });

      map.on('moveend', () => {
        setIsDragging(false);
        const center = map.getCenter();
        setCoords({ lat: center.lat, lng: center.lng });
        fetchReverseGeocode(center.lat, center.lng);
      });

      mapInstanceRef.current = map;
    }

    // Force Leaflet to calculate full width/height immediately after modal renders
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([coords.lat, coords.lng], 16);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [view, coords.lat, coords.lng, fetchReverseGeocode]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [isOpen]);

  // Multi-tier Search Engine: Google Places Autocomplete + Instant Mumbai Gazetteer + Photon
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    // 1. 0ms Instant Local Gazetteer (matches "datta mandir", "vakola", "danda", "bandra", etc.)
    const localMatches = MUMBAI_LOCALITIES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        q.includes(item.name.toLowerCase())
    );

    setSearchResults(localMatches);
    setShowSearchDropdown(true);

    // 2. Debounced Google Places Autocomplete & Remote Geocoding
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);

      // Try Google Places Autocomplete first
      if (window.google?.maps?.places?.AutocompleteService) {
        try {
          const service = new window.google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            {
              input: searchQuery,
              componentRestrictions: { country: 'in' },
              locationBias: {
                radius: 30000,
                center: { lat: 19.076, lng: 72.8777 },
              },
            },
            (predictions: any[], status: string) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                predictions &&
                predictions.length > 0
              ) {
                const googleItems: SearchLocationItem[] = predictions.map((p) => ({
                  id: p.place_id,
                  name: p.structured_formatting?.main_text || p.description.split(',')[0],
                  subtitle: p.structured_formatting?.secondary_text || p.description,
                  lat: 0,
                  lng: 0,
                  placeId: p.place_id,
                  type: 'landmark',
                }));

                // Combine local matches and Google places
                const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
                const combined = [...localMatches];
                googleItems.forEach((g) => {
                  if (!seen.has(g.name.toLowerCase())) {
                    combined.push(g);
                  }
                });
                setSearchResults(combined.slice(0, 8));
                setIsSearching(false);
                return;
              }
            }
          );
        } catch (e) {
          // Fall through to Photon
        }
      }

      // Fallback: Photon Komoot Geocoder
      try {
        const resp = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            searchQuery + ' Mumbai'
          )}&lat=19.0837&lon=72.8532&limit=6`
        );
        if (resp.ok) {
          const data = await resp.json();
          const remoteItems: SearchLocationItem[] = (data.features || []).map(
            (f: any, idx: number) => {
              const props = f.properties || {};
              const name = props.name || props.street || searchQuery;
              const sub = [props.street, props.suburb, props.city, props.state]
                .filter(Boolean)
                .join(', ');
              return {
                id: `remote-${idx}-${props.osm_id || idx}`,
                name,
                subtitle: sub || 'Mumbai, Maharashtra',
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                type: 'locality' as const,
              };
            }
          );

          const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
          const combined = [...localMatches];
          for (const r of remoteItems) {
            if (!seen.has(r.name.toLowerCase())) {
              combined.push(r);
            }
          }
          setSearchResults(combined.slice(0, 8));
        }
      } catch (err) {
        // Local matches already active
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (result: SearchLocationItem) => {
    // If it's a Google Place item that needs coordinate resolution
    if (result.placeId && window.google?.maps?.Geocoder && (!result.lat || !result.lng)) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: result.placeId }, (results: any[], status: string) => {
        if (status === 'OK' && results && results[0]?.geometry?.location) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setCoords({ lat, lng });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          }
          setShowSearchDropdown(false);
          setSearchQuery(result.name);
          fetchReverseGeocode(lat, lng);
        }
      });
      return;
    }

    // If coordinates already present
    setCoords({ lat: result.lat, lng: result.lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 17, { duration: 1.2 });
    }
    setShowSearchDropdown(false);
    setSearchQuery(result.name);

    // Immediately pre-fill address fields so half address is automatically filled
    const parts = result.subtitle.split(',').map((s) => s.trim());
    const foundPincode = result.subtitle.match(/\b\d{6}\b/)?.[0] || '400055';
    setStreet(parts[0] || result.name);
    setLandmark(result.name);
    setPincode(foundPincode);
    setDetectedAddress(`${result.name}, ${result.subtitle}`);
    setDetectedDetails({
      road: result.name,
      neighbourhood: parts[1] || parts[0] || 'Vakola',
      city: 'Mumbai',
      state: 'Maharashtra',
      postcode: foundPincode,
    });

    fetchReverseGeocode(result.lat, result.lng);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          }
          fetchReverseGeocode(lat, lng);
          showToast('Located your current position');
        },
        () => {
          showToast('Could not access current location. Please search manually.');
        }
      );
    }
  };

  const handleQuickLocation = (loc: { lat: number; lng: number; name: string }) => {
    setCoords({ lat: loc.lat, lng: loc.lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 });
    }
    fetchReverseGeocode(loc.lat, loc.lng);
  };

  const handleConfirmLocationOnMap = () => {
    setView('form');
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNo.trim()) {
      showToast('Please enter your Flat / House number and building name');
      return;
    }

    const payload: CreateAddressPayload = {
      addressLine1: flatNo.trim(),
      addressLine2: street.trim(),
      nearBy: landmark.trim() || detectedDetails.neighbourhood,
      city: city.trim() || 'Mumbai',
      state: state.trim() || 'Maharashtra',
      zipCode: pincode.trim() || '400050',
      type: addressType,
      latitude: coords.lat,
      longitude: coords.lng,
    };

    try {
      const resp = await createAddressMutation.mutateAsync(payload);
      if (resp?.data?.id) {
        setSelectedAddressId(resp.data.id);
        setDeliverTo(payload.nearBy || payload.city);
        showToast('Delivery address saved successfully');
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save address');
    }
  };

  const handleSelectSaved = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    const locality = addr.nearBy || addr.sublocality || addr.city || 'Bandra West';
    setDeliverTo(locality);
    showToast(`Delivering to ${addr.address1 || locality}`);
    onClose();
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteAddressMutation.mutate(id, {
      onSuccess: () => {
        showToast('Address removed');
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl rounded-[28px] bg-[var(--bg)] border border-[var(--bd)] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--s2)] flex items-center justify-between bg-[var(--s0)]">
          <div className="flex items-center gap-3">
            {view !== 'list' && addresses && addresses.length > 0 && (
              <button
                onClick={() => setView('list')}
                className="p-1.5 rounded-full hover:bg-[var(--s1)] text-[var(--t3)] hover:text-white transition-colors"
                title="Back to saved addresses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-[var(--t1)]">
                {view === 'list'
                  ? 'Select Delivery Location'
                  : view === 'map'
                  ? 'Set Location on Map'
                  : 'Enter Doorstep Details'}
              </h2>
              <p className="text-[11px] text-[var(--t3)]">
                {view === 'list'
                  ? 'Rider will deliver your door trial package here'
                  : view === 'map'
                  ? 'Drag map or search to pin your exact doorstep'
                  : 'Provide flat/floor details for the rider'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--t3)] hover:text-white hover:bg-[var(--s1)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: Saved Addresses List */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
            {/* Add New Address Button */}
            <button
              onClick={() => setView('map')}
              className="w-full p-4 rounded-[18px] border-2 border-dashed border-[var(--gold)]/50 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10 flex items-center justify-center gap-2.5 text-[var(--gold)] font-semibold text-xs transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Add New Address with Map & Search
            </button>

            {/* Address Cards */}
            <div className="flex flex-col gap-3 mt-2">
              <span className="font-medium text-[9.5px] tracking-[0.16em] text-[var(--t3)] uppercase">
                SAVED ADDRESSES ({addresses?.length || 0})
              </span>

              {isAddressesLoading ? (
                <div className="p-8 text-center text-xs text-[var(--t3)]">Loading saved addresses...</div>
              ) : addresses && addresses.length > 0 ? (
                addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const typeName = (addr.type?.name || 'Home').toUpperCase();
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSaved(addr)}
                      className={`p-4 rounded-[20px] border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-[var(--s1)] border-[var(--gold)] shadow-md'
                          : 'bg-[var(--s0)] border-[var(--bd)] hover:border-[var(--bd2)]'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-[var(--gold)] text-black'
                              : 'bg-[var(--s2)] text-[var(--t3)]'
                          }`}
                        >
                          {typeName === 'OFFICE' || typeName === 'WORK' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[var(--t1)]">
                              {typeName}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] text-[9px] font-bold">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--t2)] mt-1 font-medium truncate">
                            {addr.address1 || addr.formated_address}
                          </p>
                          <p className="text-[11px] text-[var(--t3)] mt-0.5 leading-relaxed">
                            {addr.nearBy ? `${addr.nearBy}, ` : ''}
                            {addr.city}, {addr.state} {addr.postalCode ? `- ${addr.postalCode}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => handleDeleteSaved(e, addr.id)}
                          className="p-2 rounded-full text-[var(--t4)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[var(--t3)] bg-[var(--s0)] rounded-2xl border border-[var(--bd)]">
                  No saved addresses yet. Click above to add your location using the map.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Interactive Visible Map with Search & Professional Pointer */}
        {view === 'map' && (
          <div className="flex-1 flex flex-col min-h-[460px] relative">
            {/* Search Floating Header with high stacking context above Leaflet */}
            <div className="relative p-3.5 bg-[var(--s0)]/98 backdrop-blur-md border-b border-[var(--s2)] flex flex-col gap-2.5 z-[1100]">
              <div className="relative flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 h-11 px-3.5 rounded-2xl bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors shadow-inner">
                  <Search className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSearchDropdown(true);
                    }}
                    placeholder="Search locality, street, landmark (e.g. Datta Mandir Vakola, Danda)..."
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-[var(--t1)] placeholder-[var(--t4)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchDropdown(false);
                      }}
                      className="text-xs text-[var(--t3)] hover:text-white px-1"
                    >
                      ×
                    </button>
                  )}
                  {isSearching && (
                    <span className="w-3.5 h-3.5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="h-11 w-11 rounded-2xl bg-[var(--s1)] border border-[var(--bd)] text-[var(--gold)] flex items-center justify-center hover:bg-[var(--s2)] hover:border-[var(--gold)] transition-colors flex-shrink-0 shadow-sm"
                  title="Locate my GPS position"
                >
                  <Crosshair className="w-4 h-4" />
                </button>

                {/* Instant Search Dropdown: FLOATS PROUDLY OVER MAP (z-[1200]) */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-[48px] left-0 right-13 rounded-2xl bg-[var(--s0)] border border-[var(--bd)] shadow-2xl overflow-hidden z-[1200] divide-y divide-[var(--s2)] max-h-[280px] overflow-y-auto">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full p-3 text-left hover:bg-[var(--s1)] flex items-start gap-3 text-xs transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-full bg-[var(--s2)] flex items-center justify-center text-[var(--gold)] flex-shrink-0 mt-0.5 group-hover:bg-[var(--gold)] group-hover:text-black transition-colors">
                          {res.type === 'street' ? (
                            <Navigation className="w-3.5 h-3.5" />
                          ) : res.type === 'landmark' ? (
                            <Building className="w-3.5 h-3.5" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[12.5px] text-[var(--t1)] group-hover:text-[var(--gold)] transition-colors truncate">
                            {res.name}
                          </div>
                          <div className="text-[11px] text-[var(--t3)] truncate mt-0.5">
                            {res.subtitle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Area Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-[var(--t4)] whitespace-nowrap font-medium">Quick:</span>
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleQuickLocation(loc)}
                    className="px-2.5 py-1 rounded-full bg-[var(--s1)] border border-[var(--bd)] text-[10.5px] text-[var(--t2)] hover:border-[var(--gold)] hover:text-white whitespace-nowrap transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Canvas Container with 100% visible, crystal-clear Google & OSM Tiles */}
            <div className="relative flex-1 w-full min-h-[350px] overflow-hidden bg-[#e5e3df] z-0">
              <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />

              {/* World-Class Professional Location Pointer Pin (Uber/Swiggy Style) - ALWAYS ON TOP (z-[1000]) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
                <div className="relative flex flex-col items-center">
                  {/* Floating Minimal Glass Tooltip */}
                  <div className="absolute -top-12 flex flex-col items-center pointer-events-none transition-all duration-200">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121214]/95 backdrop-blur-md border border-[var(--gold)]/40 shadow-2xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
                      <span className="font-semibold text-[9.5px] tracking-wider uppercase text-white whitespace-nowrap">
                        {isDragging ? 'PINNING EXACT SPOT...' : 'ORDER WILL ARRIVE HERE'}
                      </span>
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[var(--gold)]/40 -mt-[1px]" />
                  </div>

                  {/* Professional Metallic Teardrop Pin */}
                  <div
                    className={`relative flex flex-col items-center transition-transform duration-200 ease-out ${
                      isDragging ? '-translate-y-3 scale-105' : 'translate-y-0 scale-100'
                    }`}
                  >
                    <svg
                      width="34"
                      height="44"
                      viewBox="0 0 34 44"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                    >
                      <defs>
                        <linearGradient id="pinGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F5D698" />
                          <stop offset="45%" stopColor="#C8A06A" />
                          <stop offset="100%" stopColor="#8E672F" />
                        </linearGradient>
                        <radialGradient id="pinAperture" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#1E1E22" />
                          <stop offset="100%" stopColor="#0B0B0C" />
                        </radialGradient>
                      </defs>

                      {/* Smooth Teardrop Pin Silhouette */}
                      <path
                        d="M17 0.8C7.8 0.8 0.5 8.1 0.5 17.2C0.5 28.8 15.3 42.6 15.9 43.2C16.5 43.8 17.5 43.8 18.1 43.2C18.7 42.6 33.5 28.8 33.5 17.2C33.5 8.1 26.2 0.8 17 0.8Z"
                        fill="url(#pinGoldGrad)"
                        stroke="#0B0B0C"
                        strokeWidth="1.5"
                      />

                      {/* Center Dark Aperture Lens */}
                      <circle cx="17" cy="17" r="7.5" fill="url(#pinAperture)" stroke="#C8A06A" strokeWidth="1" />

                      {/* Precision Gold Core Target Dot */}
                      <circle cx="17" cy="17" r="2.8" fill="#C8A06A" />
                    </svg>
                  </div>

                  {/* Realistic 3D Ground Drop Shadow */}
                  <div
                    className={`w-4 h-1.5 rounded-full bg-black/70 blur-[1px] -mt-1 transition-all duration-200 ${
                      isDragging ? 'scale-75 opacity-40' : 'scale-100 opacity-100'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Detected Address Bar */}
            <div className="p-4 bg-[var(--s0)] border-t border-[var(--s2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-30">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[var(--gold)] tracking-wider uppercase">
                    LOCATION PINNED
                  </div>
                  <p className="text-xs font-semibold text-[var(--t1)] truncate mt-0.5">
                    {detectedDetails.road || 'Selected Location'}
                  </p>
                  <p className="text-[11px] text-[var(--t3)] truncate">
                    {detectedAddress}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmLocationOnMap}
                className="w-full sm:w-auto h-11 px-5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md flex-shrink-0"
              >
                <span>Confirm & Enter Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Flat/Building Details Form */}
        {view === 'form' && (
          <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
            {/* Pinned Location Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-[var(--s1)] border border-[var(--bd)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
                <div className="truncate text-xs">
                  <span className="font-semibold text-[var(--t1)]">{detectedDetails.road}, </span>
                  <span className="text-[var(--t3)]">
                    {detectedDetails.neighbourhood}, {city}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView('map')}
                className="text-xs font-semibold text-[var(--gold)] hover:underline flex-shrink-0"
              >
                Change Pin
              </button>
            </div>

            {/* Address Type Selector */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-2">
                SAVE AS
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'user_home', label: 'Home', icon: Home },
                  { id: 'user_office', label: 'Work', icon: Briefcase },
                  { id: 'user_other', label: 'Other', icon: Compass },
                ].map((type) => {
                  const Icon = type.icon;
                  const isChecked = addressType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAddressType(type.id as any)}
                      className={`h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                        isChecked
                          ? 'bg-[var(--gold)] text-black border-[var(--gold)] shadow-sm'
                          : 'bg-[var(--s0)] border-[var(--bd)] text-[var(--t2)] hover:border-[var(--bd2)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* House / Flat details */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-1">
                FLAT / HOUSE NO. / BUILDING NAME *
              </label>
              <input
                type="text"
                required
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                placeholder="e.g. Flat 402, Sea Breeze Apts"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--s0)] border border-[var(--bd)] text-xs text-[var(--t1)] placeholder-[var(--t4)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            {/* Street / Floor */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-1">
                STREET / FLOOR / ROAD
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. 4th Floor, Hill Road"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--s0)] border border-[var(--bd)] text-xs text-[var(--t1)] placeholder-[var(--t4)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            {/* Landmark & Locality */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-1">
                NEARBY LANDMARK / LOCALITY *
              </label>
              <input
                type="text"
                required
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opp. St. Peter's Church"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--s0)] border border-[var(--bd)] text-xs text-[var(--t1)] placeholder-[var(--t4)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            {/* City & Pincode Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-1">
                  CITY
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--s0)] border border-[var(--bd)] text-xs text-[var(--t1)] focus:outline-none focus:border-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--t3)] mb-1">
                  PINCODE (6 DIGITS) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--s0)] border border-[var(--bd)] text-xs text-[var(--t1)] focus:outline-none focus:border-[var(--gold)] font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={createAddressMutation.isPending}
                className="w-full h-12 rounded-full bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-md"
              >
                {createAddressMutation.isPending ? 'Saving to account...' : 'Save Address & Deliver Here'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
