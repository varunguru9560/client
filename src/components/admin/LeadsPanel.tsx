import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses = ["new", "contacted", "converted", "closed"] as const;

export function LeadsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leads"] }),
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enquiry deleted");
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading enquiries…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No enquiries yet.</p>;

  return (
    <div className="space-y-4">
      {data.map((lead) => (
        <article key={lead.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{lead.name}</h3>
              <p className="text-sm text-muted-foreground">
                <a href={`tel:${lead.phone}`} className="hover:text-brand">
                  {lead.phone}
                </a>
                {lead.email ? ` · ${lead.email}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{new Date(lead.created_at).toLocaleString()}</Badge>
              <Select
                value={lead.status}
                onValueChange={(status) => update.mutate({ id: lead.id, status })}
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
          {lead.service && <p className="mt-3 text-sm font-medium">Service: {lead.service}</p>}
          {lead.message && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{lead.message}</p>
          )}
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => remove.mutate(lead.id)}>
              Delete
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
