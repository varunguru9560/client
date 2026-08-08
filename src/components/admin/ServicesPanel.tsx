import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iconOptions } from "@/lib/site-content";

type Row = {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  items: string[];
  sort_order: number;
  is_active: boolean;
};

export function ServicesPanel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Row> & { itemsText?: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "service_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_groups").select("*").order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "service_groups"] });
    setDraft({});
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const patch = draft[row.id] ?? {};
      const items =
        patch.itemsText !== undefined
          ? patch.itemsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : row.items;
      const { error } = await supabase
        .from("service_groups")
        .update({
          title: patch.title ?? row.title,
          icon: patch.icon ?? row.icon,
          blurb: patch.blurb ?? row.blurb,
          sort_order: patch.sort_order ?? row.sort_order,
          is_active: patch.is_active ?? row.is_active,
          items,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service group saved");
      invalidate();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_groups").insert({
        title: "New service group",
        icon: "Sparkles",
        blurb: "",
        items: [],
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading services…</p>;

  return (
    <div className="space-y-5">
      <Button variant="cta" onClick={() => add.mutate()}>
        Add service group
      </Button>

      {data?.map((row) => {
        const patch = draft[row.id] ?? {};
        const set = (v: Partial<Row> & { itemsText?: string }) =>
          setDraft((d) => ({ ...d, [row.id]: { ...d[row.id], ...v } }));
        return (
          <article key={row.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={patch.title ?? row.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={patch.icon ?? row.icon} onValueChange={(icon) => set({ icon })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconOptions).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea
                value={patch.blurb ?? row.blurb}
                onChange={(e) => set({ blurb: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Services (one per line)</Label>
              <Textarea
                rows={6}
                value={patch.itemsText ?? row.items.join("\n")}
                onChange={(e) => set({ itemsText: e.target.value })}
              />
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
