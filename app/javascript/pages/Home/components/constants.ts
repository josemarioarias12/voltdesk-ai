import type { FeatureCard, Testimonial, StatItem, NavLink, FooterSection } from "./types";

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
  { icon: "⚡", title: "Smart Ticket Engine", description: "Auto-classify, prioritize, and route tickets in under 3 seconds with GPT-4o." },
  { icon: "🤖", title: "AI Agent Orchestrator", description: "Let AI resolve routine tickets automatically with full audit trail and human approval." },
  { icon: "🔔", title: "Predictive SLA Engine", description: "Know which tickets will breach SLA before they do. Act before the deadline." },
  { icon: "📍", title: "Facilities & Space Mgmt", description: "Interactive floor maps, room reservations, and AI-powered space optimization." },
  { icon: "📈", title: "Operational Twin", description: "Real-time visualization of your entire operations. Live. Interactive. Actionable." },
  { icon: "🛡️", title: "Enterprise Compliance", description: "SOC 2-ready audit logs, GDPR right to forget, and data retention policies built in." },
];

export const TESTIMONIALS: Testimonial[] = [
  { quote: "PulseDesk AI reduced our ticket classification time from 15 minutes to 3 seconds. The ROI was immediate.", name: "Carlos Mendez", role: "IT Director · TechCorp", initials: "CM" },
  { quote: "The XAI panel was the feature that got our compliance team to approve the rollout. Transparency matters.", name: "Sarah Chen", role: "VP Operations · HealthCo", initials: "SC" },
  { quote: "QR Demo Mode let us onboard 50 employees in one session. Unbelievable experience for our HR team.", name: "Miguel Torres", role: "HR Manager · RetailPlus", initials: "MT" },
];

export const TECH_STACK = [
  { name: "Rails", icon: "🔶" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Redis", icon: "🔴" },
  { name: "OpenAI", icon: "⚫" },
  { name: "Anthropic", icon: "🟠" },
  { name: "Google AI", icon: "🔵" },
  { name: "React", icon: "⚛️" },
  { name: "pgvector", icon: "🔍" },
];

export const FOOTER_SECTIONS: FooterSection[] = [
  { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Changelog", href: "#" }, { label: "Roadmap", href: "#" }] },
  { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
  { title: "Resources", links: [{ label: "Documentation", href: "#" }, { label: "API Reference", href: "#" }, { label: "Status", href: "#" }, { label: "Support", href: "#" }] },
  { title: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "GDPR", href: "#" }, { label: "Security", href: "#" }] },
];
