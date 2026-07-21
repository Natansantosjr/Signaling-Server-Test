import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, Cpu, HardDrive, Wifi, Activity, Database } from 'lucide-react';

export function InfraPanel() {
  const infraData = {
    livekit: {
      nodes: [
        { id: 1, name: 'LiveKit Node 1', status: 'healthy', cpu: 45, memory: 62, connections: 4200 },
        { id: 2, name: 'LiveKit Node 2', status: 'healthy', cpu: 38, memory: 55, connections: 3800 },
        { id: 3, name: 'LiveKit Node 3', status: 'healthy', cpu: 52, memory: 68, connections: 4450 },
      ],
      totalCapacity: 50000,
      currentUsers: 12450,
    },
    encoders: [
      { id: 1, name: 'Encoder GPU 1', status: 'active', codec: 'H.265/NVENC', bitrate: '25 Mbps', fps: 60 },
      { id: 2, name: 'Encoder GPU 2', status: 'active', codec: 'AV1', bitrate: '15 Mbps', fps: 30 },
      { id: 3, name: 'Encoder GPU 3', status: 'standby', codec: 'H.264', bitrate: '0 Mbps', fps: 0 },
    ],
    cdn: {
      regions: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília'],
      cacheHitRate: 94.5,
      bandwidth: '2.4 Tbps',
      latencyAvg: 12,
    },
    redis: {
      status: 'healthy',
      memory: 4.2,
      maxMemory: 16,
      connections: 850,
      opsPerSec: 45000,
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">LiveKit Cluster</span>
            </div>
            <p className="text-xl font-bold text-green-400">Saudável</p>
            <p className="text-xs text-muted-foreground">3/3 nós ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground">CDN</span>
            </div>
            <p className="text-xl font-bold text-foreground">{infraData.cdn.bandwidth}</p>
            <p className="text-xs text-muted-foreground">4 regiões ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-purple-400" />
              <span className="text-xs text-muted-foreground">Capacidade</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {((infraData.livekit.currentUsers / infraData.livekit.totalCapacity) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {infraData.livekit.currentUsers.toLocaleString('pt-BR')} / {infraData.livekit.totalCapacity.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-orange-400" />
              <span className="text-xs text-muted-foreground">Redis</span>
            </div>
            <p className="text-xl font-bold text-green-400">Operacional</p>
            <p className="text-xs text-muted-foreground">{infraData.redis.opsPerSec.toLocaleString('pt-BR')} ops/s</p>
          </CardContent>
        </Card>
      </div>

      {/* LiveKit Nodes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Cluster LiveKit (WebRTC)</CardTitle>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Todos Saudáveis</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infraData.livekit.nodes.map((node) => (
              <div key={node.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">{node.name}</span>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Cpu size={10} /> CPU
                      </span>
                      <span className="text-foreground">{node.cpu}%</span>
                    </div>
                    <Progress value={node.cpu} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <HardDrive size={10} /> RAM
                      </span>
                      <span className="text-foreground">{node.memory}%</span>
                    </div>
                    <Progress value={node.memory} className="h-1.5" />
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Conexões</span>
                      <span className="text-foreground font-medium">{node.connections.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encoders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Encoders GPU (FFmpeg + NVENC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {infraData.encoders.map((encoder) => (
              <div key={encoder.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className={`w-3 h-3 rounded-full ${encoder.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{encoder.name}</p>
                  <p className="text-xs text-muted-foreground">{encoder.codec}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{encoder.bitrate}</p>
                  <p className="text-xs text-muted-foreground">{encoder.fps} FPS</p>
                </div>
                <Badge className="text-xs">
                  {encoder.status === 'active' ? 'Ativo' : 'Standby'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CDN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">CDN Distribuída</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
              <p className="text-lg font-bold text-foreground">{infraData.cdn.cacheHitRate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bandwidth</p>
              <p className="text-lg font-bold text-foreground">{infraData.cdn.bandwidth}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latência Média</p>
              <p className="text-lg font-bold text-foreground">{infraData.cdn.latencyAvg}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Regiões</p>
              <p className="text-lg font-bold text-foreground">{infraData.cdn.regions.length}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {infraData.cdn.regions.map((region) => (
              <Badge key={region} className="text-xs">
                {region}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}