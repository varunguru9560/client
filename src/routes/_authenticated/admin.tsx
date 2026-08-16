import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut, RefreshCw, Sheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { syncLeadsToSheet } from "@/lib/leads.functions";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { LeadsPanel } from "@/components/admin/LeadsPanel";
import { ServicesPanel } from "@/components/admin/ServicesPanel";
import { TestimonialsPanel } from "@/components/admin/TestimonialsPanel";
import { FaqsPanel } from "@/components/admin/FaqsPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ClientDocumentsPanel } from "@/components/admin/ClientDocumentsPanel";
import { GoogleWorkspacePanel } from "@/components/admin/GoogleWorkspacePanel";

const title = "Admin Panel | The Tax Maestro";
const description =
  "Manage services, reviews, FAQs, client documents, business details and client enquiries.";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
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

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const syncSheet = useServerFn(syncLeadsToSheet);

  const onSync = async () => {
    setSyncing(true);
    try {
      const res = await syncSheet({});
      if (res.ok) {
        toast.success(`Exported ${res.count} enquiries to the Google Sheet`);
      } else {
        toast.error("Google Sheet export failed", { description: res.error });
      }
    } catch {
      toast.error("Google Sheet export failed");
    }
    setSyncing(false);
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await firebaseSignOut(auth);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">The Tax Maestro — Admin</h1>
            <p className="text-sm text-muted-foreground">Content, Client Vault & Enquiries</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
              <RefreshCw className={syncing ? "size-4 animate-spin" : "size-4"} /> Export to Sheet
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://docs.google.com/spreadsheets/d/1ba-FoB8m_je1-N2G0Mj8qg275AhaWbvNeBO8U-BROXU/edit"
                target="_blank"
                rel="noreferrer"
              >
                <Sheet className="size-4" /> Google Sheet
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ExternalLink className="size-4" /> View site
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="documents">
          <TabsList className="flex-wrap">
            <TabsTrigger value="workspace">Google Drive & Sheets</TabsTrigger>
            <TabsTrigger value="documents">Client Documents & Links</TabsTrigger>
            <TabsTrigger value="leads">Enquiries</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="testimonials">Reviews</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="settings">Business info</TabsTrigger>
          </TabsList>
          <TabsContent value="workspace" className="mt-6">
            <GoogleWorkspacePanel />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <ClientDocumentsPanel />
          </TabsContent>
          <TabsContent value="leads" className="mt-6">
            <LeadsPanel />
          </TabsContent>
          <TabsContent value="services" className="mt-6">
            <ServicesPanel />
          </TabsContent>
          <TabsContent value="testimonials" className="mt-6">
            <TestimonialsPanel />
          </TabsContent>
          <TabsContent value="faqs" className="mt-6">
            <FaqsPanel />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
