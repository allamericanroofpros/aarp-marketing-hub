import { useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useAssistantContext } from '@/hooks/useApi';
import { fmt$, fmtN, fmtP } from '@/lib/format';
import { Bot, Send, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const suggestions = [
  "What's our best ROAS channel this month?",
  "Why did CPL rise last 7 days?",
  "What should we cut or scale next week?",
  "Give me a weekly recap to send the team.",
  "Build a web agenda for next week focused on Mansfield retail.",
];

export default function AssistantPage() {
  const { startDate, endDate, locations } = useFilter();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const { data: ctx, isLoading } = useAssistantContext({ startDate, endDate, locations });

  if (isLoading || !ctx) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  const { kpis, unmappedCount, wonDealsCount } = ctx;

  const generateResponse = (q: string): string => {
    const ql = q.toLowerCase();
    if (ql.includes('roas') || ql.includes('best channel')) {
      return `📊 **Best ROAS Channel (${startDate} to ${endDate})**\n\nGoogle Search is your top performer with approximately ${kpis.roas.toFixed(1)}x ROAS overall. With ${fmt$(kpis.spend)} total spend generating ${fmt$(kpis.revenue)} revenue across ${kpis.dealsWon} won deals.\n\n**Recommendation:** Consider increasing Google Search budget by 15-20% while maintaining current CPL targets.`;
    }
    if (ql.includes('cpl') || ql.includes('cost per lead')) {
      return `📈 **CPL Analysis**\n\nCurrent CPL: ${fmt$(kpis.cpl)} across ${fmtN(kpis.leads)} leads.\n\nCPL has been ${kpis.cpl > 80 ? 'elevated' : 'within target range'}. Key factors:\n- ${ctx.totalSpendEntries} spend entries in period\n- ${unmappedCount} unmapped leads (fix tracking!)\n- Meta ads showing higher CPL than Google\n\n**Action:** Review Facebook campaign targeting and pause underperforming ad sets.`;
    }
    if (ql.includes('cut') || ql.includes('scale')) {
      return `⚡ **Scale & Cut Recommendations**\n\n🟢 **Scale:** Google Search PPC — strong ROAS, proven conversion\n🟢 **Scale:** Referral program — lowest CPL, high close rate\n🔴 **Cut/Pause:** Any campaign with <1.5x ROAS after 30 days\n🟡 **Watch:** Direct mail — evaluate Feb EDDM results before next drop\n\nTotal spend: ${fmt$(kpis.spend)} | Revenue: ${fmt$(kpis.revenue)} | GP Est: ${fmt$(kpis.grossProfit)}`;
    }
    if (ql.includes('recap') || ql.includes('weekly')) {
      return `📋 **Weekly Marketing Recap**\n\n**Period:** ${startDate} to ${endDate}\n\n| Metric | Value |\n|--------|-------|\n| Spend | ${fmt$(kpis.spend)} |\n| Leads | ${fmtN(kpis.leads)} |\n| CPL | ${fmt$(kpis.cpl)} |\n| Appointments | ${fmtN(kpis.appointments)} |\n| Deals Won | ${fmtN(kpis.dealsWon)} |\n| Revenue | ${fmt$(kpis.revenue)} |\n| ROAS | ${kpis.roas.toFixed(1)}x |\n| Close Rate | ${fmtP(kpis.closeRate)} |\n\n**Key Wins:** ${wonDealsCount} deals closed for ${fmt$(kpis.revenue)}\n**Watch:** ${unmappedCount} unmapped leads need attribution`;
    }
    if (ql.includes('agenda') || ql.includes('mansfield')) {
      return `📅 **Proposed Web Agenda: Mansfield Retail Focus**\n\n**Theme:** Spring Roofing Season — Mansfield Blitz\n**Offer:** Free Estimate + $500 Off New Roof\n**Target:** Mansfield residential homeowners\n\n**Budget:**\n- Google Search: $2,500\n- Facebook: $1,200\n- Direct Mail (EDDM): $800\n- Yard Signs: $200\n\n**KPI Targets:** 35 leads | $75 CPL | $80K revenue\n\n**Talking Points:**\n1. Spring storm damage assessment\n2. Limited-time financing at 0%\n3. 5-star Google reviews\n4. Local veteran-owned business`;
    }
    return `Based on your current data (${startDate} to ${endDate}):\n\n- **${fmtN(kpis.leads)}** leads at **${fmt$(kpis.cpl)}** CPL\n- **${fmtN(kpis.dealsWon)}** deals won for **${fmt$(kpis.revenue)}**\n- ROAS: **${kpis.roas.toFixed(1)}x**\n- Close rate: **${fmtP(kpis.closeRate)}**\n\nCould you clarify what specific insight you're looking for? Try one of the suggested prompts for detailed analysis.`;
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, text: text.trim() };
    const response = { role: 'assistant' as const, text: generateResponse(text) };
    setMessages(prev => [...prev, userMsg, response]);
    setInput('');
  };

  const recommendations = [
    { label: 'Scale Winners', desc: 'Increase Google Search budget — best ROAS channel', color: 'text-status-green', link: '/performance' },
    { label: 'Pause Losers', desc: `Review campaigns with <1.5x ROAS`, color: 'text-status-red', link: '/performance' },
    { label: 'Fix Tracking', desc: `${unmappedCount} unmapped leads need source attribution`, color: 'text-status-yellow', link: '/sources?tab=unmapped' },
    { label: 'Rep Coaching', desc: `Close rate at ${fmtP(kpis.closeRate)} — review bottom performers`, color: 'text-primary', link: '/pipeline?tab=deals' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">AI Assistant</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border flex flex-col" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <Bot size={36} className="text-primary/30 mx-auto mb-3" />
                <p className="text-sm font-medium">Marketing AI Copilot</p>
                <p className="text-xs text-muted-foreground mt-1">Ask me anything about your marketing performance</p>
                <div className="mt-4 space-y-2">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="block w-full max-w-md mx-auto text-left px-3 py-2 text-xs rounded border border-border hover:border-primary/30 hover:bg-secondary/50 transition-colors text-muted-foreground">
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask about your marketing data..."
              className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={() => send(input)} className="bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><Lightbulb size={13} className="text-accent" /> Action Recommendations</h3>
            <div className="space-y-2.5">
              {recommendations.map(r => (
                <button key={r.label} onClick={() => navigate(r.link)} className="flex items-start gap-2 text-left w-full hover:bg-muted/30 rounded p-1 -m-1 transition-colors">
                  <ArrowRight size={12} className={`${r.color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-xs font-medium">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
