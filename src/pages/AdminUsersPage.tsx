import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserRow {
  id: string;
  email: string;
  role: 'admin' | 'team' | null;
  display_name: string | null;
  created_at: string;
  confirmed: boolean;
  last_sign_in: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'team'>('team');
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  const callAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('admin-users', { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ action: 'list' });
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await callAdmin({ action: 'invite', email: inviteEmail, role: inviteRole });
      toast({ title: 'Invited', description: `Invite sent to ${inviteEmail}` });
      setInviteEmail('');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setInviting(false);
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'team') => {
    try {
      await callAdmin({ action: 'setRole', targetUserId: userId, role });
      toast({ title: 'Updated', description: `Role changed to ${role}` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">User Management</h2>
        <p className="text-xs text-muted-foreground">Invite users and manage roles.</p>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex items-end gap-2 max-w-lg">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            placeholder="user@company.com"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <Select value={inviteRole} onValueChange={v => setInviteRole(v as 'admin' | 'team')}>
            <SelectTrigger className="mt-1 w-24 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">team</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm" disabled={inviting} className="text-xs">
          {inviting ? 'Sending…' : 'Invite'}
        </Button>
      </form>

      {/* Users table */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground">No users found.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    {u.role ? (
                      <Select value={u.role} onValueChange={v => handleSetRole(u.id, v as 'admin' | 'team')}>
                        <SelectTrigger className="h-7 w-24 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="team">team</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    {u.confirmed ? (
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground text-[10px]">
                    {u.last_sign_in ? `Last login: ${new Date(u.last_sign_in).toLocaleDateString()}` : 'Never signed in'}
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
