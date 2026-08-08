import { createFileRoute } from "@tanstack/react-router";
import { Faq } from "@/components/site/Faq";
import { PageLayout } from "@/components/site/PageLayout";
import { getSiteContent } from "@/lib/site-content.functions";
import { toSiteContent } from "@/lib/site-content";

const title = "FAQ | Documents, Timelines & Fees — The Tax Maestro";
const description =
  "Answers on ITR documents, GST registration timelines, online company registration, turnaround times and how consultations work at The Tax Maestro, New Delhi.";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  loader: () => getSiteContent(),
  head: ({ loaderData }) => {
    const { faqs } = toSiteContent(loaderData);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: "/faq" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
});

function FaqPage() {
  return (
    <PageLayout
      raw={Route.useLoaderData()}
      eyebrow="FAQ"
      title="Questions clients ask us"
      intro="Documents, timelines and process — the things most people want to know before the first call."
    >
      <Faq />
    </PageLayout>
  );
}
