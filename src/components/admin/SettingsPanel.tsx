import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAuthorizedAdminEmails,
  saveAuthorizedAdminEmails,
  resetAllAdminSessions,
} from "@/lib/admin-auth";

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

  // Admin users state
  const [admin1, setAdmin1] = useState("");
  const [admin2, setAdmin2] = useState("");

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
    const admins = getAuthorizedAdminEmails();
    setAdmin1(admins[0] || "");
    setAdmin2(admins[1] || "");

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

  const saveAdminUsers = () => {
    if (!admin1 && !admin2) {
      toast.error("At least 1 admin user email is required");
      return;
    }
    const updated = saveAuthorizedAdminEmails([admin1, admin2]);
    toast.success("Authorized admin users updated", {
      description: `Access restricted to 2 accounts: ${updated.join(", ")}`,
    });
  };

  const handleResetSessions = async () => {
    await resetAllAdminSessions();
    toast.info("All admin sessions reset. Redirecting to login…");
    window.location.href = "/auth";
  };

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
    <div className="space-y-6">
      {/* Authorized Admin Users Restriction Panel */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-brand" />
            <div>
              <h3 className="font-semibold text-sm">Authorized Admin Access (Max 2 Users)</h3>
              <p className="text-xs text-muted-foreground">
                Only the 2 designated accounts below are granted login permissions for this portal.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSessions}
            className="text-xs text-destructive hover:bg-destructive/10"
          >
            Reset All Sessions
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5 font-medium">
              <UserCheck className="size-3.5 text-brand" /> Admin User 1 Email
            </Label>
            <Input
              type="email"
              value={admin1}
              onChange={(e) => setAdmin1(e.target.value)}
              placeholder="admin1@taxmaestro.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5 font-medium">
              <UserCheck className="size-3.5 text-brand" /> Admin User 2 Email
            </Label>
            <Input
              type="email"
              value={admin2}
              onChange={(e) => setAdmin2(e.target.value)}
              placeholder="admin2@taxmaestro.com"
            />
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={saveAdminUsers}
          className="border-brand/40 text-brand hover:bg-brand-soft"
        >
          Update Allowed Admin Users
        </Button>
      </div>

      {/* Business Details Panel */}
      <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm border-b border-border/60 pb-2">
          Business Profile & Details
        </h3>
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
    </div>
  );
}
