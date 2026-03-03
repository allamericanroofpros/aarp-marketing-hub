import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

const tabs = [
  { value: 'keywords', label: 'Keyword Research' },
  { value: 'briefs', label: 'Content Brief' },
  { value: 'onpage', label: 'On-Page Analysis' },
  { value: 'competitor', label: 'Competitor Analysis' },
  { value: 'backlinks', label: 'Backlink Strategy' },
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

function ChatPanel({ tabValue }: { tabValue: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Welcome to ${tabs.find(t => t.value === tabValue)?.label}. Ask me anything to get started.` },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', text: 'This feature is coming soon. Integration pending.' }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 p-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="flex gap-2 pt-3 border-t border-border mt-2">
        <Input
          placeholder="Type your question…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1"
        />
        <Button size="icon" onClick={send}><Send size={16} /></Button>
      </div>
    </div>
  );
}

export default function SeoHubPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-3">SEO Hub</h1>
      <Tabs defaultValue="keywords">
        <TabsList className="mb-2">
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value}>
            <ChatPanel tabValue={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
