import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ALLOWED_ADMINS_KEY = "tax_maestro_allowed_admin_emails";

// Default seed admin emails (up to 2). If empty, the first 2 users who sign up/in will claim the 2 slots.
const DEFAULT_ALLOWED_ADMINS = ["admin1@taxmaestro.com", "admin2@taxmaestro.com"];

export function getAuthorizedAdminEmails(): string[] {
  if (typeof window === "undefined") return DEFAULT_ALLOWED_ADMINS;
  try {
    const raw = localStorage.getItem(ALLOWED_ADMINS_KEY);
    if (!raw) {
      localStorage.setItem(ALLOWED_ADMINS_KEY, JSON.stringify(DEFAULT_ALLOWED_ADMINS));
      return DEFAULT_ALLOWED_ADMINS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 2);
    }
  } catch (e) {
    console.warn("Error reading authorized admin emails:", e);
  }
  return DEFAULT_ALLOWED_ADMINS;
}

export function saveAuthorizedAdminEmails(emails: string[]): string[] {
  const cleaned = Array.from(
    new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ).slice(0, 2);

  if (typeof window !== "undefined") {
    localStorage.setItem(ALLOWED_ADMINS_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent("admin-emails-changed", { detail: cleaned }));
  }
  return cleaned;
}

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const current = getAuthorizedAdminEmails();

  // If slot count is less than 2 and normalized isn't already listed, auto-bind if initial setup
  if (current.includes(normalized)) {
    return true;
  }

  // Check if there is an empty slot among default placeholder accounts
  const isPlaceholderPresent = current.some(
    (e) => e.startsWith("admin1@") || e.startsWith("admin2@"),
  );
  if (isPlaceholderPresent) {
    // Allow auto-claiming if the user signs up with a new primary email
    return true;
  }

  return false;
}

export function claimAdminSlot(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const current = getAuthorizedAdminEmails();

  if (current.includes(normalized)) return true;

  if (current.length < 2) {
    saveAuthorizedAdminEmails([...current, normalized]);
    return true;
  }

  // Replace default placeholders if present
  const placeholderIndex = current.findIndex(
    (e) => e.startsWith("admin1@") || e.startsWith("admin2@"),
  );
  if (placeholderIndex !== -1) {
    const updated = [...current];
    updated[placeholderIndex] = normalized;
    saveAuthorizedAdminEmails(updated);
    return true;
  }

  return false;
}

export async function resetAllAdminSessions(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("SignOut notice during admin reset:", e);
  }

  if (typeof window !== "undefined") {
    // Clear local storage session tokens
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("firebase") || key.includes("supabase") || key.includes("auth")) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }
}
