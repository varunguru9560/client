import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Phone, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSiteContent } from "@/lib/site-content";
import { submitLead } from "@/lib/leads.functions";
import { addStoredLead } from "@/lib/leads.store";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  service: z.string().trim().min(2, "Please choose a service").max(120),
  message: z.string().trim().min(10, "Tell us a little more").max(1000),
});

type FormValues = z.infer<typeof schema>;

export function Contact() {
  const { business, serviceGroups } = useSiteContent();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", service: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    let ok = false;
    let supaError: string | null = null;
    try {
      // Guaranteed instant persistence & live admin panel sync
      const res = await addStoredLead(values);
      ok = true;
      if (res.error) {
        supaError = res.error;
      }

      // Also trigger server lead handler and Google Sheets sync
      await submitLead({ data: values }).catch((err) => {
        console.warn("Server function lead sync notice:", err);
      });
    } catch (err) {
      console.error("Lead submission error", err);
    }
    setSubmitting(false);

    if (!ok) {
      toast.error("We couldn't send your enquiry", {
        description: `Please try again or call us directly on ${business.mobile}.`,
      });
      return;
    }

    if (supaError) {
      toast.warning("Saved locally, but Supabase error", {
        description: `Supabase message: "${supaError}". Make sure the 'leads' table and RLS policies are created in Supabase SQL editor.`,
      });
    } else {
      toast.success("Thank you — your enquiry is saved to Supabase!", {
        description: `We will call you on ${values.phone} shortly. For anything urgent, dial ${business.mobile}.`,
      });
    }
    reset();
  };

  return (
    <section id="contact" className="bg-muted/50 py-20 lg:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="eyebrow">Contact & location</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Book a consultation in Palam, New Delhi
          </h2>
          <p className="mt-5 text-muted-foreground">
            Share a few details and we'll get back with a clear scope, timeline and document
            checklist. Prefer talking? Both numbers are click-to-call.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="soft-card p-6">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft">
                  <MapPin className="size-5 text-brand" />
                </span>
                <div>
                  <h3 className="font-semibold">Office address</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{business.address}</p>
                </div>
              </div>
            </div>

            <div className="soft-card p-6">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft">
                  <Phone className="size-5 text-brand" />
                </span>
                <div>
                  <h3 className="font-semibold">Call us</h3>
                  <p className="mt-1 text-sm">
                    <a href={`tel:${business.mobile}`} className="hover:text-brand">
                      M: {business.mobile}
                    </a>
                  </p>
                  <p className="text-sm">
                    <a
                      href={`tel:${business.landline.replace(/-/g, "")}`}
                      className="hover:text-brand"
                    >
                      Landline: {business.landline}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-card p-6">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft">
                  <Receipt className="size-5 text-brand" />
                </span>
                <div>
                  <h3 className="font-semibold">GSTIN</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{business.gstin}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-card)]">
              <iframe
                title="The Tax Maestro office location on Google Maps"
                src="https://www.google.com/maps?q=Palam%20Gol%20Chakkar%2C%20Palam%20Dabri%20Road%2C%20New%20Delhi%20110045&output=embed"
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block border-0"
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="soft-card space-y-5 p-7 hover:translate-y-0"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Your name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="10-digit mobile"
                  {...register("phone")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service needed</Label>
              <select
                id="service"
                {...register("service")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="">Select a category</option>
                {serviceGroups.map((g) => (
                  <option key={g.id} value={g.title}>
                    {g.title}
                  </option>
                ))}
              </select>
              {errors.service && (
                <p className="text-xs text-destructive">{errors.service.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Briefly describe your requirement"
                {...register("message")}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            <Button type="submit" variant="cta" size="xl" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Mail className="size-3.5" /> We reply to every enquiry personally.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
