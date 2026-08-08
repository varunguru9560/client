import {
  BadgeCheck,
  Briefcase,
  Building2,
  FileSpreadsheet,
  ScrollText,
  Sparkles,
} from "lucide-react";

export const business = {
  name: "The Tax Maestro",
  person: "Shweta Singh",
  role: "Tax & Financial Consultant",
  tagline: "Your trust, Our Priority.",
  gstin: "07FSDPS115291Z8",
  mobile: "7529993681",
  landline: "011-44128343",
  address:
    "WZ-182, KH NO.-177/1, Second Floor, Near Palam Gol Chakkar, Palam Dabri Road, New Delhi-110045",
  hours: [
    { day: "Monday – Saturday", time: "10:00 AM – 7:30 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
};

export const serviceGroups = [
  {
    id: "registrations",
    title: "Registrations",
    icon: Building2,
    blurb: "Get your entity, identity and statutory registrations done right the first time.",
    items: [
      "Digital Signature (DSC)",
      "PAN & TAN",
      "Proprietorship & Firm Registration",
      "Company / LLP Formation",
      "GST Registration & Compliances",
      "Professional Tax Registration & Returns",
      "ESIC & EPFO Registrations & Returns",
      "Shop Act & Labour License",
      "MSME / Udyham Registration",
      "GEM & OEM Registration",
      "ISO Certification",
      "Trademark Registration",
    ],
  },
  {
    id: "tax",
    title: "Tax & Compliance",
    icon: FileSpreadsheet,
    blurb: "Accurate filings, timely reminders and clean records through every due date.",
    items: [
      "Income Tax Returns",
      "TDS Compliances",
      "Professional Tax Returns",
      "Filing of Compliances",
      "CLRA Registration",
    ],
  },
  {
    id: "accounting",
    title: "Accounting & Advisory",
    icon: Briefcase,
    blurb: "Books you can rely on and reports that stand up to bankers and investors.",
    items: ["Accounting and Book Keeping", "Project Report"],
  },
  {
    id: "licenses",
    title: "Licenses & Certifications",
    icon: ScrollText,
    blurb: "Sector licences, NGO approvals and startup recognitions handled end to end.",
    items: [
      "FSSAI Registration / Food License",
      "IEC Code or IECGATE Registration",
      "NGO / Trust or Society Registration & Compliances",
      "12A & 80G",
      "FCRA Registration",
      "Darpan & E-Anudhan Registration",
      "CSR-1",
      "Startup India Certificate & 80-IAC Registration",
    ],
  },
  {
    id: "other",
    title: "Other Services",
    icon: Sparkles,
    blurb: "The practical extras clients ask for once the compliance base is covered.",
    items: ["PF Withdrawal", "Loans & Insurance", "General financial documentation support"],
  },
];

export const differentiators = [
  {
    icon: BadgeCheck,
    title: "One-stop compliance desk",
    text: "30+ registration, tax and licensing services under a single point of contact — no running between agents.",
  },
  {
    icon: Sparkles,
    title: "Personalised attention",
    text: "Every file is handled by Shweta Singh herself, so nothing gets lost in a queue.",
  },
  {
    icon: ScrollText,
    title: "Clarity & accessibility",
    text: "Complex tax and compliance matters explained in plain, usable language before you decide.",
  },
  {
    icon: FileSpreadsheet,
    title: "Proactive planning",
    text: "Deadlines, notices and savings opportunities flagged early — not after the penalty arrives.",
  },
  {
    icon: BadgeCheck,
    title: "Proven track record",
    text: "A straight 5.0 rating from clients across individuals, startups, NGOs and established firms.",
  },
  {
    icon: Briefcase,
    title: "Organised & knowledgeable",
    text: "Documentation checklists, structured follow-ups and deep working knowledge of current law.",
  },
];

export const testimonials = [
  {
    quote:
      "Exceptional knowledge and a level of attention to detail you rarely see. Every query was answered before I even had to follow up — genuinely proactive professionalism.",
    author: "Individual client, New Delhi",
  },
  {
    quote:
      "She secured the best possible financial outcome for us and the service throughout was outstanding. Confident, clear and completely reliable.",
    author: "Business owner, Dwarka",
  },
  {
    quote:
      "Tax and financial planning finally made sense to me. Everything was explained clearly and accessibly, without jargon or pressure.",
    author: "Salaried professional, Palam",
  },
];

export const faqs = [
  {
    q: "Which documents do I need for income tax return filing?",
    a: "For most individuals: PAN, Aadhaar, Form 16 or salary slips, bank statements, interest certificates, investment and insurance proofs, and details of any capital gains or rental income. For businesses we also need books of accounts, GST returns and TDS details. You will receive a short, specific checklist after the first call — nothing generic.",
  },
  {
    q: "How long does GST registration take?",
    a: "Once documents are in order, the application is filed the same day and the GSTIN is usually issued within 3–7 working days, subject to departmental verification. If the officer raises a query, we respond on your behalf and keep you posted at each stage.",
  },
  {
    q: "Can you register a company or LLP for me completely online?",
    a: "Yes. DSC, name approval, incorporation filings, PAN, TAN and post-incorporation compliances are all handled online. Documents can be shared over WhatsApp or email — an office visit is optional, not mandatory.",
  },
  {
    q: "What is the usual turnaround time for filings?",
    a: "Routine returns (ITR, GST, TDS) are prepared within 24–48 hours of receiving complete documents. Registrations and licences depend on the department's processing time, and you get a realistic timeline upfront.",
  },
  {
    q: "How does the consultation process work?",
    a: "You call or submit the form, we schedule a consultation, understand your situation and share a clear scope with fees and a document checklist. Work begins only after you confirm — with regular status updates until the matter is closed.",
  },
  {
    q: "Do you work with NGOs, trusts and societies?",
    a: "Yes — registration, 12A and 80G approvals, FCRA, Darpan, E-Anudhan, CSR-1 and ongoing annual compliances are a regular part of our practice.",
  },
];

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Reviews", to: "/reviews" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
] as const;
