import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
}

const STORAGE_LEADS_KEY = "tax_maestro_leads_v1";

const initialLeads: LeadItem[] = [];

export function getStoredLeads(): LeadItem[] {
  if (typeof window === "undefined") return initialLeads;
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(initialLeads));
      return initialLeads;
    }
    const parsed = JSON.parse(raw) as LeadItem[];
    const cleaned = parsed.filter((l) => !l.id.startsWith("lead-demo-"));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return initialLeads;
  }
}

export function saveStoredLeads(leads: LeadItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("leads-changed"));
}

export async function fetchFirebaseLeads(): Promise<LeadItem[]> {
  try {
    const colRef = collection(db, "leads");
    const q = query(colRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return getStoredLeads();
    }

    const remoteLeads: LeadItem[] = [];
    snapshot.forEach((d) => {
      const item = d.data();
      remoteLeads.push({
        id: d.id,
        name: item.name || "Anonymous",
        phone: item.phone || "",
        email: item.email || undefined,
        service: item.service || undefined,
        message: item.message || undefined,
        status: (item.status as LeadItem["status"]) || "new",
        created_at: item.created_at || new Date().toISOString(),
      });
    });

    // Merge remote with local store
    const local = getStoredLeads();
    const mergedMap = new Map<string, LeadItem>();

    local.forEach((l) => mergedMap.set(l.id, l));
    remoteLeads.forEach((r) => mergedMap.set(r.id, r));

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    saveStoredLeads(merged);
    return merged;
  } catch (err) {
    console.warn("Exception fetching Firebase leads:", err);
    return getStoredLeads();
  }
}

// Backwards-compat alias
export const fetchSupabaseLeads = fetchFirebaseLeads;

export async function addStoredLead(data: {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
}): Promise<{ lead: LeadItem; error: string | null }> {
  const newLeadId = "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const createdAt = new Date().toISOString();

  const newLead: LeadItem = {
    id: newLeadId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    service: data.service,
    message: data.message,
    status: "new",
    created_at: createdAt,
  };

  const current = getStoredLeads();
  const updated = [newLead, ...current];
  saveStoredLeads(updated);

  let firebaseError: string | null = null;

  try {
    const docRef = doc(db, "leads", newLeadId);
    await setDoc(docRef, {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      service: data.service || null,
      message: data.message || null,
      status: "new",
      created_at: createdAt,
    });
    console.log("[Firebase Lead Insert Success]", newLeadId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Firebase Lead Exception]:", msg);
    firebaseError = msg;
  }

  return { lead: newLead, error: firebaseError };
}

export function updateStoredLeadStatus(id: string, status: LeadItem["status"]): void {
  const current = getStoredLeads();
  const updated = current.map((l) => (l.id === id ? { ...l, status } : l));
  saveStoredLeads(updated);

  const docRef = doc(db, "leads", id);
  updateDoc(docRef, { status }).catch((err) => {
    console.warn("Firebase lead status update notice:", err);
  });
}

export function deleteStoredLead(id: string): void {
  const current = getStoredLeads();
  const updated = current.filter((l) => l.id !== id);
  saveStoredLeads(updated);

  const docRef = doc(db, "leads", id);
  deleteDoc(docRef).catch((err) => {
    console.warn("Firebase lead delete notice:", err);
  });
}

export function subscribeToFirebaseLeads(callback: (leads: LeadItem[]) => void): () => void {
  try {
    const colRef = collection(db, "leads");
    const q = query(colRef, orderBy("created_at", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const remoteLeads: LeadItem[] = [];
        snapshot.forEach((d) => {
          const item = d.data();
          remoteLeads.push({
            id: d.id,
            name: item.name || "Anonymous",
            phone: item.phone || "",
            email: item.email || undefined,
            service: item.service || undefined,
            message: item.message || undefined,
            status: (item.status as LeadItem["status"]) || "new",
            created_at: item.created_at || new Date().toISOString(),
          });
        });
        saveStoredLeads(remoteLeads);
        callback(remoteLeads);
      },
      (err) => {
        console.warn("Firebase leads subscription error:", err);
      },
    );
  } catch (err) {
    console.warn("Could not subscribe to Firebase leads:", err);
    return () => {};
  }
}
