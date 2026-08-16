import type { LeadInput } from "./leads.functions";
import firebaseConfig from "../../firebase-applet-config.json";

export async function insertLead(lead: LeadInput): Promise<{ created_at: string }> {
  const createdAt = new Date().toISOString();
  const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
  const projectId = firebaseConfig.projectId;

  if (!projectId) {
    return { created_at: createdAt };
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/leads?key=${firebaseConfig.apiKey}`;
    const payload = {
      fields: {
        name: { stringValue: lead.name },
        phone: { stringValue: lead.phone },
        email: { stringValue: lead.email },
        service: { stringValue: lead.service },
        message: { stringValue: lead.message },
        status: { stringValue: "new" },
        created_at: { stringValue: createdAt },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Firebase Leads Server Insert Notice]:", errText);
    }
  } catch (err) {
    console.warn("[Firebase Leads Server] Failed to insert lead:", err);
  }

  return { created_at: createdAt };
}
