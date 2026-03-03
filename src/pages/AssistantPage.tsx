import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Trash2, Save, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-chat`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "What's the best marketing strategy for roofing in spring?",
  "Write a follow-up email for a homeowner who got a free estimate.",
  "How should we respond to a negative Google review?",
  "Give me a weekly recap template for the sales team.",
  "What Facebook ad angles work best for storm damage?",
  "Create a script for our ISRs to book more appointments.",
];

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
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
    let msg = 'Failed to get response';
    try { msg = JSON.parse(body).error || msg; } catch {}
    if (resp.status === 429) toast.error('Rate limit exceeded. Please wait a moment.');
    else if (resp.status === 402) toast.error('AI credits exhausted.');
    else toast.error(msg);
    throw new Error(msg);
  }

  if (!resp.body) throw new Error('No response body');
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ') || line.startsWith(':') || line.startsWith('event:')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') break;
      try {
        const p = JSON.parse(json);
        if (p.type === 'content_block_delta' && p.delta?.text) onDelta(p.delta.text);
        if (p.choices?.[0]?.delta?.content) onDelta(p.choices[0].delta.content);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    const upsert = (chunk: string) => {
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
      await streamChat({ messages: updated, onDelta: upsert, onDone: () => setIsLoading(false) });
    } catch {
      setIsLoading(false);
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting. Please try again.' }]);
      }
    }
  };

  const saveConversation = async () => {
    if (messages.length === 0) return;
    setSaving(true);
    const firstUser = messages.find(m => m.role === 'user');
    const title = firstUser ? firstUser.content.slice(0, 60) : 'Untitled';
    const { error } = await supabase.from('seo_briefs').insert({
      title: `Assistant: ${title}`,
      category: 'assistant',
      messages: JSON.parse(JSON.stringify(messages)),
    });
    setSaving(false);
    if (error) { toast.error('Save failed'); return; }
    toast.success('Conversation saved to Briefs');
  };

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-lg font-semibold">AI Assistant</h1>
        <p className="text-xs text-muted-foreground">Claude-powered marketing assistant for All American Roof Pros</p>
      </div>

      <div className="flex flex-col h-[calc(100vh-11rem)] bg-card rounded-lg border border-border">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <Bot size={36} className="text-primary/30 mx-auto mb-3" />
                <p className="text-sm font-medium">Marketing AI Assistant</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Ask me anything about marketing, sales scripts, ad copy, or strategy</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left px-3 py-2 text-xs rounded border border-border hover:border-primary/30 hover:bg-secondary/50 transition-colors text-muted-foreground"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
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
        <div className="border-t border-border p-3 space-y-1.5">
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
                  onClick={saveConversation}
                  disabled={saving}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Save conversation
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Ask about marketing, sales, ad copy, strategy…"
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
    </div>
  );
}
