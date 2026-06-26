'use client';
import { useState } from 'react';
import { Sparkles, X, Wand2, FileText, Expand, CheckCircle, Smile, MessageSquare, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Props {
  content: Record<string, unknown>;
  onApply: (content: Record<string, unknown>) => void;
  onClose: () => void;
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;
  if (n.type === 'text') return (n.text as string) ?? '';
  if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join(' ');
  return '';
}

function wrapInDoc(text: string): Record<string, unknown> {
  const paragraphs = text.split('\n').filter(Boolean).map(line => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line }],
  }));
  return { type: 'doc', content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }] };
}

type AIAction = 'improve' | 'summarize' | 'expand' | 'grammar' | 'tone' | 'custom';

const ACTIONS = [
  { id: 'improve' as AIAction, label: 'Improve Writing', icon: Wand2, desc: 'Enhance clarity and flow' },
  { id: 'summarize' as AIAction, label: 'Summarize', icon: FileText, desc: 'Create a brief summary' },
  { id: 'expand' as AIAction, label: 'Expand', icon: Expand, desc: 'Add more detail and context' },
  { id: 'grammar' as AIAction, label: 'Fix Grammar', icon: CheckCircle, desc: 'Fix errors and typos' },
  { id: 'tone' as AIAction, label: 'Change Tone', icon: Smile, desc: 'Adjust writing style' },
  { id: 'custom' as AIAction, label: 'Custom', icon: MessageSquare, desc: 'Give a specific instruction' },
];

export function AIAssistant({ content, onApply, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [selectedAction, setSelectedAction] = useState<AIAction>('improve');
  const [tone, setTone] = useState('professional');
  const [customInstruction, setCustomInstruction] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const docText = extractText(content);

  const handleRun = async () => {
    if (!docText.trim()) { toast({ title: 'Document is empty', description: 'Add some content first.', variant: 'destructive' }); return; }
    setLoading(true); setResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          content: docText.slice(0, 8000),
          tone: selectedAction === 'tone' ? tone : undefined,
          instruction: selectedAction === 'custom' ? customInstruction : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result ?? '');
    } catch (e) {
      toast({ title: 'AI Error', description: (e as Error).message ?? 'Try again.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(wrapInDoc(result));
    toast({ title: 'AI suggestion applied' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Action selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Action</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${selectedAction === action.id ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                >
                  <action.icon className="w-3.5 h-3.5 mb-1 text-primary" />
                  <p className="text-xs font-medium leading-tight">{action.label}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedAction === 'tone' && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Tone</p>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedAction === 'custom' && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Instruction</p>
              <textarea
                value={customInstruction}
                onChange={e => setCustomInstruction(e.target.value)}
                placeholder="E.g. 'Make it more concise' or 'Add a call to action at the end'"
                className="w-full h-20 text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          )}

          <Button onClick={handleRun} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing…' : 'Run AI'}
          </Button>

          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</p>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleCopy}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed max-h-64 overflow-y-auto border whitespace-pre-wrap">
                {result}
              </div>
              <Button onClick={handleApply} variant="outline" className="w-full gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Apply to Document
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="font-medium mb-1">💡 Tips</p>
            <ul className="space-y-0.5">
              <li>• Works on your entire document</li>
              <li>• Always save a version before applying</li>
              <li>• Use &quot;Copy&quot; to keep both versions</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
