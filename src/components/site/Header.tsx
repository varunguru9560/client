import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Phone, X, LogIn, UserPlus, FolderCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/site";
import { useSiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/site/AuthModal";
import { getStoredClientUser, setStoredClientUser, ClientUser } from "@/lib/client-vault";

export function Header() {
  const { business, serviceGroups } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const update = () => setClientUser(getStoredClientUser());
    update();
    window.addEventListener("client-auth-changed", update);
    return () => window.removeEventListener("client-auth-changed", update);
  }, []);

  const openSignIn = () => {
    setAuthMode("signin");
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  const scrollToVault = () => {
    const plate = document.getElementById("client-vault-plate");
    if (plate) {
      plate.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    setStoredClientUser(null);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "bg-card/95 shadow-[var(--shadow-card)] backdrop-blur" : "bg-transparent",
        )}
      >
        <div className="section-shell flex h-20 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
              TM
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold tracking-tight">
                The Tax Maestro
              </span>
              <span className="block text-[0.7rem] font-medium tracking-widest text-muted-foreground uppercase">
                {business.role}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "bg-brand-soft text-brand" }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-brand-soft hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${business.mobile}`}
              className="hidden items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand xl:inline-flex"
            >
              <Phone className="size-4 text-brand" />
              {business.mobile}
            </a>

            {clientUser?.isLoggedIn ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="brandSoft"
                  size="sm"
                  onClick={scrollToVault}
                  className="gap-1.5 rounded-full font-semibold"
                >
                  <FolderCheck className="size-4 text-brand" />
                  <span className="max-w-[100px] truncate sm:max-w-none">
                    {clientUser.email || clientUser.name || clientUser.phone}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sign out"
                  className="size-9 rounded-full text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openSignIn}
                  className="gap-1 rounded-full px-3 text-xs font-semibold text-foreground/90 hover:bg-brand-soft hover:text-brand sm:text-sm"
                >
                  <LogIn className="size-3.5" /> Log In
                </Button>
                <Button
                  variant="brandOutline"
                  size="sm"
                  onClick={openSignUp}
                  className="gap-1 rounded-full px-3.5 text-xs font-semibold sm:text-sm"
                >
                  <UserPlus className="size-3.5" /> Sign Up
                </Button>
              </div>
            )}

            <Button variant="cta" size="pill" asChild className="hidden sm:inline-flex">
              <Link to="/contact">Book Consultation</Link>
            </Button>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-full border border-border bg-card lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-card lg:hidden">
            <div className="section-shell space-y-6 py-6">
              <nav className="grid gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-medium hover:bg-brand-soft hover:text-brand"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="rounded-2xl border border-brand/20 bg-brand-soft/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Client Portal
                </p>
                {clientUser?.isLoggedIn ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium">
                      Logged in as: {clientUser.email || clientUser.name || clientUser.phone}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => {
                          setOpen(false);
                          scrollToVault();
                        }}
                      >
                        Go to My Documents
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleLogout}>
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        openSignIn();
                      }}
                      className="w-full gap-2"
                    >
                      <LogIn className="size-4" /> Client Log In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        openSignUp();
                      }}
                      className="w-full gap-2"
                    >
                      <UserPlus className="size-4" /> Create Account / Sign Up
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="eyebrow">All services</p>
                {serviceGroups.map((group) => (
                  <details key={group.id} className="rounded-xl border border-border px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {group.title}
                    </summary>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>

              <div className="grid gap-2">
                <Button variant="cta" size="pill" asChild>
                  <Link to="/contact" onClick={() => setOpen(false)}>
                    Book a Consultation
                  </Link>
                </Button>
                <Button variant="brandOutline" size="pill" asChild>
                  <a href={`tel:${business.mobile}`}>Call {business.mobile}</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultMode={authMode} />
    </>
  );
}
