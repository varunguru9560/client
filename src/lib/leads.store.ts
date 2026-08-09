import { supabase } from "@/integrations/supabase/client";

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
}

const STORAGE_LEADS_KEY = "tax_maestro_leads_v1";

const initialLeads: LeadItem[] = [];

export function getStoredLeads(): LeadItem[] {
  if (typeof window === "undefined") return initialLeads;
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(initialLeads));
      return initialLeads;
    }
    const parsed = JSON.parse(raw) as LeadItem[];
    const cleaned = parsed.filter((l) => !l.id.startsWith("lead-demo-"));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return initialLeads;
  }
}

export function saveStoredLeads(leads: LeadItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("leads-changed"));
}

export async function fetchSupabaseLeads(): Promise<LeadItem[]> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase Fetch Error]:", error.message);
      return getStoredLeads();
    }

    if (!data) return getStoredLeads();

    const remoteLeads: LeadItem[] = data.map((item) => ({
      id: String(item.id),
      name: item.name || "Anonymous",
      phone: item.phone || "",
      email: item.email || undefined,
      service: item.service || undefined,
      message: item.message || undefined,
      status: (item.status as LeadItem["status"]) || "new",
      created_at: item.created_at || new Date().toISOString(),
    }));

    // Merge remote with local store
    const local = getStoredLeads();
    const mergedMap = new Map<string, LeadItem>();

    local.forEach((l) => mergedMap.set(l.id, l));
    remoteLeads.forEach((r) => mergedMap.set(r.id, r));

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    saveStoredLeads(merged);
    return merged;
  } catch (err) {
    console.warn("Exception fetching Supabase leads:", err);
    return getStoredLeads();
  }
}

export async function addStoredLead(data: {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
}): Promise<{ lead: LeadItem; error: string | null }> {
  const newLead: LeadItem = {
    id: "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    name: data.name,
    phone: data.phone,
    email: data.email,
    service: data.service,
    message: data.message,
    status: "new",
    created_at: new Date().toISOString(),
  };

  const current = getStoredLeads();
  const updated = [newLead, ...current];
  saveStoredLeads(updated);

  let supabaseError: string | null = null;

  try {
    // Insert into Supabase table without requiring .select() so anonymous RLS works
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      service: data.service || null,
      message: data.message || null,
      status: "new",
    });

    if (error) {
      console.error("[Supabase Lead Insert Error]:", error.message);
      supabaseError = error.message;
    } else {
      console.log("[Supabase Lead Insert Success]");
      fetchSupabaseLeads();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Supabase Lead Exception]:", msg);
    supabaseError = msg;
  }

  return { lead: newLead, error: supabaseError };
}

export function updateStoredLeadStatus(id: string, status: LeadItem["status"]): void {
  const current = getStoredLeads();
  const updated = current.map((l) => (l.id === id ? { ...l, status } : l));
  saveStoredLeads(updated);

  supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.warn("Supabase lead status update notice:", error.message);
    })
    .catch(() => {});
}

export function deleteStoredLead(id: string): void {
  const current = getStoredLeads();
  const updated = current.filter((l) => l.id !== id);
  saveStoredLeads(updated);

  supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.warn("Supabase lead delete notice:", error.message);
    })
    .catch(() => {});
}
