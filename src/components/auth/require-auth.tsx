import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { AppRole } from "@/lib/types";
import type { ReactNode } from "react";

export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role?: AppRole;
}) {
  const { loading, isAuthenticated, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <div className="glass rounded-3xl p-10 shadow-elegant">
          <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access this page.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl gradient-bg px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (role && !hasRole(role)) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <div className="glass rounded-3xl p-10 shadow-elegant">
          <h2 className="text-2xl font-bold mb-2">Access denied</h2>
          <p className="text-muted-foreground">
            You need the <span className="font-semibold">{role}</span> role to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
