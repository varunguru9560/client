import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import firebaseConfig from "../../firebase-applet-config.json";

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
  .inputValidator(
    (input?: {
      leads?: {
        name: string;
        phone: string;
        email?: string;
        service?: string;
        message?: string;
        status?: string;
        created_at: string;
      }[];
    }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; count: number; error?: string }> => {
    const { appendLeadsToSheet } = await import("@/lib/sheets.server");

    let rows: {
      name: string;
      phone: string;
      email?: string;
      service?: string;
      message?: string;
      status?: string;
      created_at: string;
    }[] = data?.leads || [];

    if (!rows.length) {
      try {
        const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
        const projectId = firebaseConfig.projectId;
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/leads?key=${firebaseConfig.apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          const docs =
            (json.documents as {
              fields?: Record<string, { stringValue?: string }>;
            }[]) || [];
          rows = docs.map((doc) => ({
            name: doc.fields?.name?.stringValue || "",
            phone: doc.fields?.phone?.stringValue || "",
            email: doc.fields?.email?.stringValue || "",
            service: doc.fields?.service?.stringValue || "",
            message: doc.fields?.message?.stringValue || "",
            status: doc.fields?.status?.stringValue || "new",
            created_at: doc.fields?.created_at?.stringValue || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("Could not fetch remote Firestore leads for sheet sync:", err);
      }
    }

    if (!rows.length) {
      return { ok: true, count: 0 };
    }

    const result = await appendLeadsToSheet(rows);
    return result.ok
      ? { ok: true, count: rows.length }
      : { ok: false, count: 0, error: result.error ?? "Sheet write failed" };
  });
