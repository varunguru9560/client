//#region node_modules/.nitro/vite/services/ssr/assets/sheets.server-BsviK6mf.js
var SHEET_ID = process.env["GOOGLE_SHEET_ID"] || "1ba-FoB8m_je1-N2G0Mj8qg275AhaWbvNeBO8U-BROXU";
var RANGE = "Sheet1!A:G";
function toRow(lead) {
	return [
		lead.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
		lead.name,
		lead.phone,
		lead.email ?? "",
		lead.service ?? "",
		lead.message ?? "",
		lead.status ?? "new"
	];
}
/** Appends enquiry rows to the linked Google Sheet. Never throws. */
async function appendLeadsToSheet(leads) {
	const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
	if (!sheetsKey) return {
		ok: false,
		error: "Google Sheets connection is not configured."
	};
	if (leads.length === 0) return { ok: true };
	try {
		const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}:append?valueInputOption=USER_ENTERED&key=${sheetsKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ values: leads.map(toRow) })
		});
		if (!res.ok) {
			const body = await res.text();
			console.error(`Google Sheets append failed [${res.status}]: ${body}`);
			return {
				ok: false,
				error: `Google Sheets rejected the write [${res.status}]`
			};
		}
		return { ok: true };
	} catch (err) {
		console.error("Google Sheets append error", err);
		return {
			ok: false,
			error: "Could not reach Google Sheets."
		};
	}
}
`${SHEET_ID}`;
//#endregion
export { appendLeadsToSheet };
