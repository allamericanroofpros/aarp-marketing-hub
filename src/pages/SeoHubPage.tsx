import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

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

      // Anthropic SSE format: event: ... then data: ...
      if (line.startsWith('event:')) continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') break;

      try {
        const parsed = JSON.parse(jsonStr);
        // Anthropic streaming format
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onDelta(parsed.delta.text);
        }
        // OpenAI-compatible format fallback
        if (parsed.choices?.[0]?.delta?.content) {
          onDelta(parsed.choices[0].delta.content);
        }
      } catch {
        // partial JSON, put back
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush
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

function ChatPanel({ tabValue }: { tabValue: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [tabValue]);

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
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Trash2 size={10} /> Clear conversation
          </button>
        )}
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

export default function SeoHubPage() {
  const [activeTab, setActiveTab] = useState('keywords');
  return (
    <div>
      <div className="mb-3">
        <h1 className="text-lg font-semibold">SEO Hub</h1>
        <p className="text-xs text-muted-foreground">AI-powered SEO assistant for All American Roof Pros</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(t => (
          <TabsContent key={t.value} value={t.value}>
            <ChatPanel tabValue={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
