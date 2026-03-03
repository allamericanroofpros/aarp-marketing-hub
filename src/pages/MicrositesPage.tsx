import { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Microsite {
  id: string;
  name: string;
  location: string;
  service: string;
  url: string;
  status: string;
  leads: number;
}

const LOCATIONS = ['Mansfield', 'Sandusky', 'Huron'];
const SERVICES = ['Roof Repair', 'New Roof', 'Storm Damage', 'Gutters', 'Siding', 'Other'];
const STATUSES = ['live', 'draft', 'paused'] as const;

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  live: 'default',
  draft: 'secondary',
  paused: 'outline',
};

const nextStatus: Record<string, string> = {
  live: 'draft',
  draft: 'paused',
  paused: 'live',
};

const emptyForm = { name: '', location: '', service: '', url: '', status: 'draft' };

export default function MicrositesPage() {
  const [sites, setSites] = useState<Microsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadValue, setLeadValue] = useState('');
  const leadInputRef = useRef<HTMLInputElement>(null);

  const fetchSites = async () => {
    const { data, error } = await supabase
      .from('microsites')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load microsites');
      return;
    }
    setSites((data as Microsite[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSites(); }, []);

  useEffect(() => {
    if (editingLeadId && leadInputRef.current) leadInputRef.current.focus();
  }, [editingLeadId]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (s: Microsite) => {
    setEditingId(s.id);
    setForm({ name: s.name, location: s.location, service: s.service, url: s.url || '', status: s.status });
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.name || !form.location || !form.service) {
      toast.error('Name, location, and service are required');
      return;
    }
    if (editingId) {
      const { error } = await supabase.from('microsites').update(form).eq('id', editingId);
      if (error) { toast.error('Update failed'); return; }
      toast.success('Microsite updated');
    } else {
      const { error } = await supabase.from('microsites').insert(form);
      if (error) { toast.error('Create failed'); return; }
      toast.success('Microsite created');
    }
    setFormOpen(false);
    fetchSites();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('microsites').delete().eq('id', deleteId);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Microsite deleted');
    setDeleteId(null);
    fetchSites();
  };

  const cycleStatus = async (s: Microsite) => {
    const newStatus = nextStatus[s.status] || 'draft';
    const { error } = await supabase.from('microsites').update({ status: newStatus }).eq('id', s.id);
    if (error) { toast.error('Status update failed'); return; }
    setSites(prev => prev.map(x => x.id === s.id ? { ...x, status: newStatus } : x));
  };

  const saveLead = async (id: string) => {
    const val = parseInt(leadValue, 10);
    if (isNaN(val) || val < 0) { setEditingLeadId(null); return; }
    const { error } = await supabase.from('microsites').update({ leads: val }).eq('id', id);
    if (error) { toast.error('Lead update failed'); return; }
    setSites(prev => prev.map(x => x.id === id ? { ...x, leads: val } : x));
    setEditingLeadId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Microsites</h1>
        <Button size="sm" onClick={openAdd} className="gap-1">
          <Plus size={14} /> Add Microsite
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
          ) : sites.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No microsites yet</TableCell></TableRow>
          ) : sites.map(s => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.location}</TableCell>
              <TableCell>{s.service}</TableCell>
              <TableCell>
                <Badge
                  variant={statusVariant[s.status] || 'secondary'}
                  className="cursor-pointer select-none"
                  onClick={() => cycleStatus(s)}
                >
                  {s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {editingLeadId === s.id ? (
                  <Input
                    ref={leadInputRef}
                    type="number"
                    min={0}
                    className="w-20 ml-auto text-right h-7 text-sm"
                    value={leadValue}
                    onChange={e => setLeadValue(e.target.value)}
                    onBlur={() => saveLead(s.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveLead(s.id); if (e.key === 'Escape') setEditingLeadId(null); }}
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => { setEditingLeadId(s.id); setLeadValue(String(s.leads)); }}
                  >
                    {s.leads}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => openEdit(s)}>
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive" onClick={() => setDeleteId(s.id)}>
                    <Trash2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <FileText size={12} /> SEO Brief
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Microsite' : 'Add Microsite'}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mansfield Roof Repair" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Service</Label>
                <Select value={form.service} onValueChange={v => setForm(f => ({ ...f, service: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>URL</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
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
            <AlertDialogTitle>Delete microsite?</AlertDialogTitle>
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
