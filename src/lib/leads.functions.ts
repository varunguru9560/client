import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,15}$/),
  email: z.string().trim().email().max(255),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(1000),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => leadSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; sheetSynced: boolean }> => {
    const { insertLead } = await import("@/lib/leads.server");
    const { appendLeadsToSheet } = await import("@/lib/sheets.server");

    const created = await insertLead(data);
    const sheet = await appendLeadsToSheet([{ ...data, created_at: created.created_at }]);
    return { ok: true, sheetSynced: sheet.ok };
  });

export const syncLeadsToSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; count: number; error?: string }> => {
    const { appendLeadsToSheet } = await import("@/lib/sheets.server");

    const { data, error } = await context.supabase
      .from("leads")
      .select("created_at, name, phone, email, service, message, status")
      .order("created_at", { ascending: true });
    if (error) return { ok: false, count: 0, error: error.message };

    const rows = data ?? [];
    const result = await appendLeadsToSheet(rows);
    return result.ok
      ? { ok: true, count: rows.length }
      : { ok: false, count: 0, error: result.error ?? "Sheet write failed" };
  });
