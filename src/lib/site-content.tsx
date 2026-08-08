import { createContext, useContext, type ReactNode } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  FileSpreadsheet,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  business as defaultBusiness,
  serviceGroups as defaultServiceGroups,
  testimonials as defaultTestimonials,
  faqs as defaultFaqs,
} from "@/data/site";
import type { RawSiteContent } from "./site-content.functions";

export const iconOptions = {
  Building2,
  FileSpreadsheet,
  Briefcase,
  ScrollText,
  Sparkles,
  BadgeCheck,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconOptions;

export type SiteContent = {
  business: typeof defaultBusiness;
  serviceGroups: { id: string; title: string; icon: LucideIcon; blurb: string; items: string[] }[];
  testimonials: { quote: string; author: string; rating: number }[];
  faqs: { q: string; a: string }[];
};

export const defaultSiteContent: SiteContent = {
  business: defaultBusiness,
  serviceGroups: defaultServiceGroups,
  testimonials: defaultTestimonials.map((t) => ({ ...t, rating: 5 })),
  faqs: defaultFaqs,
};

export function toSiteContent(raw?: RawSiteContent | null): SiteContent {
  if (!raw) return defaultSiteContent;
  return {
    business: raw.settings
      ? {
          ...defaultBusiness,
          ...raw.settings,
          hours: raw.settings.hours.length ? raw.settings.hours : defaultBusiness.hours,
        }
      : defaultBusiness,
    serviceGroups: raw.serviceGroups.length
      ? raw.serviceGroups.map((g) => ({
          id: g.id,
          title: g.title,
          blurb: g.blurb,
          items: g.items,
          icon: iconOptions[g.icon as IconName] ?? Sparkles,
        }))
      : defaultSiteContent.serviceGroups,
    testimonials: raw.testimonials.length
      ? raw.testimonials.map((t) => ({ quote: t.quote, author: t.author, rating: t.rating }))
      : defaultSiteContent.testimonials,
    faqs: raw.faqs.length
      ? raw.faqs.map((f) => ({ q: f.question, a: f.answer }))
      : defaultSiteContent.faqs,
  };
}

const SiteContentContext = createContext<SiteContent>(defaultSiteContent);

export function SiteContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: ReactNode;
}) {
  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
