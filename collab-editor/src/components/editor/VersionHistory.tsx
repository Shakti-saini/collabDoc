'use client';
import { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Version {
  id: string; version: number; label?: string | null; createdAt: string;
  createdBy: { id: string; name?: string | null; image?: string | null };
  content: Record<string, unknown>;
}

interface Props {
  docId: string;
  onRestore: (content: Record<string, unknown>) => void;
  onClose: () => void;
  canRestore: boolean;
}

export function VersionHistory({ docId, onRestore, onClose, canRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selected, setSelected] = useState<Version | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/documents/${docId}/versions`)
      .then(r => r.json())
      .then(data => { setVersions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  const handleRestore = async (version: Version) => {
    if (!canRestore) return;
    setRestoring(version.id);
    try {
      const res = await fetch(`/api/documents/${docId}/versions/${version.id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error();
      onRestore(version.content);
      toast({ title: 'Version restored', description: `Restored to: ${version.label ?? `Version ${version.version}`}` });
    } catch {
      toast({ title: 'Restore failed', variant: 'destructive' });
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Version History</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No saved versions yet.</p>
            <p className="text-xs mt-1">Click "Save Version" to create a snapshot.</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {versions.map(v => (
              <div
                key={v.id}
                onClick={() => setSelected(selected?.id === v.id ? null : v)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${selected?.id === v.id ? 'border-primary bg-accent' : 'border-transparent hover:border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{v.label ?? `Version ${v.version}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /><span>{formatDate(v.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={v.createdBy.image ?? undefined} />
                        <AvatarFallback className="text-[8px]">{getInitials(v.createdBy.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{v.createdBy.name ?? 'Unknown'}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">v{v.version}</Badge>
                </div>
                {selected?.id === v.id && canRestore && (
                  <Button
                    size="sm" className="w-full mt-2 h-7 text-xs gap-1.5"
                    onClick={(e) => { e.stopPropagation(); handleRestore(v); }}
                    disabled={restoring === v.id}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {restoring === v.id ? 'Restoring…' : 'Restore this version'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
