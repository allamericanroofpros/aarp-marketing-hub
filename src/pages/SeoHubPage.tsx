import { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Send, Loader2, Trash2, Save, FolderOpen, Clock, Plus, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TABS = [
  { value: 'keywords', label: 'Keyword Research' },
  { value: 'briefs', label: 'Content Brief' },
  { value: 'onpage', label: 'On-Page Analysis' },
  { value: 'competitor', label: 'Competitor Analysis' },
  { value: 'backlinks', label: 'Backlink Strategy' },
];

const QUICK_PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  keywords: [
    { label: 'Cluster keywords', prompt: 'I will paste a list of keywords. Group them into semantic clusters with search intent labels (informational, commercial, transactional) and suggest which to prioritize based on business impact vs competition. Ready for my list.' },
    { label: 'Long-tail opportunities', prompt: 'What are high-intent long-tail keyword opportunities for a roofing company in Ohio (Mansfield, Sandusky, Huron)? Focus on buyer-intent keywords that are easier to rank for.' },
    { label: 'Featured snippet targets', prompt: 'How do I identify roofing keywords where I can win featured snippets? What content format works best for each snippet type?' },
    { label: 'Local keyword strategy', prompt: 'Build me a local SEO keyword strategy for a roofing company serving Mansfield, Sandusky, and Huron Ohio. Include city + service combinations and near-me variants.' },
  ],
  briefs: [
    { label: 'Full content brief', prompt: 'Create a detailed SEO content brief for a roofing company. Include: target keyword, secondary keywords, search intent, word count, H1/H2/H3 structure, key topics, FAQs, and what top-ranking content is missing. Tell me the topic and location.' },
    { label: 'Outrank a competitor', prompt: 'I want to outrank a competitor page. Give me their URL and I will help you build a brief to beat them. What competitor URL do you want to target?' },
    { label: 'Topic cluster plan', prompt: 'Build a topic cluster strategy for a roofing company. Give me a pillar page topic and I will map out 8-10 supporting cluster pages that build topical authority.' },
    { label: 'E-E-A-T checklist', prompt: 'Give me a practical E-E-A-T checklist for a roofing company website. What signals does Google look for and how do we demonstrate expertise, experience, authority and trust in the home services space?' },
  ],
  onpage: [
    { label: 'Audit my page', prompt: 'I will paste my page title, meta description, H1, H2s, and content sample. Give me a full on-page SEO audit with prioritized fixes for a roofing company page.' },
    { label: 'Title tag formulas', prompt: 'Give me 5 high-CTR title tag formulas for roofing service pages targeting local cities in Ohio. Include fill-in-the-blank templates for different intents.' },
    { label: 'Schema markup plan', prompt: 'Which schema markup types will give a roofing company website the highest visibility gains? Give me a prioritized implementation plan for our page types.' },
    { label: 'Internal linking audit', prompt: 'What is a systematic approach to auditing and improving internal linking for a roofing company site with location pages and service pages? How do I identify orphan pages and link equity waste?' },
  ],
  competitor: [
    { label: 'Reverse-engineer competitor', prompt: "Help me reverse-engineer a roofing competitor's SEO strategy. What should I analyze in their content, site structure, and backlinks to understand why they outrank us?" },
    { label: 'Content gap analysis', prompt: 'Walk me through a content gap analysis against a stronger roofing competitor in Ohio. What topics are they ranking for that we are not, and how do I prioritize closing those gaps?' },
    { label: 'Is this keyword winnable?', prompt: 'How do I analyze a SERP to determine if a roofing keyword is realistically winnable for a local company? What signals tell me we can rank on page 1?' },
    { label: 'Find their weaknesses', prompt: 'What are the most common SEO weaknesses that even well-ranking roofing competitors have? How do I find and exploit them to take their rankings?' },
  ],
  backlinks: [
    { label: '90-day link roadmap', prompt: 'Build me a 90-day link building roadmap for a roofing company in Ohio. Include specific tactics, realistic monthly targets, and outreach angles. Be tactical not generic.' },
    { label: 'Best link sources', prompt: 'What are the highest-value backlink sources for a local roofing company that are actually acquirable? Rank them by difficulty vs impact with pitch angles for each.' },
    { label: 'Digital PR strategy', prompt: 'How do I use digital PR to earn high-authority backlinks for a roofing company? What content hooks consistently earn links from local news and industry publications?' },
    { label: 'Anchor text strategy', prompt: 'What is the right anchor text distribution strategy for a roofing company building links? How do I avoid over-optimization while still passing keyword relevance signals?' },
  ],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-chat`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SavedBrief {
  id: string;
  title: string;
  category: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    let errorMsg = 'Failed to get response';
    try {
      const parsed = JSON.parse(body);
      errorMsg = parsed.error || errorMsg;
    } catch {}
    if (resp.status === 429) toast.error('Rate limit exceeded. Please wait a moment.');
    else if (resp.status === 402) toast.error('AI credits exhausted. Add credits in workspace settings.');
    else toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (line.startsWith('event:')) continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') break;

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onDelta(parsed.delta.text);
        }
        if (parsed.choices?.[0]?.delta?.content) {
          onDelta(parsed.choices[0].delta.content);
        }
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '' || raw.startsWith('event:')) continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onDelta(parsed.delta.text);
        }
        if (parsed.choices?.[0]?.delta?.content) {
          onDelta(parsed.choices[0].delta.content);
        }
      } catch {}
    }
  }

  onDone();
}

function ChatPanel({
  tabValue,
  messages,
  setMessages,
  onSave,
  currentBriefId,
  hasUnsavedChanges,
}: {
  tabValue: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSave: () => void;
  currentBriefId: string | null;
  hasUnsavedChanges: boolean;
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updated,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting. Please try again.' }]);
      }
    }
  };

  const prompts = QUICK_PROMPTS[tabValue] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => send(p.prompt)}
            disabled={isLoading}
            className="text-[10px] px-2.5 py-1 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 bg-secondary/30"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-1 pr-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Use a quick prompt above or type your question below
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.role === 'user' ? (
                  <span>{m.content}</span>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pt-3 border-t border-border mt-2 space-y-1.5">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={() => setMessages([])}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Trash2 size={10} /> Clear
              </button>
              <button
                onClick={onSave}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Save size={10} /> {currentBriefId ? 'Update' : 'Save'} brief
                {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Ask about SEO strategy…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            className="flex-1 text-xs resize-none min-h-0"
          />
          <Button size="icon" onClick={() => send()} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground">SHIFT+ENTER for new line · ENTER to send</p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function SeoHubPage() {
  const [activeTab, setActiveTab] = useState('keywords');
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [briefsOpen, setBriefsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const lastSavedRef = useRef<string>('');

  const fetchBriefs = useCallback(async () => {
    const { data } = await supabase
      .from('seo_briefs')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setSavedBriefs(data as unknown as SavedBrief[]);
  }, []);

  useEffect(() => { fetchBriefs(); }, [fetchBriefs]);

  // Track unsaved changes
  useEffect(() => {
    const serialized = JSON.stringify(messages);
    if (serialized !== lastSavedRef.current && messages.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [messages]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!currentBriefId) {
      setMessages([]);
      setHasUnsavedChanges(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentBriefId(null);
    setHasUnsavedChanges(false);
    lastSavedRef.current = '';
  };

  const handleSave = () => {
    if (currentBriefId) {
      // Update existing
      doSave(currentBriefId, savedBriefs.find(b => b.id === currentBriefId)?.title || 'Untitled');
    } else {
      // Auto-generate title from first user message
      const firstUser = messages.find(m => m.role === 'user');
      setSaveTitle(firstUser ? firstUser.content.slice(0, 60) : 'Untitled brief');
      setSaveDialogOpen(true);
    }
  };

  const doSave = async (id: string | null, title: string) => {
    const payload = {
      title,
      category: activeTab,
      messages: JSON.parse(JSON.stringify(messages)),
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase.from('seo_briefs').update(payload).eq('id', id);
      if (error) { toast.error('Failed to update brief'); return; }
      toast.success('Brief updated');
    } else {
      const { data, error } = await supabase.from('seo_briefs').insert(payload).select('id').single();
      if (error || !data) { toast.error('Failed to save brief'); return; }
      setCurrentBriefId(data.id);
      toast.success('Brief saved');
    }

    lastSavedRef.current = JSON.stringify(messages);
    setHasUnsavedChanges(false);
    setSaveDialogOpen(false);
    fetchBriefs();
  };

  const loadBrief = (brief: SavedBrief) => {
    setMessages(brief.messages);
    setActiveTab(brief.category);
    setCurrentBriefId(brief.id);
    lastSavedRef.current = JSON.stringify(brief.messages);
    setHasUnsavedChanges(false);
    setBriefsOpen(false);
  };

  const deleteBrief = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('seo_briefs').delete().eq('id', deleteId);
    if (error) { toast.error('Delete failed'); return; }
    if (currentBriefId === deleteId) startNewChat();
    toast.success('Brief deleted');
    setDeleteId(null);
    fetchBriefs();
  };

  const doRename = async () => {
    if (!renameId || !renameTitle.trim()) return;
    const { error } = await supabase.from('seo_briefs').update({ title: renameTitle.trim() }).eq('id', renameId);
    if (error) { toast.error('Rename failed'); return; }
    toast.success('Renamed');
    setRenameId(null);
    fetchBriefs();
  };

  const categoryLabel = (cat: string) => TABS.find(t => t.value === cat)?.label || cat;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold">SEO Hub</h1>
          <p className="text-xs text-muted-foreground">AI-powered SEO assistant for All American Roof Pros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setBriefsOpen(true)}>
            <FolderOpen size={13} /> Saved Briefs
            {savedBriefs.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0.5 leading-none">
                {savedBriefs.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={startNewChat}>
            <Plus size={13} /> New Chat
          </Button>
        </div>
      </div>

      {currentBriefId && (
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <Save size={11} />
          <span>Editing: <strong className="text-foreground">{savedBriefs.find(b => b.id === currentBriefId)?.title}</strong></span>
          {hasUnsavedChanges && <span className="text-[10px] text-primary">(unsaved changes)</span>}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-3">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(t => (
          <TabsContent key={t.value} value={t.value}>
            <ChatPanel
              tabValue={t.value}
              messages={messages}
              setMessages={setMessages}
              onSave={handleSave}
              currentBriefId={currentBriefId}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Brief</DialogTitle>
            <DialogDescription>Give this conversation a name so you can find it later.</DialogDescription>
          </DialogHeader>
          <Input
            value={saveTitle}
            onChange={e => setSaveTitle(e.target.value)}
            placeholder="Brief title"
            onKeyDown={e => { if (e.key === 'Enter') doSave(null, saveTitle); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => doSave(null, saveTitle)} disabled={!saveTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Briefs Drawer */}
      <Dialog open={briefsOpen} onOpenChange={setBriefsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Briefs</DialogTitle>
            <DialogDescription>Click a brief to resume the conversation.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {savedBriefs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved briefs yet. Start a chat and click "Save brief" to keep it.</p>
            ) : (
              <div className="space-y-1">
                {savedBriefs.map(b => (
                  <div
                    key={b.id}
                    className={`group flex items-center gap-2 p-2.5 rounded-md cursor-pointer transition-colors hover:bg-muted ${currentBriefId === b.id ? 'bg-muted border border-border' : ''}`}
                    onClick={() => loadBrief(b)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="bg-secondary px-1.5 py-0.5 rounded text-[9px]">{categoryLabel(b.category)}</span>
                        <span className="flex items-center gap-0.5"><Clock size={9} /> {formatDate(b.updated_at)}</span>
                        <span>{(b.messages?.length || 0)} msgs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={e => { e.stopPropagation(); setRenameId(b.id); setRenameTitle(b.title); }}
                      >
                        <Pencil size={11} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={e => { e.stopPropagation(); setDeleteId(b.id); }}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameId} onOpenChange={open => { if (!open) setRenameId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Brief</DialogTitle>
            <DialogDescription>Enter a new title for this brief.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={e => setRenameTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doRename(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={doRename} disabled={!renameTitle.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brief?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this saved conversation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBrief}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
