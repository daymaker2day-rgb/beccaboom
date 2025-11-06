import React, { useState, useEffect } from 'react';
import { listeningHistoryService, ListeningEvent } from '../services/listeningHistoryService';
import ListeningHistory from './ListeningHistory';
import QuickCheck from './QuickCheck';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<ListeningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, historyData] = await Promise.all([
        listeningHistoryService.getListeningStats('beccabear@13'),
        listeningHistoryService.getListeningHistory('beccabear@13', 7)
      ]);
      setStats(statsData);
      setRecentActivity(historyData.slice(0, 10)); // Last 10 activities
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  if (activeTab === 'history') {
    return <ListeningHistory userId="beccabear@13" onClose={() => setActiveTab('overview')} />;
  }

  if (activeTab === 'check') {
    return <QuickCheck onClose={() => setActiveTab('overview')} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto border-2 border-[var(--color-accent)]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-[var(--color-surface)] pb-4">
          <h1 className="text-3xl font-bold text-[var(--color-accent)]">
            🔐 Admin Dashboard - Rebecca's Music Tracking
          </h1>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === 'overview'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === 'history'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
            }`}
          >
            📋 Full History
          </button>
          <button
            onClick={() => setActiveTab('check')}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === 'check'
                ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
            }`}
          >
            🔍 Check Specific Song
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--color-text-secondary)]">Loading dashboard...</div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Quick Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                  <div className="text-3xl font-bold">{stats.totalSongs}</div>
                  <div className="text-purple-100">Total Songs Played</div>
                  <div className="text-sm text-purple-200 mt-1">All listening sessions</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                  <div className="text-3xl font-bold">{stats.uniqueSongs}</div>
                  <div className="text-blue-100">Unique Songs</div>
                  <div className="text-sm text-blue-200 mt-1">Different tracks played</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                  <div className="text-3xl font-bold">{formatDuration(stats.totalListeningTime)}</div>
                  <div className="text-green-100">Total Listen Time</div>
                  <div className="text-sm text-green-200 mt-1">Cumulative duration</div>
                </div>
                
                <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                  <div className="text-2xl font-bold">
                    {stats.mostPlayedSong ? 
                      stats.mostPlayedSong.substring(0, 12) + (stats.mostPlayedSong.length > 12 ? '...' : '')
                      : 'N/A'
                    }
                  </div>
                  <div className="text-pink-100">Most Played Song</div>
                  <div className="text-sm text-pink-200 mt-1">Current favorite</div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-[var(--color-surface)] rounded-lg p-6">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
                📅 Recent Activity (Last 7 Days)
              </h3>
              
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  No recent listening activity found
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          🎵 {activity.songTitle}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-[var(--color-text-primary)]">
                          {Math.floor(activity.duration / 60)}:{(activity.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          activity.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.completed ? '✅ Completed' : '⏸️ Partial'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('history')}
                className="p-4 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                📋 View Complete History
              </button>
              
              <button
                onClick={() => setActiveTab('check')}
                className="p-4 bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg font-bold hover:bg-[var(--color-surface-light)] transition-colors"
              >
                🔍 Check Specific Song
              </button>
              
              <button
                onClick={() => {
                  const data = JSON.stringify(recentActivity, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `rebecca-listening-${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-4 bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg font-bold hover:bg-[var(--color-surface-light)] transition-colors"
              >
                📥 Export Data
              </button>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div>
                  <div className="font-bold text-yellow-800">Admin Dashboard</div>
                  <div className="text-yellow-700 text-sm">
                    This dashboard is for parent monitoring only. The main player interface remains clean for Rebecca.
                    All tracking happens silently in the background.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;