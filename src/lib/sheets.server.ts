const SHEET_ID = process.env["GOOGLE_SHEET_ID"] || "1ba-FoB8m_je1-N2G0Mj8qg275AhaWbvNeBO8U-BROXU";
const RANGE = "Sheet1!A:G";

export type SheetLeadRow = {
  created_at?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  service?: string | null;
  message?: string | null;
  status?: string | null;
};

function toRow(lead: SheetLeadRow): string[] {
  return [
    lead.created_at ?? new Date().toISOString(),
    lead.name,
    lead.phone,
    lead.email ?? "",
    lead.service ?? "",
    lead.message ?? "",
    lead.status ?? "new",
  ];
}

/** Appends enquiry rows to the linked Google Sheet. Never throws. */
export async function appendLeadsToSheet(leads: SheetLeadRow[]): Promise<{
  ok: boolean;
  error?: string;
}> {
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!sheetsKey) {
    return { ok: false, error: "Google Sheets connection is not configured." };
  }
  if (leads.length === 0) return { ok: true };

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}:append?valueInputOption=USER_ENTERED&key=${sheetsKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: leads.map(toRow) }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`Google Sheets append failed [${res.status}]: ${body}`);
      return { ok: false, error: `Google Sheets rejected the write [${res.status}]` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Google Sheets append error", err);
    return { ok: false, error: "Could not reach Google Sheets." };
  }
}

export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
