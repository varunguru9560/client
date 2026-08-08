import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type Row = {
  id: string;
  quote: string;
  author: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
};

export function TestimonialsPanel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Row>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
    setDraft({});
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const patch = draft[row.id] ?? {};
      const { error } = await supabase
        .from("testimonials")
        .update({
          quote: patch.quote ?? row.quote,
          author: patch.author ?? row.author,
          rating: patch.rating ?? row.rating,
          sort_order: patch.sort_order ?? row.sort_order,
          is_active: patch.is_active ?? row.is_active,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review saved");
      done();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").insert({
        quote: "New client review",
        author: "Client name",
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      done();
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;

  return (
    <div className="space-y-5">
      <Button variant="cta" onClick={() => add.mutate()}>
        Add review
      </Button>
      {data?.map((row) => {
        const patch = draft[row.id] ?? {};
        const set = (v: Partial<Row>) =>
          setDraft((d) => ({ ...d, [row.id]: { ...d[row.id], ...v } }));
        return (
          <article key={row.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Review</Label>
              <Textarea
                rows={4}
                value={patch.quote ?? row.quote}
                onChange={(e) => set({ quote: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Author</Label>
                <Input
                  value={patch.author ?? row.author}
                  onChange={(e) => set({ author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stars (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={patch.rating ?? row.rating}
                  onChange={(e) =>
                    set({ rating: Math.min(5, Math.max(1, Number(e.target.value))) })
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Order</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={patch.sort_order ?? row.sort_order}
                  onChange={(e) => set({ sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={patch.is_active ?? row.is_active}
                  onCheckedChange={(is_active) => set({ is_active })}
                />
                <Label className="text-sm">Visible on site</Label>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => remove.mutate(row.id)}>
                  Delete
                </Button>
                <Button variant="brand" size="sm" onClick={() => save.mutate(row)}>
                  Save
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
