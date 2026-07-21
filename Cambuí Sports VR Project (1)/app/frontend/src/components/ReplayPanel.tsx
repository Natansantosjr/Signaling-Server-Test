import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  RotateCcw,
} from 'lucide-react';

interface ReplayData {
  id: number;
  event_id: number;
  camera_id: number;
  title: string;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  replay_url: string;
  type: string;
}

const typeColors: Record<string, string> = {
  goal: 'bg-green-500/10 text-green-400 border-green-500/20',
  foul: 'bg-red-500/10 text-red-400 border-red-500/20',
  highlight: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  custom: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const typeLabels: Record<string, string> = {
  goal: 'Gol',
  foul: 'Falta',
  highlight: 'Destaque',
  custom: 'Personalizado',
};

export function ReplayPanel() {
  const [replays, setReplays] = useState<ReplayData[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplayData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReplays();
  }, []);

  const loadReplays = async () => {
    try {
      const response = await client.entities.replays.query({ query: {} });
      if (response?.data?.items) {
        setReplays(response.data.items);
        if (response.data.items.length > 0) {
          setSelectedReplay(response.data.items[0]);
        }
      }
    } catch (err) {
      console.error('Error loading replays:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Replay Player */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-t-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <RotateCcw size={48} className="text-primary/50 mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">
                  {selectedReplay?.title || 'Selecione um replay'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Buffer circular • 15 minutos por câmera
                </p>
              </div>
            </div>
            {selectedReplay && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge className={typeColors[selectedReplay.type]}>
                  {typeLabels[selectedReplay.type]}
                </Badge>
                <Badge className="text-xs bg-muted text-muted-foreground rounded-md px-2 py-1">
                  {selectedReplay.duration_seconds}s
                </Badge>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            {/* Progress bar */}
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={1}
              className="cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {Math.floor((progress[0] / 100) * (selectedReplay?.duration_seconds || 30))}s
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedReplay?.duration_seconds || 0}s
              </span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-3">
              <Button className="h-9 w-9 cursor-pointer">
                <SkipBack size={16} />
              </Button>
              <Button className="h-9 w-9 cursor-pointer">
                <Rewind size={16} />
              </Button>
              <Button
                className="h-12 w-12 rounded-full cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Button className="h-9 w-9 cursor-pointer">
                <FastForward size={16} />
              </Button>
              <Button className="h-9 w-9 cursor-pointer">
                <SkipForward size={16} />
              </Button>
            </div>

            {/* Speed controls */}
            <div className="flex items-center justify-center gap-2">
              {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
                <Button
                  key={speed}
                  className={`text-xs h-7 px-2 cursor-pointer rounded ${
                    playbackSpeed === speed ? 'bg-primary text-primary-foreground' : 'border border-border'
                  }`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replay List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Replays Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {replays.map((replay) => (
            <Card
              key={replay.id}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                selectedReplay?.id === replay.id ? 'border-primary glow-green' : ''
              }`}
              onClick={() => {
                setSelectedReplay(replay);
                setProgress([0]);
                setIsPlaying(false);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`text-xs ${typeColors[replay.type]}`}>
                    {typeLabels[replay.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{replay.duration_seconds}s</span>
                </div>
                <p className="text-sm font-medium text-foreground">{replay.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Câmera {replay.camera_id} • {new Date(replay.start_timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}