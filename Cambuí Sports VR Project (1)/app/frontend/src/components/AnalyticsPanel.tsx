import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, Clock, RotateCcw, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetricData {
  id: number;
  event_id: number;
  total_viewers: number;
  peak_viewers: number;
  avg_watch_time_seconds: number;
  most_watched_camera: string;
  replay_count: number;
  abandonment_rate: number;
  revenue: number;
  recorded_at: string;
}

export function AnalyticsPanel() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await client.entities.analytics_metrics.query({ query: {}, sort: '-recorded_at' });
      if (response?.data?.items) {
        setMetrics(response.data.items);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const latestMetric = metrics[0];
  const previousMetric = metrics[1];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const cameraDistribution = [
    { name: 'Centro', percentage: 35, color: 'bg-primary' },
    { name: 'Drone', percentage: 25, color: 'bg-blue-500' },
    { name: 'Lateral', percentage: 18, color: 'bg-purple-500' },
    { name: 'Gol Norte', percentage: 10, color: 'bg-orange-500' },
    { name: 'Gol Sul', percentage: 7, color: 'bg-pink-500' },
    { name: 'Arquibancada', percentage: 5, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Viewers</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {latestMetric?.total_viewers?.toLocaleString('pt-BR') || '0'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-500">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground">Pico</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {latestMetric?.peak_viewers?.toLocaleString('pt-BR') || '0'}
            </p>
            <span className="text-xs text-muted-foreground">máximo simultâneo</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-purple-400" />
              <span className="text-xs text-muted-foreground">Tempo Médio</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatTime(latestMetric?.avg_watch_time_seconds || 0)}
            </p>
            <span className="text-xs text-muted-foreground">por sessão</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={14} className="text-orange-400" />
              <span className="text-xs text-muted-foreground">Replays</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {latestMetric?.replay_count?.toLocaleString('pt-BR') || '0'}
            </p>
            <span className="text-xs text-muted-foreground">acessados</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-red-400" />
              <span className="text-xs text-muted-foreground">Abandono</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {latestMetric?.abandonment_rate || 0}%
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown size={12} className="text-green-500" />
              <span className="text-xs text-green-500">-2.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-green-400" />
              <span className="text-xs text-muted-foreground">Receita</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              R$ {((latestMetric?.revenue || 0) / 1000).toFixed(1)}k
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-500">+18%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Distribuição por Câmera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameraDistribution.map((cam) => (
            <div key={cam.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{cam.name}</span>
                <span className="text-muted-foreground">{cam.percentage}%</span>
              </div>
              <Progress value={cam.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audience Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Audiência em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1">
            {[45, 52, 48, 65, 72, 68, 78, 85, 92, 88, 95, 100, 97, 93, 88, 82, 78, 85, 90, 88, 92, 95, 98, 100].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-pointer relative group"
                style={{ height: `${val}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border px-2 py-1 rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {Math.floor(val * 124.5)} viewers
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>16:00</span>
            <span>16:15</span>
            <span>16:30</span>
            <span>16:45</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}