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

// Clean initial state with NO fake or demo documents
const initialDocuments: ClientDocument[] = [];

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
      return initialDocuments;
    }
    const parsed = JSON.parse(raw) as ClientDocument[];
    // Filter out old demo/fake documents
    const cleaned = parsed.filter((d) => !d.id.startsWith("doc-demo-"));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
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

/**
 * Fetch all documents from Supabase database and merge with local documents.
 */
export async function fetchSupabaseClientDocuments(): Promise<ClientDocument[]> {
  try {
    const { data: leadsDocs, error } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "document")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase Docs Fetch Warning]:", error.message);
      return getAllClientDocuments();
    }

    if (!leadsDocs || leadsDocs.length === 0) {
      return getAllClientDocuments();
    }

    const remoteDocs: ClientDocument[] = [];
    leadsDocs.forEach((row) => {
      if (row.message) {
        try {
          const parsed = JSON.parse(row.message) as ClientDocument;
          if (parsed && parsed.id && parsed.title) {
            remoteDocs.push(parsed);
          }
        } catch {
          remoteDocs.push({
            id: String(row.id),
            clientPhone: row.phone || "",
            clientName: row.name || "Client",
            clientEmail: row.email || undefined,
            title: row.service || "Uploaded Document",
            category: "Other",
            uploadedBy: "client",
            uploaderName: row.name || "Client",
            notes: row.message || undefined,
            createdAt: row.created_at || new Date().toISOString(),
          });
        }
      }
    });

    // Merge remote with local store
    const local = getAllClientDocuments();
    const mergedMap = new Map<string, ClientDocument>();

    local.forEach((doc) => mergedMap.set(doc.id, doc));
    remoteDocs.forEach((doc) => mergedMap.set(doc.id, doc));

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    saveClientDocuments(merged);
    return merged;
  } catch (err) {
    console.warn("Exception fetching Supabase documents:", err);
    return getAllClientDocuments();
  }
}

/**
 * Add a document locally AND push it to Supabase database.
 */
export async function addClientDocument(
  doc: Omit<ClientDocument, "id" | "createdAt">,
): Promise<ClientDocument> {
  const newDoc: ClientDocument = {
    ...doc,
    id: "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  const current = getAllClientDocuments();
  const updated = [newDoc, ...current];
  saveClientDocuments(updated);

  // Sync with Supabase
  try {
    const { error } = await supabase.from("leads").insert({
      name: newDoc.clientName,
      phone: newDoc.clientPhone,
      email: newDoc.clientEmail || null,
      service: `DOC::${newDoc.category}::${newDoc.uploadedBy}`,
      message: JSON.stringify(newDoc),
      status: "document",
    });

    if (error) {
      console.warn("[Supabase Document Insert Warning]:", error.message);
    } else {
      console.log("[Supabase Document Insert Success]");
    }
  } catch (err) {
    console.warn("[Supabase Document Exception]:", err);
  }

  return newDoc;
}

/**
 * Upload a binary file directly to Supabase Storage bucket `client-documents`.
 * Falls back gracefully if bucket does not exist or upload fails.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  folderPath = "client-uploads",
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    const { data, error } = await supabase.storage.from("client-documents").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.warn("[Supabase Storage Upload Warning]:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("client-documents")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl || null;
  } catch (err) {
    console.warn("Exception uploading to Supabase Storage:", err);
    return null;
  }
}

/**
 * Delete a document locally AND from Supabase.
 */
export async function deleteClientDocument(id: string): Promise<void> {
  const current = getAllClientDocuments();
  const updated = current.filter((d) => d.id !== id);
  saveClientDocuments(updated);

  try {
    await supabase.from("leads").delete().eq("status", "document").filter("message", "cs", id);
  } catch {
    // Ignore deletion errors on remote
  }
}
