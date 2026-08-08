import { createFileRoute } from "@tanstack/react-router";
import { Contact } from "@/components/site/Contact";
import { PageLayout } from "@/components/site/PageLayout";
import { getSiteContent } from "@/lib/site-content.functions";

const title = "Contact & Book a Consultation | The Tax Maestro, Palam Delhi";
const description =
  "Book a tax or compliance consultation in Palam, New Delhi. Share your requirement and get a clear scope, timeline and document checklist — or call us directly.";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  return (
    <PageLayout
      raw={Route.useLoaderData()}
      eyebrow="Contact & location"
      title="Book a consultation in Palam, New Delhi"
      intro="Share a few details and we'll get back with a clear scope, timeline and document checklist. Prefer talking? Both numbers are click-to-call."
    >
      <Contact />
    </PageLayout>
  );
}
