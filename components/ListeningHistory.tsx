import React, { useState, useEffect } from 'react';
import { listeningHistoryService, ListeningEvent } from '../services/listeningHistoryService';

interface ListeningHistoryProps {
  userId?: string;
  onClose: () => void;
}

const ListeningHistory: React.FC<ListeningHistoryProps> = ({ 
  userId = 'beccabear@13', 
  onClose 
}) => {
  const [history, setHistory] = useState<ListeningEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [userId, daysBack]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyData = await listeningHistoryService.getListeningHistory(userId, daysBack);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await listeningHistoryService.getListeningStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto border-2 border-[var(--color-surface)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-accent)]">
            🎵 Listening History
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-2xl"
          >
            ×
          </button>
        </div>

        {/* Time Period Selector */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {[1, 7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDaysBack(days)}
              className={`px-3 py-1 rounded text-sm ${
                daysBack === days 
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
              }`}
            >
              Last {days} day{days > 1 ? 's' : ''}
            </button>
          ))}
        </div>

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{stats.totalSongs}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Total Plays</div>
            </div>
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{stats.uniqueSongs}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Unique Songs</div>
            </div>
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">
                {formatDuration(stats.totalListeningTime)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Total Time</div>
            </div>
            <div className="bg-[var(--color-surface)] rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-[var(--color-accent)]">
                {stats.mostPlayedSong ? 
                  stats.mostPlayedSong.substring(0, 15) + (stats.mostPlayedSong.length > 15 ? '...' : '')
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Most Played</div>
            </div>
          </div>
        )}

        {/* History List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-[var(--color-text-secondary)]">Loading history...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[var(--color-text-secondary)]">No listening history found for the selected period.</div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-2">
              Start playing some songs to see your listening history!
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Recent Activity ({history.length} plays)
            </h3>
            {history.map((event, index) => (
              <div
                key={event.id || index}
                className="bg-[var(--color-surface)] rounded-lg p-3 flex items-center justify-between hover:bg-[var(--color-surface-light)] transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {event.songTitle}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {formatDate(event.timestamp)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-[var(--color-text-primary)]">
                    {formatDuration(event.duration)}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {event.completed ? '✅ Completed' : '⏸️ Partial'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Options */}
        <div className="mt-6 pt-4 border-t border-[var(--color-surface)] flex gap-2">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(history, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `listening-history-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded text-sm text-[var(--color-text-primary)]"
          >
            📥 Export JSON
          </button>
          <button
            onClick={() => {
              const csvContent = [
                'Song Title,Date,Duration (seconds),Completed',
                ...history.map(h => 
                  `"${h.songTitle}","${new Date(h.timestamp).toISOString()}",${h.duration},${h.completed}`
                )
              ].join('\n');
              
              const dataBlob = new Blob([csvContent], {type: 'text/csv'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `listening-history-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] rounded text-sm text-[var(--color-text-primary)]"
          >
            📊 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListeningHistory;