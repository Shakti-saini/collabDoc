'use client';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncEngine } from '@/lib/sync/syncEngine';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'syncing' | 'offline' | 'error';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<Status>('idle');

  useEffect(() => {
    setIsOnline(syncEngine.getIsOnline());
    const unsub = syncEngine.subscribe((status) => {
      setSyncStatus(status);
      setIsOnline(syncEngine.getIsOnline());
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { unsub(); window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
        <WifiOff className="w-3 h-3" /><span>Offline</span>
      </div>
    );
  }
  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        <RefreshCw className="w-3 h-3 animate-spin" /><span>Syncing</span>
      </div>
    );
  }
  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
        <AlertCircle className="w-3 h-3" /><span>Sync error</span>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full", "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400")}>
      <CheckCircle2 className="w-3 h-3" /><span>Synced</span>
    </div>
  );
}
