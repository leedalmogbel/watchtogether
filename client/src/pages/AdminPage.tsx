import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Channel } from '../types';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.channels.list();
      setChannels(data.channels);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.channels.create({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadChannels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    }
  };

  const toggleChannel = async (channel: Channel) => {
    await api.channels.update(channel.slug, { isActive: !channel.isActive });
    loadChannels();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <p>Logged in as {user?.displayName}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Channel'}
        </button>
        {showCreate && (
          <form onSubmit={handleCreate} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Channel name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              style={{ flex: 1, padding: 8 }}
            />
            <button type="submit">Create</button>
          </form>
        )}
      </div>

      <h2>Channels</h2>
      {channels.length === 0 && <p>No channels yet.</p>}
      {channels.map(channel => (
        <div key={channel.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 12, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8,
        }}>
          <div>
            <strong>{channel.name}</strong>
            <span style={{ marginLeft: 8, color: '#888' }}>/{channel.slug}</span>
            <span style={{
              marginLeft: 8, padding: '2px 6px', borderRadius: 4, fontSize: 12,
              background: channel.isActive ? '#dfd' : '#fdd',
            }}>
              {channel.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => toggleChannel(channel)}>
              {channel.isActive ? 'Disable' : 'Enable'}
            </button>
            <Link to={`/admin/channel/${channel.slug}`}>
              <button>Manage</button>
            </Link>
            <Link to={`/channel/${channel.slug}`}>
              <button>View</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
