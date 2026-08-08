import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStoredLeads,
  fetchSupabaseLeads,
  updateStoredLeadStatus,
  deleteStoredLead,
  LeadItem,
} from "@/lib/leads.store";

const statuses = ["new", "contacted", "converted", "closed"] as const;

export function LeadsPanel() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = () => {
    setLeads(getStoredLeads());
  };

  const handleRefreshSupabase = async () => {
    setLoading(true);
    try {
      const updated = await fetchSupabaseLeads();
      setLeads(updated);
      toast.success("Enquiries synced with Supabase");
    } catch {
      toast.error("Could not sync with Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    fetchSupabaseLeads().then((updated) => {
      setLeads(updated);
    });
    const handleLeadsChanged = () => reload();
    window.addEventListener("leads-changed", handleLeadsChanged);
    return () => window.removeEventListener("leads-changed", handleLeadsChanged);
  }, []);

  const handleUpdateStatus = (id: string, status: LeadItem["status"]) => {
    updateStoredLeadStatus(id, status);
    toast.success(`Enquiry status updated to ${status}`);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteStoredLead(id);
    toast.success("Enquiry deleted");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-brand" />
          <div>
            <h3 className="font-semibold text-sm">Consultation Enquiries & Bookings</h3>
            <p className="text-xs text-muted-foreground">
              Total Enquiries: {leads.length} · Live synced with Supabase
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshSupabase}
          disabled={loading}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Supabase
        </Button>
      </div>

      {!leads.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No enquiries submitted yet.
        </div>
      ) : (
        leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{lead.name}</h3>
                <p className="text-sm text-muted-foreground">
                  <a href={`tel:${lead.phone}`} className="hover:text-brand font-medium">
                    +91 {lead.phone}
                  </a>
                  {lead.email ? ` · ${lead.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{new Date(lead.created_at).toLocaleString()}</Badge>
                <Select
                  value={lead.status}
                  onValueChange={(status) =>
                    handleUpdateStatus(lead.id, status as LeadItem["status"])
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {lead.service && (
              <p className="mt-3 text-sm font-medium text-foreground">Service: {lead.service}</p>
            )}
            {lead.message && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {lead.message}
              </p>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(lead.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                Delete Enquiry
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
