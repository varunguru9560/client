import { createFileRoute } from "@tanstack/react-router";
import { Services } from "@/components/site/Services";
import { PageLayout } from "@/components/site/PageLayout";
import { getSiteContent } from "@/lib/site-content.functions";

const title = "Our Services | GST, ITR, Company Registration — The Tax Maestro";
const description =
  "Thirty-plus services: GST and company registration, ITR and TDS filing, FSSAI, trademark, NGO compliances and accounting — handled end to end from Palam, New Delhi.";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
});

function ServicesPage() {
  return (
    <PageLayout
      raw={Route.useLoaderData()}
      eyebrow="What we do"
      title="Every registration, return and licence in one place"
      intro="Registrations, taxation, accounting and sector licences — handled by one consultant who knows your file from start to finish."
    >
      <Services />
    </PageLayout>
  );
}
