export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatar: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

export interface PricingPlan {
  name: string;
  price: number | null;
  period: string | null;
  description: string;
  highlight: boolean;
  badge: string | null;
  features: string[];
  cta: string;
  href: string;
}
