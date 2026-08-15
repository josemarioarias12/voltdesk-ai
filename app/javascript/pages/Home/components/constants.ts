import type { TFunction } from "i18next";
import type { FeatureCard, TrustMetric, StatItem, NavLink, FooterSection } from "./types";

const FEATURE_ICONS: string[] = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M2321v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#028090" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
];

const FEATURE_HREFS: string[] = [
  "/tickets",
  "/agent_actions",
  "/tickets",
  "/hr",
  "/inventory",
  "/admin",
  "/assistant/conversation",
  "/admin/compliance",
];

export function getNavLinks(t: TFunction): NavLink[] {
  return [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.demo"), href: "#demo" },
  ];
}

export function getStats(t: TFunction): StatItem[] {
  return [
    { value: 342, suffix: "+", label: t("stats.ticketsProcessed") },
    { value: 3, suffix: "s", label: t("stats.avgClassification"), prefix: "< " },
    { value: 91, suffix: "%", label: t("stats.slaCompliance") },
    { value: 60, suffix: "%", label: t("stats.manualOverhead") },
  ];
}

export function getFeatures(t: TFunction): FeatureCard[] {
  const items = t("features.items", { returnObjects: true }) as { title: string; description: string; badge: string }[];
  return items.map((item, i) => ({
    ...item,
    icon: FEATURE_ICONS[i],
    href: FEATURE_HREFS[i],
  }));
}

export function getTrustMetrics(t: TFunction): TrustMetric[] {
  return t("trust.items", { returnObjects: true }) as TrustMetric[];
}

export function getFooterSections(t: TFunction): FooterSection[] {
  return t("footer.sections", { returnObjects: true }) as FooterSection[];
}

export const TECH_STACK = [
  {
    name: "Rails",
    logo: "/images/tech-stack/rails.png",
    bg: "rgba(204,0,0,0.1)",
  },
  {
    name: "PostgreSQL",
    logo: "/images/tech-stack/postgresql.jpg",
    bg: "rgba(51,103,145,0.1)",
  },
  {
    name: "Redis",
    logo: "/images/tech-stack/redis.png",
    bg: "rgba(220,56,45,0.1)",
  },
  {
    name: "OpenAI",
    logo: "/images/tech-stack/openai.png",
    bg: "rgba(0,0,0,0.06)",
  },
  {
    name: "Anthropic",
    logo: "/images/tech-stack/anthropic.png",
    bg: "rgba(201,88,30,0.1)",
  },
  {
    name: "Google AI",
    logo: "/images/tech-stack/google-ai.png",
    bg: "rgba(142,117,178,0.1)",
  },
  {
    name: "React",
    logo: "/images/tech-stack/react.png",
    bg: "rgba(97,218,251,0.1)",
  },
  {
    name: "pgvector",
    logo: "/images/tech-stack/pgvector.jpg",
    bg: "rgba(2,128,144,0.1)",
  },
];