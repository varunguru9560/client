import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { LeadInput } from "./leads.functions";

export async function insertLead(lead: LeadInput): Promise<{ created_at: string }> {
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable_3TSH7huqEB_9EXY4o9iokg_HT9TBC67";
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://leunkjtcahjrrkrkmwmp.supabase.co";

  if (!key || !url) {
    console.warn(
      "[Leads Server] Supabase credentials not configured. Skipping server database insert.",
    );
    return { created_at: new Date().toISOString() };
  }

  try {
    const client = createClient<Database>(url, key, {
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

    const { error } = await client.from("leads").insert(lead);
    if (error) {
      console.warn("[Leads Server] Supabase insert warning:", error.message);
    }
  } catch (err) {
    console.warn("[Leads Server] Failed to insert lead into Supabase:", err);
  }

  return { created_at: new Date().toISOString() };
}
