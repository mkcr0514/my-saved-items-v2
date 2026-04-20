export interface ProductBenefit {
  icon: string;
  label: string;
}

export interface QuoteProduct {
  id: string;
  tag: string;
  name: string;
  meta: string;
  premium: string;
  term: string;
  daily: string;
  tags?: string[];
  description?: string;
  ageRange?: string;
  benefitIcons?: ProductBenefit[];
  subItems?: {
    label: string;
    name: string;
    subtotal: string;
    term: string;
    amount: string;
    unit?: string;
  }[];
}

export interface BenefitItem {
  k: string;
  v: string[];
}

export interface BenefitGroup {
  name: string;
  items: BenefitItem[];
}

export interface Product {
  id: string;
  name: string;
  meta: string;
  premium: string;
  term: string;
  daily: string;
  tags?: string[];
  description?: string;
  ageRange?: string;
  benefitIcons?: ProductBenefit[];
}

export interface TypeGroup {
  type: string;
  products: Product[];
  benefits: BenefitGroup[];
}
