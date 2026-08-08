import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Form = {
  name: string;
  person: string;
  role: string;
  tagline: string;
  gstin: string;
  mobile: string;
  landline: string;
  address: string;
  hoursText: string;
};

export function SettingsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const hours = Array.isArray(data.hours) ? (data.hours as string[]) : [];
    setForm({
      name: data.name,
      person: data.person,
      role: data.role,
      tagline: data.tagline,
      gstin: data.gstin,
      mobile: data.mobile,
      landline: data.landline,
      address: data.address,
      hoursText: hours.join("\n"),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (!data) throw new Error("Settings row missing");
      const { hoursText, ...rest } = values;
      const { error } = await supabase
        .from("site_settings")
        .update({
          ...rest,
          hours: hoursText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Business details saved");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  if (isLoading || !form)
    return <p className="text-sm text-muted-foreground">Loading business details…</p>;

  const set = (v: Partial<Form>) => setForm({ ...form, ...v });

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Person</Label>
          <Input value={form.person} onChange={(e) => set({ person: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input value={form.role} onChange={(e) => set({ role: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input value={form.gstin} onChange={(e) => set({ gstin: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Landline</Label>
          <Input value={form.landline} onChange={(e) => set({ landline: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea
          rows={3}
          value={form.address}
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Business hours (one per line)</Label>
        <Textarea
          rows={3}
          value={form.hoursText}
          onChange={(e) => set({ hoursText: e.target.value })}
        />
      </div>
      <Button variant="cta" onClick={() => save.mutate(form)} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save business details"}
      </Button>
    </div>
  );
}
