import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldAlert, KeyRound, UserCheck, RefreshCw } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  getAuthorizedAdminEmails,
  saveAuthorizedAdminEmails,
  isAllowedAdminEmail,
  claimAdminSlot,
  resetAllAdminSessions,
} from "@/lib/admin-auth";

const title = "Admin Sign In | The Tax Maestro";
const description = "Restricted sign in for the 2 authorized Tax Maestro administrators.";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { unauthorized?: string };
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Admin credentials reset modal / tab state
  const [showResetForm, setShowResetForm] = useState(false);
  const [allowedAdmin1, setAllowedAdmin1] = useState("");
  const [allowedAdmin2, setAllowedAdmin2] = useState("");
  const [authorizedList, setAuthorizedList] = useState<string[]>([]);

  useEffect(() => {
    const list = getAuthorizedAdminEmails();
    setAuthorizedList(list);
    setAllowedAdmin1(list[0] || "");
    setAllowedAdmin2(list[1] || "");

    if (searchParams.unauthorized === "true") {
      toast.error("Access Denied", {
        description: "Only the 2 authorized admin users are permitted to access the admin panel.",
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isAllowedAdminEmail(user.email)) {
        navigate({ to: "/admin", replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams.unauthorized]);

  const handleGoogleAuth = async () => {
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        if (!isAllowedAdminEmail(result.user.email)) {
          await auth.signOut();
          toast.error("Access Restricted", {
            description: `"${result.user.email}" is not listed as one of the 2 authorized admin accounts.`,
          });
          setBusy(false);
          return;
        }
        claimAdminSlot(result.user.email || "");
        toast.success("Welcome back, Admin!");
        navigate({ to: "/admin", replace: true });
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Google sign in notice", { description: error?.message || String(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAllowedAdmins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowedAdmin1 && !allowedAdmin2) {
      toast.error("Please provide at least 1 authorized admin email address");
      return;
    }

    setBusy(true);
    // Reset existing sessions
    await resetAllAdminSessions();

    const updated = saveAuthorizedAdminEmails([allowedAdmin1, allowedAdmin2]);
    setAuthorizedList(updated);
    setBusy(false);
    setShowResetForm(false);

    toast.success("Admin access credentials reset successfully", {
      description: `Restricted to 2 users: ${updated.join(", ")}`,
    });
  };

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check authorization
    if (!isAllowedAdminEmail(normalizedEmail)) {
      toast.error("Access Restricted", {
        description: `"${normalizedEmail}" is not listed as one of the 2 authorized admin accounts.`,
      });
      return;
    }

    setBusy(true);

    try {
      if (mode === "signin") {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        claimAdminSlot(userCredential.user.email || normalizedEmail);
        toast.success("Welcome back, Admin!");
        navigate({ to: "/admin", replace: true });
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        );
        claimAdminSlot(userCredential.user.email || normalizedEmail);
        toast.success("Admin account created successfully");
        navigate({ to: "/admin", replace: true });
      }
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error?.message || String(err);
      toast.error(mode === "signin" ? "Sign in failed" : "Sign up failed", {
        description: msg.includes("auth/invalid-credential")
          ? "Invalid email or password"
          : msg.includes("auth/email-already-in-use")
            ? "Email is already registered. Please sign in instead."
            : msg,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/50 px-4 py-8">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-card p-8 shadow-[var(--shadow-card)] space-y-6">
        <div>
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft">
            <Lock className="size-5 text-brand" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">
            {mode === "signin" ? "Admin Sign In" : "Create Admin Account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access strictly restricted to 2 authorized Tax Maestro administrators.
          </p>
        </div>

        {/* Authorized Admin Status Banner */}
        <div className="rounded-xl border border-brand/20 bg-brand-soft/40 p-3.5 text-xs text-brand-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-brand">
            <UserCheck className="size-4" /> Allowed Admin Accounts (Max 2)
          </div>
          <div className="flex flex-col gap-1 text-muted-foreground">
            {authorizedList.map((usr, idx) => (
              <span
                key={idx}
                className="font-mono text-[11px] bg-background/80 px-2 py-0.5 rounded border border-border/50"
              >
                User {idx + 1}: {usr}
              </span>
            ))}
          </div>
        </div>

        {/* Option to Reset Admin Credentials / Authorized List */}
        {!showResetForm ? (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Need to reset admin logins?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowResetForm(true)}
              className="text-xs h-8 text-brand hover:text-brand"
            >
              <KeyRound className="mr-1 size-3.5" /> Reset Admin Logins
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSaveAllowedAdmins}
            className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 dark:border-amber-900/50 dark:bg-amber-950/20"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="size-4 text-amber-600" />
              Reset & Set 2 Authorized Admin Emails
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              This will log out all existing sessions and assign administrative access exclusively
              to the 2 specified emails below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin1" className="text-xs">
                Admin Email 1
              </Label>
              <Input
                id="admin1"
                type="email"
                required
                placeholder="admin1@taxmaestro.com"
                value={allowedAdmin1}
                onChange={(e) => setAllowedAdmin1(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin2" className="text-xs">
                Admin Email 2
              </Label>
              <Input
                id="admin2"
                type="email"
                placeholder="admin2@taxmaestro.com"
                value={allowedAdmin2}
                onChange={(e) => setAllowedAdmin2(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" size="sm" variant="cta" disabled={busy} className="h-8 text-xs">
                {busy ? <RefreshCw className="size-3 animate-spin mr-1" /> : null} Save & Reset
                Access
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowResetForm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            disabled={busy}
            className="w-full justify-center gap-2 border-border py-5 font-semibold hover:bg-accent"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          <div className="relative my-5 text-center text-xs text-muted-foreground uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            <div className="absolute inset-0 top-1/2 -z-10 border-t border-border" />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="Enter your authorized admin email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="cta" className="w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in to Admin Panel"
                : "Create Authorized Admin Account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-2 text-sm text-brand underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "Need an admin account? Register" : "Already registered? Sign in"}
        </button>

        <div className="border-t border-border pt-4 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-brand">
            ← Back to website
          </Link>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
