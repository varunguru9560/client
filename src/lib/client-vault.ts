import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClientDocument {
  id: string;
  clientPhone: string;
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
  fileUrl?: string; // Data URI or file URL
  driveUrl?: string; // Google Drive URL or direct link
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
    // Fallback
  }
}

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
 * Fetch all documents from Firebase Firestore database and merge with local documents.
 */
export async function fetchFirebaseClientDocuments(): Promise<ClientDocument[]> {
  try {
    const colRef = collection(db, "client_documents");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return getAllClientDocuments();
    }

    const remoteDocs: ClientDocument[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      remoteDocs.push({
        id: d.id,
        clientPhone: data.clientPhone || "",
        clientName: data.clientName || "Client",
        clientEmail: data.clientEmail || undefined,
        title: data.title || "Uploaded Document",
        category: data.category || "Other",
        uploadedBy: data.uploadedBy || "client",
        uploaderName: data.uploaderName || data.clientName || "Client",
        fileUrl: data.fileUrl || undefined,
        driveUrl: data.driveUrl || undefined,
        fileName: data.fileName || undefined,
        fileSize: data.fileSize || undefined,
        notes: data.notes || undefined,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      });
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
    console.warn("Exception fetching Firebase documents:", err);
    return getAllClientDocuments();
  }
}

// Alias for backwards-compat during migration
export const fetchSupabaseClientDocuments = fetchFirebaseClientDocuments;

/**
 * Add a document locally AND push it to Firebase Firestore.
 */
export async function addClientDocument(
  docData: Omit<ClientDocument, "id" | "createdAt">,
): Promise<ClientDocument> {
  const newDocId = "doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const createdAt = new Date().toISOString();

  const newDoc: ClientDocument = {
    ...docData,
    id: newDocId,
    createdAt,
  };

  const current = getAllClientDocuments();
  const updated = [newDoc, ...current];
  saveClientDocuments(updated);

  // Sync with Firebase Firestore
  try {
    const docRef = doc(db, "client_documents", newDocId);
    await setDoc(docRef, {
      ...newDoc,
      created_at: createdAt,
    });
    console.log("[Firebase Document Insert Success]", newDocId);
  } catch (err) {
    console.warn("[Firebase Document Exception]:", err);
  }

  return newDoc;
}

/**
 * Delete a document locally AND from Firebase Firestore.
 */
export async function deleteClientDocument(id: string): Promise<void> {
  const current = getAllClientDocuments();
  const updated = current.filter((d) => d.id !== id);
  saveClientDocuments(updated);

  try {
    const docRef = doc(db, "client_documents", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Exception deleting from Firebase:", err);
  }
}

/**
 * Set up real-time listener for Firestore client documents
 */
export function subscribeToClientDocuments(callback: (docs: ClientDocument[]) => void): () => void {
  try {
    const colRef = collection(db, "client_documents");
    const q = query(colRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs: ClientDocument[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          docs.push({
            id: d.id,
            clientPhone: data.clientPhone || "",
            clientName: data.clientName || "Client",
            clientEmail: data.clientEmail || undefined,
            title: data.title || "Uploaded Document",
            category: data.category || "Other",
            uploadedBy: data.uploadedBy || "client",
            uploaderName: data.uploaderName || data.clientName || "Client",
            fileUrl: data.fileUrl || undefined,
            driveUrl: data.driveUrl || undefined,
            fileName: data.fileName || undefined,
            fileSize: data.fileSize || undefined,
            notes: data.notes || undefined,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          });
        });
        saveClientDocuments(docs);
        callback(docs);
      },
      (error) => {
        console.warn("Firebase document subscription warning:", error);
      },
    );
  } catch (err) {
    console.warn("Could not subscribe to Firestore documents:", err);
    return () => {};
  }
}
