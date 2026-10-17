export interface BlogSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  publishedIso: string;
  modifiedIso: string;
}

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

export const POLARIS_TEAM_AUTHOR: BlogAuthor = {
  name: "Polaris Team",
  role: "Tax Advisory & CPAs",
  avatar: "/icon-512.png",
};

export interface BlogSection {
  heading: string;
  body: string[];
  tip?: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogContent {
  introduction: string;
  sections: BlogSection[];
  faq?: BlogFaq[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "IRS Updates" | "Small Business" | "Tax Deductions" | "Crypto & Investments" | "Retirement & Planning";
  tags: string[];
  author: BlogAuthor;
  date: string;
  readTime: string;
  imageUrl: string;
  trending: boolean;
  views: number;
  keyTakeaways: string[];
  seo: BlogSeo;
  content: BlogContent;
}
