import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if admin already exists
    supabase.functions.invoke('bootstrap-admin', { method: 'GET' })
      .then(({ data, error: err }) => {
        if (err) {
          setError('Failed to check setup status.');
          setChecking(false);
          return;
        }
        if (data?.adminExists) {
          navigate('/login', { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: fnError } = await supabase.functions.invoke('bootstrap-admin', {
      body: { email, password },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Setup failed.');
      setLoading(false);
      return;
    }

    setMessage('Admin created! Redirecting to login…');
    setTimeout(() => navigate('/login', { replace: true }), 1500);
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-sm text-muted-foreground">Checking setup status…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-xs font-bold tracking-widest text-primary">AARP MARKETING OS</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Initial Setup</p>
        </div>
        <h2 className="text-sm font-semibold text-foreground">Create First Admin</h2>
        <p className="text-xs text-muted-foreground">No admin exists yet. Create the first admin account to get started.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-primary">{message}</p>}
          <Button type="submit" className="w-full text-xs" disabled={loading}>
            {loading ? 'Creating…' : 'Create Admin Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
