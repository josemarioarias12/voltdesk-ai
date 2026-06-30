import type { FeatureCard, Testimonial, StatItem, NavLink, FooterSection, PricingPlan } from "./types";

export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "#api" },
];

export const STATS: StatItem[] = [
  { value: 342, suffix: "+", label: "Tickets Processed Daily" },
  { value: 3, suffix: "s", label: "Average AI Classification", prefix: "< " },
  { value: 91, suffix: "%", label: "SLA Compliance Rate" },
  { value: 60, suffix: "%", label: "Reduction in Manual Overhead" },
];

export const FEATURES: FeatureCard[] = [
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    title: "Smart Ticket Engine",
    description: "Auto-classify, prioritize, and route tickets in under 3 seconds with GPT-4o.",
    badge: "< 3s",
    href: "/tickets",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
    title: "AI Agent Orchestrator",
    description: "Let AI resolve routine tickets automatically with full audit trail and human approval.",
    badge: "Auto-pilot",
    href: "/tickets",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
    title: "Predictive SLA Engine",
    description: "Know which tickets will breach SLA before they do. Act before the deadline.",
    badge: "Predictive",
    href: "/tickets",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    title: "Facilities & Space Mgmt",
    description: "Interactive floor maps, room reservations, and AI-powered space optimization.",
    badge: "Real-time",
    href: "/dashboard",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    title: "Operational Twin",
    description: "Real-time D3.js visualization of your entire operations. Live. Interactive. Actionable.",
    badge: "D3.js",
    href: "/dashboard",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    title: "Enterprise Compliance",
    description: "SOC 2-ready audit logs, GDPR right to forget, and data retention policies built in.",
    badge: "SOC 2",
    href: "/admin",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "VoltDesk AI reduced our ticket classification time from 15 minutes to 3 seconds. The ROI was immediate.",
    name: "Carlos Mendez",
    role: "IT Director · TechCorp",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23028090'/%3E%3Ctext x='40' y='46' text-anchor='middle' fill='white' font-size='28' font-family='Inter,sans-serif' font-weight='700'%3ECM%3C/text%3E%3C/svg%3E",
    initials: "CM",
  },
  {
    quote: "The XAI panel was the feature that got our compliance team to approve the rollout. Transparency matters.",
    name: "Sarah Chen",
    role: "VP Operations · HealthCo",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%2302C39A'/%3E%3Ctext x='40' y='46' text-anchor='middle' fill='white' font-size='28' font-family='Inter,sans-serif' font-weight='700'%3ESC%3C/text%3E%3C/svg%3E",
    initials: "SC",
  },
  {
    quote: "QR Demo Mode let us onboard 50 employees in one session. Unbelievable experience for our HR team.",
    name: "Miguel Torres",
    role: "HR Manager · RetailPlus",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%230D1B2A'/%3E%3Ctext x='40' y='46' text-anchor='middle' fill='%2302C39A' font-size='28' font-family='Inter,sans-serif' font-weight='700'%3EMT%3C/text%3E%3C/svg%3E",
    initials: "MT",
  },
];

