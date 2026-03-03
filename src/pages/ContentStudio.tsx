import { useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Copy, Save, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-chat`;

const LOCATIONS = ['Mansfield', 'Sandusky', 'Huron', 'All Areas'];
const TONES = ['Professional', 'Friendly', 'Urgent', 'Educational', 'Conversational'];

interface TabConfig {
  value: string;
  label: string;
  systemContext: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const CONTENT_TABS: TabConfig[] = [
  {
    value: 'blog',
    label: 'Blog Post',
    systemContext: 'Write a complete, SEO-optimized blog post for a roofing company. Include an engaging title, introduction, H2/H3 subheadings, and a call-to-action. Write 800-1200 words. Use natural keyword placement.',
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. Signs you need a roof replacement', required: true },
      { name: 'location', label: 'Location', type: 'select', options: LOCATIONS, required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'roof repair, storm damage, shingle replacement' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES },
      { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any specific points to cover...' },
    ],
  },
  {
    value: 'service',
    label: 'Service Page',
    systemContext: 'Write persuasive, SEO-optimized service page copy for a roofing company. Include a compelling headline, benefits, process steps, FAQ section, and strong CTA. Focus on local relevance and trust signals.',
    fields: [
      { name: 'service', label: 'Service', type: 'text', placeholder: 'e.g. Storm Damage Roof Repair', required: true },
      { name: 'location', label: 'Location', type: 'select', options: LOCATIONS, required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'storm damage repair, emergency roofing' },
      { name: 'usp', label: 'Unique Selling Points', type: 'textarea', placeholder: 'What makes your service stand out...' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES },
    ],
  },
  {
    value: 'gbp',
    label: 'Google Business Post',
    systemContext: 'Write a Google Business Profile post for a roofing company. Keep it under 300 words. Include a hook, value proposition, and clear CTA with a sense of urgency. Use emojis sparingly. Make it scannable.',
    fields: [
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g. Spring roof inspection special', required: true },
      { name: 'location', label: 'Location', type: 'select', options: LOCATIONS, required: true },
      { name: 'offer', label: 'Offer / CTA', type: 'text', placeholder: 'e.g. Free inspection, 10% off' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES },
    ],
  },
  {
    value: 'social',
    label: 'Social Caption',
    systemContext: 'Write social media captions for a roofing company. Provide versions for Facebook, Instagram, and LinkedIn. Include relevant hashtags. Keep each platform-appropriate in length and style. Make them engaging and shareable.',
    fields: [
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g. Before/after roof transformation', required: true },
      { name: 'location', label: 'Location', type: 'select', options: LOCATIONS },
      { name: 'platform', label: 'Platform Focus', type: 'select', options: ['All Platforms', 'Facebook', 'Instagram', 'LinkedIn'] },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES },
      { name: 'notes', label: 'Context', type: 'textarea', placeholder: 'Describe the photo/video or situation...' },
    ],
  },
];

async function generateContent(
  tabConfig: TabConfig,
  formData: Record<string, string>,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const fieldSummary = tabConfig.fields
    .filter(f => formData[f.name]?.trim())
    .map(f => `${f.label}: ${formData[f.name]}`)
    .join('\n');

  const userPrompt = `Generate content with these details:\n${fieldSummary}`;

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: `${tabConfig.systemContext}\n\n${userPrompt}` },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    let msg = 'Generation failed';
    try { msg = JSON.parse(body).error || msg; } catch {}
    toast.error(msg);
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

function ContentGenerator({ tab }: { tab: TabConfig }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const updateField = (name: string, value: string) => setForm(f => ({ ...f, [name]: value }));

  const generate = async () => {
    const missing = tab.fields.filter(f => f.required && !form[f.name]?.trim());
    if (missing.length) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setOutput('');
    setLoading(true);
    let full = '';
    try {
      await generateContent(tab, form, chunk => {
        full += chunk;
        setOutput(full);
      }, () => setLoading(false));
    } catch {
      setLoading(false);
      if (!full) setOutput('Error generating content. Please try again.');
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const saveAsBrief = async () => {
    if (!output) return;
    setSaving(true);
    const title = `${tab.label}: ${form[tab.fields[0].name] || 'Untitled'}`;
    const messages = [
      { role: 'user', content: tab.fields.filter(f => form[f.name]?.trim()).map(f => `**${f.label}:** ${form[f.name]}`).join('\n') },
      { role: 'assistant', content: output },
    ];
    const { error } = await supabase.from('seo_briefs').insert({
      title,
      category: tab.value,
      messages: JSON.parse(JSON.stringify(messages)),
    });
    setSaving(false);
    if (error) { toast.error('Save failed'); return; }
    toast.success('Saved to SEO Briefs');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
      {/* Form */}
      <div className="space-y-3">
        {tab.fields.map(field => (
          <div key={field.name} className="grid gap-1.5">
            <Label className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.type === 'text' && (
              <Input
                value={form[field.name] || ''}
                onChange={e => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="text-sm"
              />
            )}
            {field.type === 'textarea' && (
              <Textarea
                value={form[field.name] || ''}
                onChange={e => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="text-sm resize-none"
              />
            )}
            {field.type === 'select' && (
              <Select value={form[field.name] || ''} onValueChange={v => updateField(field.name, v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
        <Button onClick={generate} disabled={loading} className="w-full gap-2 mt-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? 'Generating…' : 'Generate with Claude'}
        </Button>
      </div>

      {/* Output */}
      <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Generated Content</span>
          {output && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyOutput}>
                <Copy size={11} /> Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={saveAsBrief} disabled={saving}>
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 p-4" ref={outputRef}>
          {!output && !loading && (
            <p className="text-xs text-muted-foreground text-center py-12">
              Fill in the form and click Generate to create content
            </p>
          )}
          {(output || loading) && (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{output}</ReactMarkdown>
              {loading && !output && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Generating…
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState('blog');

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-lg font-semibold">Content Studio</h1>
        <p className="text-xs text-muted-foreground">AI-powered content generation for All American Roof Pros</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          {CONTENT_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CONTENT_TABS.map(t => (
          <TabsContent key={t.value} value={t.value}>
            <ContentGenerator tab={t} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
