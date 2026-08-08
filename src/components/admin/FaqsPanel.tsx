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
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export function FaqsPanel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Row>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
    setDraft({});
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const patch = draft[row.id] ?? {};
      const { error } = await supabase
        .from("faqs")
        .update({
          question: patch.question ?? row.question,
          answer: patch.answer ?? row.answer,
          sort_order: patch.sort_order ?? row.sort_order,
          is_active: patch.is_active ?? row.is_active,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("FAQ saved");
      done();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("faqs").insert({
        question: "New question",
        answer: "Answer",
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      done();
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading FAQs…</p>;

  return (
    <div className="space-y-5">
      <Button variant="cta" onClick={() => add.mutate()}>
        Add FAQ
      </Button>
      {data?.map((row) => {
        const patch = draft[row.id] ?? {};
        const set = (v: Partial<Row>) =>
          setDraft((d) => ({ ...d, [row.id]: { ...d[row.id], ...v } }));
        return (
          <article key={row.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={patch.question ?? row.question}
                onChange={(e) => set({ question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                rows={4}
                value={patch.answer ?? row.answer}
                onChange={(e) => set({ answer: e.target.value })}
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
