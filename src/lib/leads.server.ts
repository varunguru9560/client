import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { LeadInput } from "./leads.functions";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function insertLead(lead: LeadInput): Promise<{ created_at: string }> {
  // No .select() here: anon has no SELECT policy on leads, and asking PostgREST
  // to return the row would fail the insert.
  const { error } = await publicClient().from("leads").insert(lead);
  if (error) throw new Error(error.message);

  return { created_at: new Date().toISOString() };
}
