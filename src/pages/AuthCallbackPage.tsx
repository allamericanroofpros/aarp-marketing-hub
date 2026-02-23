import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for error in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error_description') || hashParams.get('error');
    if (hashError) {
      setError(hashError);
      return;
    }

    // Listen for auth state change — Supabase client auto-detects tokens in hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      }
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      }
    });

    // Fallback: if session already exists, redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Authentication Error</h2>
          <p className="text-xs text-destructive">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="text-xs text-primary underline">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-sm text-muted-foreground">Authenticating…</p>
    </div>
  );
}
