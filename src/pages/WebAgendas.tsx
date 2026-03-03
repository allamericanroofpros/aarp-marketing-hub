import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarItem {
  id: string;
  title: string;
  content_type: string;
  location: string;
  scheduled_date: string;
  notes: string;
  status: string;
}

const CONTENT_TYPES = ['Blog Post', 'GBP Post', 'Social Caption', 'Service Page', 'Email', 'Video'];
const LOCATIONS = ['Mansfield', 'Sandusky', 'Huron', 'All Areas'];
const STATUSES = ['planned', 'in-progress', 'published'];

const typeColor: Record<string, string> = {
  'Blog Post': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'GBP Post': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Social Caption': 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  'Service Page': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'Email': 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  'Video': 'bg-primary/20 text-primary border-primary/30',
};

const emptyForm = { title: '', content_type: 'Blog Post', location: 'All Areas', scheduled_date: '', notes: '', status: 'planned' };

export default function WebAgendas() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('content_calendar')
      .select('*')
      .order('scheduled_date', { ascending: true });
    if (error) { toast.error('Failed to load calendar'); return; }
    setItems((data as CalendarItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Sun

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    items.forEach(item => {
      const key = item.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  const openAdd = (date?: Date) => {
    setEditingId(null);
    const d = date || new Date();
    setForm({ ...emptyForm, scheduled_date: format(d, 'yyyy-MM-dd') });
    setFormDate(d);
    setFormOpen(true);
  };

  const openEdit = (item: CalendarItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content_type: item.content_type,
      location: item.location,
      scheduled_date: item.scheduled_date,
      notes: item.notes || '',
      status: item.status,
    });
    setFormDate(parseISO(item.scheduled_date));
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload = { ...form, scheduled_date: formDate ? format(formDate, 'yyyy-MM-dd') : form.scheduled_date };

    if (editingId) {
      const { error } = await supabase.from('content_calendar').update(payload).eq('id', editingId);
      if (error) { toast.error('Update failed'); return; }
      toast.success('Item updated');
    } else {
      const { error } = await supabase.from('content_calendar').insert(payload);
      if (error) { toast.error('Create failed'); return; }
      toast.success('Item created');
    }
    setFormOpen(false);
    fetchItems();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('content_calendar').delete().eq('id', deleteId);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Item deleted');
    setDeleteId(null);
    fetchItems();
  };

  const selectedDayItems = selectedDay
    ? items.filter(i => i.scheduled_date === format(selectedDay, 'yyyy-MM-dd'))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold">Content Calendar</h1>
          <p className="text-xs text-muted-foreground">Schedule and manage content across all locations</p>
        </div>
        <Button size="sm" onClick={() => openAdd()} className="gap-1">
          <Plus size={14} /> New Item
        </Button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft size={16} />
        </Button>
        <h2 className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Calendar grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden bg-card">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1.5 border-b border-border bg-muted/30">
                  {d}
                </div>
              ))}
              {/* Empty cells for offset */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-border bg-muted/10" />
              ))}
              {/* Day cells */}
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayItems = itemsByDate[key] || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'min-h-[90px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-muted/30',
                      isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        'text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full',
                        isToday(day) && 'bg-primary text-primary-foreground',
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayItems.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); openAdd(day); }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          onClick={e => { e.stopPropagation(); openEdit(item); }}
                          className={cn(
                            'text-[9px] px-1 py-0.5 rounded truncate border cursor-pointer hover:opacity-80',
                            typeColor[item.content_type] || 'bg-secondary text-secondary-foreground border-border',
                          )}
                        >
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <p className="text-[9px] text-muted-foreground pl-1">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2">
              {CONTENT_TYPES.map(t => (
                <div key={t} className="flex items-center gap-1">
                  <div className={cn('w-2.5 h-2.5 rounded-sm border', typeColor[t] || 'bg-secondary border-border')} />
                  <span className="text-[10px] text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-3 sticky top-4">
              <h3 className="text-xs font-semibold mb-2">
                {selectedDay ? format(selectedDay, 'EEEE, MMM d') : 'Select a day'}
              </h3>
              {selectedDay && (
                <Button size="sm" variant="outline" className="w-full text-xs gap-1 mb-3" onClick={() => openAdd(selectedDay)}>
                  <Plus size={12} /> Add to this day
                </Button>
              )}
              {selectedDayItems.length === 0 && selectedDay && (
                <p className="text-[10px] text-muted-foreground text-center py-4">No content scheduled</p>
              )}
              <div className="space-y-2">
                {selectedDayItems.map(item => (
                  <div key={item.id} className="bg-secondary/50 rounded p-2.5 border border-border/50">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-medium leading-tight">{item.title}</p>
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                          <Pencil size={10} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', typeColor[item.content_type] || 'bg-secondary border-border')}>
                        {item.content_type}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.location}</span>
                      <Badge variant={item.status === 'published' ? 'default' : item.status === 'in-progress' ? 'secondary' : 'outline'} className="text-[9px] h-4">
                        {item.status}
                      </Badge>
                    </div>
                    {item.notes && <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'New Calendar Item'}</DialogTitle>
            <DialogDescription>Schedule content for your calendar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Spring Roof Inspection Blog" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Content Type</Label>
                <Select value={form.content_type} onValueChange={v => setForm(f => ({ ...f, content_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal', !formDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formDate ? format(formDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formDate} onSelect={setFormDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details…" rows={3} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={saveForm}>{editingId ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
