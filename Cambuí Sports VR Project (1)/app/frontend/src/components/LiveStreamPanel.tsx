import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Maximize2, Minimize2, Volume2, Wifi, Camera } from 'lucide-react';

interface CameraData {
  id: number;
  event_id: number;
  name: string;
  position: string;
  stream_url: string;
  quality: string;
  status: string;
  is_primary: boolean;
}

const positionLabels: Record<string, string> = {
  center: 'Centro',
  lateral: 'Lateral',
  goal_north: 'Gol Norte',
  goal_south: 'Gol Sul',
  stands: 'Arquibancada',
  drone: 'Drone',
};

const cameraImages: Record<string, string> = {
  center: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktmjmaaaiyq/logo-cambui-sports_variant_3.png',
  lateral: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktnsqqaaiyq/logo-cambui-sports_variant_4.png',
  goal_north: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktovuqaaiyq/logo-cambui-sports_variant_5.png',
  goal_south: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktp2tyaai2q/logo-cambui-sports_variant_6.png',
  stands: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktq5saaaiyq/logo-cambui-sports_variant_7.png',
  drone: 'https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktskfyaaiza/logo-cambui-sports_variant_8.png',
};

export function LiveStreamPanel() {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [expandedCamera, setExpandedCamera] = useState<number | null>(null);
  const [quality, setQuality] = useState('4k');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const response = await client.entities.cameras.query({ query: { status: 'active' } });
      if (response?.data?.items) {
        setCameras(response.data.items);
      }
    } catch (err) {
      console.error('Error loading cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Multi-Câmeras VR</span>
        </div>
        <Badge variant="destructive" className="animate-pulse-live">
          AO VIVO
        </Badge>
        <span className="text-sm text-muted-foreground">Bahia x Vitória • Arena Fonte Nova</span>
        <div className="ml-auto flex items-center gap-3">
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4k">4K Ultra</SelectItem>
              <SelectItem value="1080p">1080p HD</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="480p">480p</SelectItem>
              <SelectItem value="360p">360p</SelectItem>
              <SelectItem value="240p">240p</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi size={14} className="text-green-500" />
            <span>WebRTC • 180ms</span>
          </div>
        </div>
      </div>

      {/* Expanded Camera View */}
      {expandedCamera !== null && (
        <Card className="border-primary/30 glow-green">
          <CardContent className="p-0 relative">
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera size={48} className="text-primary/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {cameras.find(c => c.id === expandedCamera)?.name}
                  </p>
                  <p className="text-xs text-primary mt-1">Stream {quality} • WebRTC</p>
                </div>
              </div>
              {/* Overlay controls */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge variant="destructive" className="text-xs animate-pulse-live">LIVE</Badge>
                <Badge variant="secondary" className="text-xs">{quality}</Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setExpandedCamera(null)}
                >
                  <Minimize2 size={14} />
                </Button>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Volume2 size={14} className="text-white/70" />
                <div className="w-20 h-1 bg-white/20 rounded-full">
                  <div className="w-3/4 h-full bg-primary rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Grid */}
      <div className={`grid gap-4 ${expandedCamera !== null ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {cameras.map((cam) => (
          <Card
            key={cam.id}
            className={`group cursor-pointer transition-all hover:border-primary/50 ${
              expandedCamera === cam.id ? 'border-primary glow-green' : ''
            }`}
            onClick={() => setExpandedCamera(expandedCamera === cam.id ? null : cam.id)}
          >
            <CardContent className="p-0">
              <div className={`${expandedCamera !== null ? 'aspect-video' : 'aspect-video'} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-t-lg overflow-hidden relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera size={expandedCamera !== null ? 20 : 32} className="text-primary/40" />
                </div>
                {/* Status overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-live" />
                  <span className="text-[10px] text-white/80 font-medium">LIVE</span>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{cam.quality}</Badge>
                </div>
                {/* Expand icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <Maximize2 size={20} className="text-white" />
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{cam.name}</p>
                <p className="text-xs text-muted-foreground">{positionLabels[cam.position] || cam.position}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stream Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Latência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">180ms</p>
            <p className="text-xs text-muted-foreground">WebRTC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Bitrate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">25 Mbps</p>
            <p className="text-xs text-muted-foreground">4K Stream</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">12.450</p>
            <p className="text-xs text-green-500">+340 últimos 5min</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Câmeras Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">6/6</p>
            <p className="text-xs text-green-500">Todas operacionais</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}