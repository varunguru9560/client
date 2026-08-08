import { createFileRoute } from "@tanstack/react-router";
import { Testimonials } from "@/components/site/Testimonials";
import { PageLayout } from "@/components/site/PageLayout";
import { getSiteContent } from "@/lib/site-content.functions";

const title = "Client Reviews | The Tax Maestro — 5.0 Rated in Delhi";
const description =
  "Read what individuals, startups, NGOs and established firms say about working with The Tax Maestro in Palam, New Delhi — a straight 5.0 rating.";

export const Route = createFileRoute("/reviews")({
  component: ReviewsPage,
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
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
});

function ReviewsPage() {
  return (
    <PageLayout
      raw={Route.useLoaderData()}
      eyebrow="Client reviews"
      title="A straight 5.0, in our clients' words"
      intro="Individuals, business owners, salaried professionals and NGOs — here is what they say after their filings were done."
    >
      <Testimonials />
    </PageLayout>
  );
}
