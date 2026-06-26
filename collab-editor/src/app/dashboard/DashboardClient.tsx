'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, Users, Clock, Trash2, Share2, GitBranch, LogOut, Moon, Sun, Search } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { formatDate, getInitials, truncate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface User { id?: string; name?: string | null; email?: string | null; image?: string | null; }
interface Doc { id: string; title: string; updatedAt: string; version: number; myRole?: string; owner?: { name?: string | null; image?: string | null }; access?: { user: { name?: string | null } }[] }

export function DashboardClient({ user }: { user: User }) {
  const [ownedDocs, setOwnedDocs] = useState<Doc[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOwnedDocs(data.owned ?? []);
      setSharedDocs(data.shared ?? []);
    } catch { toast({ title: 'Error', description: 'Could not load documents', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const createDoc = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled Document' }) });
      const doc = await res.json();
      router.push(`/editor/${doc.id}`);
    } catch { toast({ title: 'Error', description: 'Could not create document', variant: 'destructive' }); setCreating(false); }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document permanently?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setOwnedDocs(p => p.filter(d => d.id !== id));
      toast({ title: 'Document deleted' });
    } catch { toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' }); }
  };

  const filterDocs = (docs: Doc[]) => docs.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const DocCard = ({ doc, isOwned }: { doc: Doc; isOwned: boolean }) => (
    <div className="group bg-card border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/30 relative">
      <Link href={`/editor/${doc.id}`} className="block">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDate(doc.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{doc.myRole ?? 'OWNER'}</Badge>
          {!isOwned && doc.owner && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Avatar className="w-4 h-4"><AvatarImage src={doc.owner.image ?? undefined} /><AvatarFallback className="text-[8px]">{getInitials(doc.owner.name)}</AvatarFallback></Avatar>
              <span>{truncate(doc.owner.name ?? 'Unknown', 15)}</span>
            </div>
          )}
          {isOwned && doc.access && doc.access.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />{doc.access.length}
            </div>
          )}
        </div>
      </Link>
      {isOwned && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/editor/${doc.id}`)}>
            <Share2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteDoc(doc.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CollabDocs</span>
          </div>
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents..." className="pl-9 h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                  <Avatar className="w-8 h-8"><AvatarImage src={user.image ?? undefined} /><AvatarFallback>{getInitials(user.name)}</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm"><p className="font-medium">{user.name}</p><p className="text-muted-foreground text-xs">{user.email}</p></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">Create, edit, and collaborate offline-first</p>
          </div>
          <Button onClick={createDoc} disabled={creating} className="gap-2">
            <Plus className="w-4 h-4" />{creating ? 'Creating...' : 'New Document'}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <>
            {filterDocs(ownedDocs).length === 0 && filterDocs(sharedDocs).length === 0 ? (
              <div className="text-center py-24">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{searchQuery ? 'No documents found' : 'No documents yet'}</h3>
                <p className="text-muted-foreground mb-6">{searchQuery ? 'Try a different search term' : 'Create your first document to get started'}</p>
                {!searchQuery && <Button onClick={createDoc}><Plus className="w-4 h-4 mr-2" />Create Document</Button>}
              </div>
            ) : (
              <div className="space-y-8">
                {filterDocs(ownedDocs).length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Documents ({filterDocs(ownedDocs).length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filterDocs(ownedDocs).map(doc => <DocCard key={doc.id} doc={doc} isOwned />)}
                    </div>
                  </div>
                )}
                {filterDocs(sharedDocs).length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Shared with Me ({filterDocs(sharedDocs).length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filterDocs(sharedDocs).map(doc => <DocCard key={doc.id} doc={doc} isOwned={false} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>CollabDocs — Local-First Collaborative Editor</p>
          <div className="flex gap-4">
            <span>Developer: Your Name</span>
            <a href="https://github.com/yourusername" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://linkedin.com/in/yourusername" className="hover:text-foreground transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
