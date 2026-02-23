import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ProfileRow {
  id: string;
  user_id: string;
  role: 'admin' | 'team';
  display_name: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, display_name, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProfiles((data as ProfileRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const updateRole = async (profileId: string, newRole: 'admin' | 'team') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Role changed to ${newRole}` });
      fetchProfiles();
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Remove this user\'s profile? They will lose access.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchProfiles();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">User Management</h2>
      <p className="text-xs text-muted-foreground">Admin only — manage team member roles and access.</p>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : profiles.length === 0 ? (
        <p className="text-xs text-muted-foreground">No profiles found.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden max-w-2xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-2 font-medium text-muted-foreground">User ID</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Display Name</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-2 font-mono text-[10px] text-muted-foreground">{p.user_id.slice(0, 8)}…</td>
                  <td className="p-2">{p.display_name || '—'}</td>
                  <td className="p-2">
                    <Select value={p.role} onValueChange={(v) => updateRole(p.id, v as 'admin' | 'team')}>
                      <SelectTrigger className="h-7 w-24 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="team">team</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" className="text-[10px] text-destructive" onClick={() => deleteProfile(p.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
