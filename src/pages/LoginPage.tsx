import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage('Check your email for a password reset link.');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-xs font-bold tracking-widest text-primary">AARP MARKETING OS</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">All American Roof Pros</p>
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
          </div>
          {mode !== 'forgot' && (
            <div>
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-status-green">{message}</p>}
          <Button type="submit" className="w-full text-xs" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </Button>
        </form>
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="hover:text-foreground underline">
              Back to Sign In
            </button>
          )}
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="hover:text-foreground underline">
                Create Account
              </button>
              <span>·</span>
              <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="hover:text-foreground underline">
                Forgot Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
