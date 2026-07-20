import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface EventData {
  id: number;
  title: string;
  competition: string;
  team_home: string;
  team_away: string;
  stadium: string;
  start_time: string;
  status: string;
  viewers_count: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  live: { label: 'AO VIVO', className: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse-live' },
  scheduled: { label: 'AGENDADO', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  finished: { label: 'ENCERRADO', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  cancelled: { label: 'CANCELADO', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

export function EventsPanel() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await client.entities.events.query({ query: {}, sort: '-start_time' });
      if (response?.data?.items) {
        setEvents(response.data.items);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Total Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Ao Vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{events.filter(e => e.status === 'live').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{events.filter(e => e.status === 'scheduled').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Encerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{events.filter(e => e.status === 'finished').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => {
          const config = statusConfig[event.status] || statusConfig.scheduled;
          return (
            <Card key={event.id} className={`transition-all hover:border-primary/30 ${event.status === 'live' ? 'border-red-500/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={config.className}>{config.label}</Badge>
                  {event.viewers_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={12} />
                      <span>{event.viewers_count.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{event.title}</h3>
                <p className="text-sm text-primary font-medium mb-3">{event.competition}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{event.stadium}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    <span>{new Date(event.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>{new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Teams */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{event.team_home}</span>
                    <span className="text-xs text-muted-foreground px-3">vs</span>
                    <span className="text-sm font-semibold text-foreground">{event.team_away}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}