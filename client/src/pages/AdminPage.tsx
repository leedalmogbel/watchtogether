import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Settings, ExternalLink, Power } from 'lucide-react';
import { toast } from 'sonner';
import type { Channel } from '@/types';

export default function AdminPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.channels.list();
      setChannels(data.channels);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load channels');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.channels.create({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadChannels();
      toast.success('Channel created!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create channel');
    }
  };

  const toggleChannel = async (channel: Channel) => {
    await api.channels.update(channel.slug, { isActive: !channel.isActive });
    loadChannels();
    toast.success(channel.isActive ? 'Channel disabled' : 'Channel enabled');
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your channels</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Channel
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-3">
              <Input
                placeholder="Channel name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {channels.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">No channels yet</p>
          <p className="text-sm">Create your first channel to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {channels.map(channel => (
          <Card key={channel.id} className="transition-colors hover:border-primary/30">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{channel.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      channel.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {channel.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">/{channel.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleChannel(channel)} title={channel.isActive ? 'Disable' : 'Enable'}>
                  <Power className="h-4 w-4" />
                </Button>
                <Link to={`/admin/channel/${channel.slug}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </Link>
                <Link to={`/channel/${channel.slug}`}>
                  <Button variant="ghost" size="icon" title="View channel">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
