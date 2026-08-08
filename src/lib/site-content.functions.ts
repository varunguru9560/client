import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type RawSiteContent = {
  settings: {
    name: string;
    person: string;
    role: string;
    tagline: string;
    gstin: string;
    mobile: string;
    landline: string;
    address: string;
    hours: { day: string; time: string }[];
  } | null;
  serviceGroups: { id: string; title: string; icon: string; blurb: string; items: string[] }[];
  testimonials: { id: string; quote: string; author: string; rating: number }[];
  faqs: { id: string; question: string; answer: string }[];
};

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<RawSiteContent> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];

    if (!key || !url) {
      return { settings: null, serviceGroups: [], testimonials: [], faqs: [] };
    }

    try {
      const supabase = createClient<Database>(url, key, {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });

      const [settings, services, testimonials, faqs] = await Promise.all([
        supabase
          .from("site_settings")
          .select("name, person, role, tagline, gstin, mobile, landline, address, hours")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("service_groups")
          .select("id, title, icon, blurb, items")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("testimonials")
          .select("id, quote, author, rating")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("faqs")
          .select("id, question, answer")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      return {
        settings: settings.data
          ? {
              ...settings.data,
              hours: Array.isArray(settings.data.hours)
                ? (settings.data.hours as { day: string; time: string }[])
                : [],
            }
          : null,
        serviceGroups: services.data ?? [],
        testimonials: testimonials.data ?? [],
        faqs: faqs.data ?? [],
      };
    } catch (err) {
      console.warn(
        "Failed to fetch site content from Supabase, falling back to default site data:",
        err,
      );
      return { settings: null, serviceGroups: [], testimonials: [], faqs: [] };
    }
  },
);
