export * from "./types";
export { irs2026TaxBracketsPost } from "./irs-2026-tax-brackets";
export { llcVsScorpPost } from "./llc-vs-scorp";
export { smallBusinessDeductionsPost } from "./small-business-deductions";
export { cryptoCapitalGainsPost } from "./crypto-capital-gains";
export { backdoorRothIraPost } from "./backdoor-roth-ira";
export { remoteWorkStateTaxPost } from "./remote-work-state-tax";
export { evTaxCreditPost } from "./ev-tax-credit";

import { BlogPost } from "./types";
import { irs2026TaxBracketsPost } from "./irs-2026-tax-brackets";
import { llcVsScorpPost } from "./llc-vs-scorp";
import { smallBusinessDeductionsPost } from "./small-business-deductions";
import { cryptoCapitalGainsPost } from "./crypto-capital-gains";
import { backdoorRothIraPost } from "./backdoor-roth-ira";
import { remoteWorkStateTaxPost } from "./remote-work-state-tax";
import { evTaxCreditPost } from "./ev-tax-credit";

export const TRENDING_SEARCH_TERMS = [
  "Standard Deduction 2026",
  "LLC vs S-Corp",
  "EV Tax Credit",
  "Small Business Write-offs",
  "Remote Work State Tax",
  "Crypto Capital Gains",
  "Backdoor Roth IRA",
] as const;

export const BLOG_POSTS: BlogPost[] = [
  irs2026TaxBracketsPost,
  llcVsScorpPost,
  smallBusinessDeductionsPost,
  cryptoCapitalGainsPost,
  backdoorRothIraPost,
  remoteWorkStateTaxPost,
  evTaxCreditPost,
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getRelatedBlogs(currentSlug: string, limit: number = 3): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return BLOG_POSTS.slice(0, limit);

  // Prioritize same category, then trending, excluding current
  const others = BLOG_POSTS.filter((p) => p.slug !== currentSlug);
  const sameCategory = others.filter((p) => p.category === current.category);
  const differentCategory = others.filter((p) => p.category !== current.category);

  return [...sameCategory, ...differentCategory].slice(0, limit);
}
