export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
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
