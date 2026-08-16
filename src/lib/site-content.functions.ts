import { createServerFn } from "@tanstack/react-start";
import firebaseConfig from "../../firebase-applet-config.json";

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

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDoc = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<RawSiteContent> => {
    const projectId = firebaseConfig.projectId;
    const apiKey = firebaseConfig.apiKey;
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";

    if (!projectId || !apiKey) {
      return { settings: null, serviceGroups: [], testimonials: [], faqs: [] };
    }

    try {
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents`;

      const [settingsRes, servicesRes, testimonialsRes, faqsRes] = await Promise.all([
        fetch(`${baseUrl}/site_settings/current?key=${apiKey}`).catch(() => null),
        fetch(`${baseUrl}/service_groups?key=${apiKey}`).catch(() => null),
        fetch(`${baseUrl}/testimonials?key=${apiKey}`).catch(() => null),
        fetch(`${baseUrl}/faqs?key=${apiKey}`).catch(() => null),
      ]);

      let settings = null;
      if (settingsRes && settingsRes.ok) {
        const doc: FirestoreDoc = await settingsRes.json();
        if (doc.fields) {
          const hoursValues = doc.fields.hours?.arrayValue?.values || [];
          const hours = hoursValues.map((v) => {
            const str = v.stringValue || "";
            const [day, ...timeParts] = str.split(":");
            return { day: day?.trim() || "", time: timeParts.join(":").trim() };
          });
          settings = {
            name: doc.fields.name?.stringValue || "",
            person: doc.fields.person?.stringValue || "",
            role: doc.fields.role?.stringValue || "",
            tagline: doc.fields.tagline?.stringValue || "",
            gstin: doc.fields.gstin?.stringValue || "",
            mobile: doc.fields.mobile?.stringValue || "",
            landline: doc.fields.landline?.stringValue || "",
            address: doc.fields.address?.stringValue || "",
            hours,
          };
        }
      }

      const serviceGroups: {
        id: string;
        title: string;
        icon: string;
        blurb: string;
        items: string[];
      }[] = [];
      if (servicesRes && servicesRes.ok) {
        const json = await servicesRes.json();
        const docs: FirestoreDoc[] = json.documents || [];
        docs.forEach((doc) => {
          if (doc.fields) {
            const id = doc.name.split("/").pop() || "";
            const items =
              doc.fields.items?.arrayValue?.values?.map((v) => v.stringValue || "") || [];
            serviceGroups.push({
              id,
              title: doc.fields.title?.stringValue || "",
              icon: doc.fields.icon?.stringValue || "Sparkles",
              blurb: doc.fields.blurb?.stringValue || "",
              items,
            });
          }
        });
      }

      const testimonials: { id: string; quote: string; author: string; rating: number }[] = [];
      if (testimonialsRes && testimonialsRes.ok) {
        const json = await testimonialsRes.json();
        const docs: FirestoreDoc[] = json.documents || [];
        docs.forEach((doc) => {
          if (doc.fields) {
            const id = doc.name.split("/").pop() || "";
            testimonials.push({
              id,
              quote: doc.fields.quote?.stringValue || "",
              author: doc.fields.author?.stringValue || "",
              rating: Number(
                doc.fields.rating?.integerValue || doc.fields.rating?.doubleValue || 5,
              ),
            });
          }
        });
      }

      const faqs: { id: string; question: string; answer: string }[] = [];
      if (faqsRes && faqsRes.ok) {
        const json = await faqsRes.json();
        const docs: FirestoreDoc[] = json.documents || [];
        docs.forEach((doc) => {
          if (doc.fields) {
            const id = doc.name.split("/").pop() || "";
            faqs.push({
              id,
              question: doc.fields.question?.stringValue || "",
              answer: doc.fields.answer?.stringValue || "",
            });
          }
        });
      }

      return { settings, serviceGroups, testimonials, faqs };
    } catch (err) {
      console.warn("Falling back to default site data:", err);
      return { settings: null, serviceGroups: [], testimonials: [], faqs: [] };
    }
  },
);
