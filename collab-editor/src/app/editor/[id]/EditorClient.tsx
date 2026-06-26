'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, History, Users, Share2, Sparkles, MoreHorizontal, GitBranch, Moon, Sun, Eye } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { ShareDialog } from '@/components/editor/ShareDialog';
import { AIAssistant } from '@/components/editor/AIAssistant';
import { CollaboratorAvatars } from '@/components/editor/CollaboratorAvatars';
import { syncEngine } from '@/lib/sync/syncEngine';
import { saveDocumentLocally, getLocalDocument } from '@/lib/sync/indexedDB';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface User { id?: string; name?: string | null; email?: string | null; image?: string | null; }

export function EditorClient({ docId, user }: { docId: string; user: User }) {
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [role, setRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('VIEWER');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user.id) syncEngine.init(user.id);
  }, [user.id]);

  useEffect(() => {
    const loadDocument = async () => {
      // Try local first (offline-first!)
      const local = await getLocalDocument(docId);
      if (local) {
        setTitle(local.title);
        setContent(local.content);
      }
      // Then fetch remote
      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (res.status === 401) { router.push('/auth/signin'); return; }
        if (res.status === 404 || res.status === 403) { router.push('/dashboard'); return; }
        if (res.ok) {
          const doc = await res.json();
          setTitle(doc.title);
          setContent(doc.content ?? {});
          setRole(doc.myRole ?? 'VIEWER');
          // Cache locally
          await saveDocumentLocally({ id: docId, title: doc.title, content: doc.content ?? {}, version: doc.version, updatedAt: doc.updatedAt, isDirty: false, lastSyncedVersion: doc.version });
        }
      } catch { /* use local data if offline */ }
      setLoading(false);
    };
    loadDocument();
  }, [docId, router]);

  const handleContentChange = useCallback((newContent: Record<string, unknown>) => {
    setContent(newContent);
    if (role === 'VIEWER') return;
    // Debounced save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      await syncEngine.saveLocally(docId, { title, content: newContent });
      setIsSaving(false);
    }, 1000);
  }, [docId, title, role]);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    if (role === 'VIEWER') return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await syncEngine.saveLocally(docId, { title: newTitle, content });
    }, 800);
  }, [docId, content, role]);

  const saveVersion = async () => {
    const label = prompt('Version label (optional):');
    try {
      await fetch(`/api/documents/${docId}/versions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      toast({ title: 'Version saved', description: label ? `Saved as "${label}"` : 'Snapshot captured' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleRestore = (restoredContent: Record<string, unknown>) => {
    setContent(restoredContent);
    setShowHistory(false);
    toast({ title: 'Version restored', description: 'Document restored to selected version' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GitBranch className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="flex-1 min-w-0">
            {role !== 'VIEWER' ? (
              <input value={title} onChange={e => handleTitleChange(e.target.value)} className="bg-transparent border-none outline-none text-lg font-semibold w-full truncate focus:ring-0 p-0" placeholder="Document title..." />
            ) : (
              <h1 className="text-lg font-semibold truncate">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {role === 'VIEWER' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Eye className="w-3 h-3" /> View only
              </div>
            )}
            {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
            <ConnectionStatus />
            <CollaboratorAvatars docId={docId} currentUserId={user.id ?? ''} />
            {role !== 'VIEWER' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowAI(!showAI)} className="gap-1.5 h-8">
                  <Sparkles className="w-3.5 h-3.5" /><span className="hidden sm:inline">AI</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={saveVersion} className="gap-1.5 h-8">
                  <Save className="w-3.5 h-3.5" /><span className="hidden sm:inline">Save Version</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4" />
            </Button>
            {role === 'OWNER' && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShare(true)}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  Toggle theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <DocumentEditor content={content} onContentChange={handleContentChange} editable={role !== 'VIEWER'} userId={user.id ?? ''} userName={user.name ?? 'Anonymous'} />
          </div>
        </main>

        {/* Side panels */}
        {showAI && (
          <aside className="w-80 border-l bg-card overflow-auto shrink-0">
            <AIAssistant content={content} onApply={(newContent) => { setContent(newContent); handleContentChange(newContent); }} onClose={() => setShowAI(false)} />
          </aside>
        )}
        {showHistory && (
          <aside className="w-80 border-l bg-card overflow-auto shrink-0">
            <VersionHistory docId={docId} onRestore={handleRestore} onClose={() => setShowHistory(false)} canRestore={role !== 'VIEWER'} />
          </aside>
        )}
      </div>

      {/* Share dialog */}
      {showShare && <ShareDialog docId={docId} open={showShare} onClose={() => setShowShare(false)} />}
    </div>
  );
}
