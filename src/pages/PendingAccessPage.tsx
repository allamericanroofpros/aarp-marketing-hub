import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function PendingAccessPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card border border-border rounded-lg p-6 max-w-sm text-center space-y-4">
        <ShieldAlert size={32} className="mx-auto text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Pending Access</h2>
        <p className="text-xs text-muted-foreground">
          Your account ({user?.email}) has been created but has not been assigned a role yet.
          Contact an admin to get access.
        </p>
        <Button variant="outline" size="sm" onClick={signOut} className="text-xs">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