export const TECH_STACK = [
  {
    name: "Rails",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#CC0000" d="M22.246 0c-.198 1.96-1.288 3.597-2.537 4.963C18.32 6.44 16.494 7.38 14.62 7.38c-.19-1.853.553-3.834 1.792-5.188C17.69.72 19.963-.15 22.246 0zm-9.7 8.678c1.107 0 3.162.34 4.57 2.03l-.403.275c-1.18-1.27-2.83-1.587-4.168-1.587-3.34 0-6.145 2.722-6.145 6.9 0 4.28 2.46 7.19 6.38 7.19 1.804 0 3.724-.762 4.938-2.197l.38.3C16.7 23.127 14.6 24 12.78 24 8.038 24 4.93 20.605 4.93 16.296c0-4.644 3.377-7.618 7.617-7.618z"/></svg>`,
    bg: "rgba(204,0,0,0.1)",
  },
  {
    name: "PostgreSQL",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#336791" d="M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.922 10.922 0 0 0 12.6.258C11.422.258 10.51.443 9.9.767a6.927 6.927 0 0 0-.057-.03C9.04.34 8.053.14 6.977.172 4.568.226 2.373 1.36 1.033 3.186A9.11 9.11 0 0 0 .013 5.416a9.643 9.643 0 0 0-.01 5.005c.538 1.781 1.351 2.843 2.04 2.832.329.006.698-.176 1.03-.87a8.528 8.528 0 0 0 .302-.807c.117.16.245.314.385.46 1.043 1.086 2.517 1.644 4.22 1.61.42-.008.826-.06 1.214-.155l-.01.041c-.12.5-.17 1.052.065 1.39.148.211.38.315.66.305.25-.01.54-.125.836-.37.08-.067.175-.137.238-.206.12.108.247.213.38.31 1.082.795 2.456 1.102 3.8.86 1.033-.19 1.99-.69 2.727-1.402.11.304.252.574.433.785.342.405.777.573 1.25.49.664-.116 1.2-.703 1.565-1.698.18-.49.32-1.064.395-1.71.017-.14.018-.283.029-.428.029-.02.057-.04.085-.063.801-.605 1.59-1.686 2.122-3.204.303-.86.482-1.842.516-2.875.03-.91-.06-1.743-.25-2.432C21.944 1.643 20.935.459 19.658.085A4.403 4.403 0 0 0 17.128 0z"/></svg>`,
    bg: "rgba(51,103,145,0.1)",
  },
  {
    name: "Redis",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#DC382D" d="M10.9 7.384l2.336-1.083 2.294 1.083-2.294 1.083zm8.58-3.657l-1.52-.715-2.58 1.207L13.85 3.27l-1.534.715 1.52.71-2.536 1.222-1.48-.711-1.52.71 1.52.714-2.456 1.147 1.534.716 2.456-1.147 1.52.715 1.52-.715-1.52-.715zm-5.057 9.408c-5.523 0-10-1.53-10-3.417s4.477-3.42 10-3.42c5.524 0 10 1.53 10 3.42 0 1.887-4.476 3.417-10 3.417zm0 4c-5.523 0-10-1.53-10-3.417v-3.32c0 1.887 4.477 3.42 10 3.42 5.524 0 10-1.533 10-3.42v3.32c0 1.887-4.476 3.417-10 3.417zm0 4c-5.523 0-10-1.53-10-3.416v-3.32c0 1.886 4.477 3.417 10 3.417 5.524 0 10-1.53 10-3.418v3.32c0 1.887-4.476 3.417-10 3.417z"/></svg>`,
    bg: "rgba(220,56,45,0.1)",
  },
  {
    name: "OpenAI",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.5 14.135a4.504 4.504 0 0 1-2.16-6.24zm16.597 3.855l-5.843-3.374L15.115 7.2a.076.076 0 0 1 .071 0l4.316 2.487a4.5 4.5 0 0 1-.676 8.123v-5.68a.79.79 0 0 0-.389-.68zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.316-2.482a4.5 4.5 0 0 1 6.675 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.993l-2.597 1.5-2.607-1.5z"/></svg>`,
    bg: "rgba(0,0,0,0.06)",
  },
  {
    name: "Anthropic",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#C9581E" d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l1.388-3.64h6.397l1.389 3.64h3.603L10.173 3.52zm-3.97 9.86l2.2-5.88 2.199 5.88H6.203z"/></svg>`,
    bg: "rgba(201,88,30,0.1)",
  },
  {
    name: "Google AI",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M12 11.1L6.8 2.1h10.4L12 11.1zm0 1.8L6.8 22H1.6L12 4l10.4 18h-5.2L12 12.9z"/></svg>`,
    bg: "rgba(66,133,244,0.1)",
  },
  {
    name: "React",
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2.05" fill="#61DAFB"/><path fill="none" stroke="#61DAFB" strokeWidth="1.2" d="M12 5.5c4.97 0 9 2.91 9 6.5s-4.03 6.5-9 6.5S3 15.59 3 12s4.03-6.5 9-6.5zm4.5 1.12c2.48 4.3 2.48 9.46 0 13.76M7.5 6.62c-2.48 4.3-2.48 9.46 0 13.76"/></svg>`,
    bg: "rgba(97,218,251,0.1)",
  },
  {
    name: "pgvector",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    bg: "rgba(2,128,144,0.1)",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: 49,
    period: "month",
    description: "Perfect for small teams getting started with AI-powered support.",
    highlight: false,
    badge: null,
    features: [
      "Up to 500 tickets/month",
      "AI classification (GPT-4o)",
      "3 departments",
      "Basic SLA tracking",
      "Email notifications",
      "5 team members",
      "Standard support",
    ],
    cta: "Start free trial",
    href: "/login",
  },
  {
    name: "Professional",
    price: 149,
    period: "month",
    description: "For growing teams that need advanced AI and full operational control.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 5,000 tickets/month",
      "Multi-provider AI (GPT-4o + Claude + Gemini)",
      "Unlimited departments",
      "Predictive SLA Engine",
      "AI Agent Orchestrator",
      "HR & Asset modules",
      "25 team members",
      "Real-time ActionCable",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/login",
  },
  {
    name: "Enterprise",
    price: null,
    period: null,
    description: "Custom deployment for large organizations with compliance requirements.",
    highlight: false,
    badge: null,
    features: [
      "Unlimited tickets",
      "Custom AI model routing",
      "SOC 2 compliance package",
      "GDPR right-to-forget",
      "Operational Twin (D3.js)",
      "QR Demo Mode",
      "Unlimited team members",
      "Dedicated infrastructure",
      "SLA guarantee",
      "24/7 dedicated support",
    ],
    cta: "Contact sales",
    href: "#contact",
  },
];

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#api" },
      { label: "Status", href: "#" },
      { label: "Support", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "GDPR", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
