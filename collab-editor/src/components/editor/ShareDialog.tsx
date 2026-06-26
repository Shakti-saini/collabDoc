'use client';
import { useState, useEffect } from 'react';
import { Users, Mail, Trash2, Crown, Edit3, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

interface Collaborator {
  id: string; role: string;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

interface Props { docId: string; open: boolean; onClose: () => void; }

const ROLE_ICONS = { OWNER: Crown, EDITOR: Edit3, VIEWER: Eye };
const ROLE_COLORS = { OWNER: 'text-yellow-500', EDITOR: 'text-blue-500', VIEWER: 'text-gray-500' };

export function ShareDialog({ docId, open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/documents/${docId}`)
      .then(r => r.json())
      .then(doc => { setCollaborators(doc.access ?? []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [docId, open]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: err.error ?? 'Could not share', variant: 'destructive' });
      } else {
        const newAccess = await res.json();
        setCollaborators(p => {
          const exists = p.find(c => c.user.id === newAccess.user.id);
          if (exists) return p.map(c => c.user.id === newAccess.user.id ? newAccess : c);
          return [...p, newAccess];
        });
        setEmail('');
        toast({ title: 'Access granted', description: `${email} can now ${role === 'EDITOR' ? 'edit' : 'view'} this document` });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await fetch(`/api/documents/${docId}/access?userId=${userId}`, { method: 'DELETE' });
      setCollaborators(p => p.filter(c => c.user.id !== userId));
      toast({ title: 'Access revoked' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Share Document</DialogTitle>
          <DialogDescription>Invite collaborators to view or edit this document.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="pl-9"
                onKeyDown={e => { if (e.key === 'Enter') handleShare(); }} />
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as 'EDITOR' | 'VIEWER')}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} disabled={loading || !email.trim()} className="shrink-0">
              {loading ? 'Sharing…' : 'Share'}
            </Button>
          </div>

          {!fetching && collaborators.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collaborators</p>
              {collaborators.map(c => {
                const RoleIcon = ROLE_ICONS[c.role as keyof typeof ROLE_ICONS] ?? Eye;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(c.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.user.name ?? c.user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.user.email}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs gap-1 ${ROLE_COLORS[c.role as keyof typeof ROLE_COLORS]}`}>
                      <RoleIcon className="w-3 h-3" />{c.role}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(c.user.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
