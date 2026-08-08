import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { StatsBar } from "@/components/site/StatsBar";
import { About } from "@/components/site/About";
import { Services } from "@/components/site/Services";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { Testimonials } from "@/components/site/Testimonials";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
import { ClientPlateSection } from "@/components/site/ClientPlateSection";
import { Footer } from "@/components/site/Footer";
import { getSiteContent } from "@/lib/site-content.functions";
import { SiteContentProvider, toSiteContent } from "@/lib/site-content";

const title = "Tax Consultant in Delhi | The Tax Maestro — Shweta Singh";
const description =
  "GST registration in Palam, company registration in Delhi, ITR & TDS filing and licences — expert tax and financial consultancy by Shweta Singh. 5.0 rated. Your trust, Our Priority.";

export const Route = createFileRoute("/")({
  component: Index,
  loader: () => getSiteContent(),
  errorComponent: () => <SiteShell />,
  head: ({ loaderData }) => {
    const { business, faqs } = toSiteContent(loaderData);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content:
            "tax consultant Delhi, GST registration Palam, company registration Delhi, income tax return filing Delhi, LLP registration, FSSAI licence Delhi, trademark registration",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AccountingService",
            name: business.name,
            description,
            founder: { "@type": "Person", name: business.person, jobTitle: business.role },
            telephone: [`+91${business.mobile}`, "+91-11-44128343"],
            address: {
              "@type": "PostalAddress",
              streetAddress:
                "WZ-182, KH NO.-177/1, Second Floor, Near Palam Gol Chakkar, Palam Dabri Road",
              addressLocality: "New Delhi",
              postalCode: "110045",
              addressCountry: "IN",
            },
            areaServed: "Delhi NCR",
            aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "13" },
          }),
        },
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

function Index() {
  const content = toSiteContent(Route.useLoaderData());
  return (
    <SiteContentProvider content={content}>
      <SiteShell />
    </SiteContentProvider>
  );
}

function SiteShell() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <About />
        <Services />
        <WhyChooseUs />
        <Testimonials />
        <Faq />
        <Contact />
        <ClientPlateSection />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
