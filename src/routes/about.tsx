import { createFileRoute } from "@tanstack/react-router";
import { About } from "@/components/site/About";
import { StatsBar } from "@/components/site/StatsBar";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { PageLayout } from "@/components/site/PageLayout";
import { getSiteContent } from "@/lib/site-content.functions";

const title = "About Shweta Singh | Tax & Financial Consultant, New Delhi";
const description =
  "Meet Shweta Singh — tax and financial consultant in Palam, New Delhi, known for deep technical knowledge, meticulous filings and proactive client service.";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function AboutPage() {
  return (
    <PageLayout
      raw={Route.useLoaderData()}
      eyebrow="About us"
      title="A consultant who knows your file personally"
      intro="Tax, compliance and financial advisory led personally by Shweta Singh — clear scope, realistic timelines and updates before deadlines, not after."
    >
      <StatsBar />
      <About />
      <WhyChooseUs />
    </PageLayout>
  );
}
