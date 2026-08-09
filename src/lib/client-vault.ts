import { supabase } from "@/integrations/supabase/client";

export interface ClientDocument {
  id: string;
  clientPhone: string; // e.g. "9876543210"
  clientName: string;
  clientEmail?: string;
  title: string;
  category:
    | "ITR Return"
    | "GST Certificate"
    | "Audit Report"
    | "Form 16"
    | "Notice & Reply"
    | "Financial Statements"
    | "Other";
  uploadedBy: "consultant" | "client";
  uploaderName: string;
  fileUrl?: string; // Data URI or URL
  driveUrl?: string; // Google Drive URL
  fileName?: string;
  fileSize?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientUser {
  phone: string;
  name: string;
  email?: string;
  authProvider: "phone" | "google" | "email";
  isLoggedIn: boolean;
}

const STORAGE_DOCS_KEY = "tax_maestro_client_documents_v1";
const STORAGE_USER_KEY = "tax_maestro_logged_client_v1";

// BroadcastChannel for instant cross-tab & cross-window updates
let docsChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    docsChannel = new BroadcastChannel("tax_maestro_client_docs_channel");
    docsChannel.onmessage = () => {
      window.dispatchEvent(new Event("client-docs-changed"));
    };
  } catch {
    // Fallback if BroadcastChannel fails
  }
}

// Initial sample documents for demo client 9876543210 or general testing
const initialDocuments: ClientDocument[] = [
  {
    id: "doc-demo-1",
    clientPhone: "9876543210",
    clientName: "Rahul Sharma",
    clientEmail: "rahul.sharma@example.com",
    title: "AY 2025-26 Income Tax Return Acknowledgment (Form ITR-V)",
    category: "ITR Return",
    uploadedBy: "consultant",
    uploaderName: "Shweta Singh (The Tax Maestro)",
    driveUrl: "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing",
    fileName: "ITR_V_AY2025-26_Rahul_Sharma.pdf",
    fileSize: "245 KB",
    notes: "Your Income Tax Return for AY 2025-26 has been successfully verified and filed.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "doc-demo-2",
    clientPhone: "9876543210",
    clientName: "Rahul Sharma",
    clientEmail: "rahul.sharma@example.com",
    title: "GST Registration Certificate (Form REG-06)",
    category: "GST Certificate",
    uploadedBy: "consultant",
    uploaderName: "Shweta Singh (The Tax Maestro)",
    driveUrl: "https://drive.google.com/drive/folders/1GST_Certificates_TaxMaestro",
    fileName: "GSTIN_07FSDPS115291Z8_Certificate.pdf",
    fileSize: "1.2 MB",
    notes: "Official GSTIN Certificate issued by Central GST Department.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "doc-demo-3",
    clientPhone: "9876543210",
    clientName: "Rahul Sharma",
    clientEmail: "rahul.sharma@example.com",
    title: "Bank Statement FY 2024-25 (Uploaded by Client)",
    category: "Financial Statements",
    uploadedBy: "client",
    uploaderName: "Rahul Sharma",
    driveUrl: "",
    fileName: "HDFC_Bank_Statement_FY24-25.pdf",
    fileSize: "890 KB",
    notes: "Bank statement for audit & computation verification.",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function getStoredClientUser(): ClientUser | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_USER_KEY);
    if (!data) return null;
    return JSON.parse(data) as ClientUser;
  } catch {
    return null;
  }
}

export function setStoredClientUser(user: ClientUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_USER_KEY);
  } else {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event("client-auth-changed"));
}

export function getAllClientDocuments(): ClientDocument[] {
  if (typeof window === "undefined") return initialDocuments;
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(initialDocuments));
      return initialDocuments;
    }
    return JSON.parse(raw) as ClientDocument[];
  } catch {
    return initialDocuments;
  }
}

export function saveClientDocuments(docs: ClientDocument[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
  window.dispatchEvent(new Event("client-docs-changed"));
  if (docsChannel) {
    docsChannel.postMessage({ type: "DOCS_UPDATED" });
  }
}

export function getDocumentsForClient(
  target: string | { phone?: string; email?: string; name?: string } | null,
): ClientDocument[] {
  if (!target) return [];
  const all = getAllClientDocuments();

  let queryPhone = "";
  let queryEmail = "";

  if (typeof target === "string") {
    if (target.includes("@")) {
      queryEmail = target.toLowerCase().trim();
    } else {
      queryPhone = normalizePhone(target);
    }
  } else {
    if (target.phone) queryPhone = normalizePhone(target.phone);
    if (target.email) queryEmail = target.email.toLowerCase().trim();
  }

  return all.filter((doc) => {
    const docNormPhone = normalizePhone(doc.clientPhone);
    const docEmail = doc.clientEmail ? doc.clientEmail.toLowerCase().trim() : "";

    const matchesPhone = Boolean(queryPhone && docNormPhone && docNormPhone === queryPhone);
    const matchesEmail = Boolean(queryEmail && docEmail && docEmail === queryEmail);

    return matchesPhone || matchesEmail;
  });
}

export function addClientDocument(doc: Omit<ClientDocument, "id" | "createdAt">): ClientDocument {
  const newDoc: ClientDocument = {
    ...doc,
    id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  const current = getAllClientDocuments();
  const updated = [newDoc, ...current];
  saveClientDocuments(updated);
  return newDoc;
}

export function deleteClientDocument(id: string): void {
  const current = getAllClientDocuments();
  const updated = current.filter((d) => d.id !== id);
  saveClientDocuments(updated);
}
