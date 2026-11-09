'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const routeId = Number(id);
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [route, setRoute] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch route details and stops
  useEffect(() => {
    if (!routeId || isNaN(routeId)) {
      setError('Invalid route ID');
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    api.getRoute(routeId)
      .then((res: any) => {
        if (!mounted) return;
        // Depending on your backend, it might return { route: {...}, stops: [...] } or just the object
        const r = res.route || res;
        const s = res.stops || res.route_stops || [];
        
        setRoute(r);
        setStops(s);
        setError(null);
      })
      .catch((err: any) => {
        if (!mounted) return;
        console.error('Failed to load route:', err);
        setError(err.message || 'Failed to load route details');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [routeId]);

  // Fetch vehicles and poll every 3 seconds
  useEffect(() => {
    if (!routeId || isNaN(routeId)) return;

    let mounted = true;
    const fetchVehicles = async () => {
      try {
        const res: any = await api.vehicles();
        if (!mounted) return;
        // Filter buses currently on this route
        const onRoute = (res.vehicles || []).filter((v: any) => v.route_id === routeId);
        setVehicles(onRoute);
      } catch (err) {
        // Silent fail for polling
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [routeId]);

  // Map configurations
  const mapCenter = useMemo(() => {
    if (stops.length > 0) return [Number(stops[0].lat), Number(stops[0].lng)];
    return [-1.9441, 30.0619]; // Default Kigali
  }, [stops]);

  const polylinePositions = useMemo(() => {
    return stops.map((s) => [Number(s.lat), Number(s.lng)]);
  }, [stops]);

  // Custom bus icon
  const busIcon = typeof window !== 'undefined' ? new (require('leaflet').DivIcon)({
    className: 'bg-transparent',
    html: `<div class="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] border-2 border-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-ink-100 font-medium">Loading route data...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
        <Card className="max-w-md w-full text-center">
          <CardBody className="py-10">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-bold text-ink mb-2">Route Not Found</h2>
            <p className="text-sm text-ink-100 mb-6">{error}</p>
            <Link href="/routes">
              <Button variant="primary" className="w-full">Back to Routes</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/routes" className="text-ink-100 hover:text-ink transition bg-white p-2 rounded-full shadow-sm">
            ←
          </Link>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: route.color_hex || '#2563EB' }}
            >
              {route.code}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">
                {lang === 'rw' ? route.name_rw : route.name_en}
              </h1>
              <p className="text-sm text-ink-100 mt-1">
                {stops.length} {t('ahantu', 'stops')} • {vehicles.length} {t('bisi ziri mu nzira', 'buses active')}
              </p>
            </div>
          </div>
        </div>
        
        <Link href="/map">
          <Button variant="outline" className="gap-2">
            <span>📡</span> {t('Reba ku ikarita', 'View on full map')}
          </Button>
        </Link>
      </div>

      {/* Main Layout: Map + Details */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Left: Map */}
        <div className="space-y-4">
          <div className="h-[500px] lg:h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-border shadow-card relative z-0">
            <MapContainer center={mapCenter as any} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              
              {/* Draw Route Line */}
              {polylinePositions.length > 0 && (
                <>
                  <Polyline positions={polylinePositions as any} color={route.color_hex || '#2563EB'} weight={5} opacity={0.8} />
                </>
              )}

              {/* Stops Markers */}
              {stops.map((s: any, i: number) => (
                <Marker key={s.id} position={[Number(s.lat), Number(s.lng)]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-sm">{s.name_en}</p>
                      <p className="text-xs text-gray-500">Stop #{i + 1}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Live Buses */}
              {vehicles.map((v: any) => (
                v.lat && v.lng && busIcon && (
                  <Marker key={v.vehicle_id} position={[Number(v.lat), Number(v.lng)]} icon={busIcon}>
                    <Popup>
                      <div className="text-center min-w-[120px]">
                        <p className="font-bold text-sm">{v.plate}</p>
                        <p className="text-xs text-gray-500">Next: {v.next_stop?.name_en || 'Unknown'}</p>
                        <p className="text-xs font-bold text-cyan-600 mt-1">{v.passengers}/{v.capacity} seats</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
            
            {/* Map Overlay Badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-border z-[400] text-xs font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Live Tracking Active
            </div>
          </div>
        </div>

        {/* Right: Timeline & Buses */}
        <div className="space-y-6">
          
          {/* Active Buses */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-100 mb-3 flex items-center gap-2">
              <span>🚌</span> {t('Bisi ziri mu nzira', 'Buses on this route')}
            </h2>
            {vehicles.length === 0 ? (
              <Card>
                <CardBody className="text-center py-6 text-sm text-ink-100">
                  No buses currently active on this route.
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v: any) => (
                  <Card key={v.vehicle_id} className="hover:border-teal-500 transition-colors cursor-default">
                    <CardBody className="py-3 px-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-ink">{v.plate}</p>
                        <p className="text-[11px] text-ink-100">Next: {v.next_stop?.name_en || '—'}</p>
                      </div>
                      <div className="text-right">
                        <Badge tone="success">{v.passengers}/{v.capacity}</Badge>
                        <p className="text-[10px] text-teal-600 font-bold mt-1">Live</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Stops Timeline */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-100 mb-3 flex items-center gap-2">
              <span>📍</span> {t('Ahantu', 'Stops & Timeline')}
            </h2>
            <Card>
              <CardBody className="p-5">
                <div className="relative border-l-2 border-border ml-3 space-y-6">
                  {stops.map((s: any, i: number) => (
                    <div key={s.id} className="relative">
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-teal-500' : i === stops.length - 1 ? 'bg-red-500' : 'bg-slate-300'}`} />
                      <p className="text-sm font-semibold text-ink leading-tight">{s.name_en}</p>
                      <p className="text-xs text-ink-100 mt-0.5">{s.name_rw}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}