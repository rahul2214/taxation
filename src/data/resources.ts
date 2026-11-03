/**
 * Content for the /resources hub: tax figures used by the calculators, filing dates and topic guides.
 *
 * Figures are for tax year 2026 (returns filed in 2027), from IRS Rev. Proc. 2025-32 and the SSA.
 * Update them together each autumn when the IRS publishes the next year's amounts.
 */

export const TAX_YEAR = 2026;

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh";

export const FILING_STATUSES: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "mfj", label: "Married filing jointly" },
  { value: "mfs", label: "Married filing separately" },
  { value: "hoh", label: "Head of household" },
];

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  mfj: 32_200,
  mfs: 16_100,
  hoh: 24_150,
};

const RATES = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];

/** Upper limit of each bracket's taxable income; the 37% bracket has no limit. */
const BRACKET_LIMITS: Record<FilingStatus, number[]> = {
  single: [12_400, 50_400, 105_700, 201_775, 256_225, 640_600],
  mfj: [24_800, 100_800, 211_400, 403_550, 512_450, 768_700],
  mfs: [12_400, 50_400, 105_700, 201_775, 256_225, 384_350],
  hoh: [17_700, 67_450, 105_700, 201_750, 256_200, 640_600],
};

export function incomeTax(taxableIncome: number, status: FilingStatus) {
  const limits = BRACKET_LIMITS[status];
  let tax = 0;
  let lower = 0;
  let marginal = RATES[0];
  for (let i = 0; i < RATES.length; i++) {
    const upper = limits[i] ?? Infinity;
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upper) - lower) * RATES[i];
    marginal = RATES[i];
    lower = upper;
  }
  return { tax, marginal };
}

export const CHILD_TAX_CREDIT = 2_200;
const CTC_PHASEOUT_START: Record<FilingStatus, number> = { single: 200_000, mfj: 400_000, mfs: 200_000, hoh: 200_000 };

/** Child tax credit after the income phase-out ($50 per $1,000, or part, above the threshold). */
export function childTaxCredit(children: number, income: number, status: FilingStatus) {
  const excess = Math.max(0, income - CTC_PHASEOUT_START[status]);
  return Math.max(0, children * CHILD_TAX_CREDIT - Math.ceil(excess / 1_000) * 50);
}

export const SOCIAL_SECURITY_WAGE_BASE = 184_500;

/** Self-employment tax on Schedule SE: 92.35% of net profit, 12.4% Social Security up to the wage base, 2.9% Medicare. */
export function selfEmploymentTax(netProfit: number, w2Wages = 0) {
  const base = netProfit * 0.9235;
  if (base < 400) return { base: 0, socialSecurity: 0, medicare: 0, total: 0, deductibleHalf: 0 };
  const socialSecurity = Math.min(base, Math.max(0, SOCIAL_SECURITY_WAGE_BASE - w2Wages)) * 0.124;
  const medicare = base * 0.029;
  const total = socialSecurity + medicare;
  return { base, socialSecurity, medicare, total, deductibleHalf: total / 2 };
}

/** Key federal dates for calendar-year filers. Dates already reflect weekend adjustments. */
export const KEY_DATES: { date: string; iso: string; title: string; who: string }[] = [
  { date: "Jan 15", iso: "2027-01-15", title: `Fourth-quarter ${TAX_YEAR} estimated tax payment`, who: "Self-employed, investors" },
  { date: "Feb 1", iso: "2027-02-01", title: "W-2s and 1099-NEC due to workers and the IRS", who: "Employers" },
  { date: "Mar 15", iso: "2027-03-15", title: "Partnership (1065) and S-Corp (1120-S) returns or extensions", who: "Businesses" },
  { date: "Apr 15", iso: "2027-04-15", title: `Individual (1040) and C-Corp (1120) returns; last day for ${TAX_YEAR} IRA and HSA contributions`, who: "Everyone" },
  { date: "Apr 15", iso: "2027-04-15", title: "First-quarter 2027 estimated tax payment", who: "Self-employed, investors" },
  { date: "Jun 15", iso: "2027-06-15", title: "Second-quarter 2027 estimated tax payment", who: "Self-employed, investors" },
  { date: "Sep 15", iso: "2027-09-15", title: "Extended 1065 and 1120-S returns; third-quarter estimate", who: "Businesses, self-employed" },
  { date: "Oct 15", iso: "2027-10-15", title: "Extended individual and C-Corp returns", who: "Anyone who extended" },
];

export type ResourceTopic = {
  id: string;
  title: string;
  description: string;
  questions: string[];
  articleSlugs: string[];
  service: { href: string; label: string };
};

export const RESOURCE_TOPICS: ResourceTopic[] = [
  {
    id: "taxes-101",
    title: "Taxes 101",
    description: "How a return comes together: filing status, brackets, and the difference between a deduction and a credit.",
    questions: ["Do I need to file this year?", "Which filing status should I use?", "Standard deduction or itemize?"],
    articleSlugs: ["irs-2026-tax-brackets-standard-deduction-updates"],
    service: { href: "/services/individual-tax-preparation", label: "Individual tax returns" },
  },
  {
    id: "life-changes",
    title: "Life changes",
    description: "Marriage, a new child, a move or a new job each change your tax picture. Here's what to check when they happen.",
    questions: ["Should we file jointly after getting married?", "What changes when I move states?", "Which credits come with a new child?"],
    articleSlugs: ["remote-work-state-taxes-multi-state-guide", "irs-2026-tax-brackets-standard-deduction-updates"],
    service: { href: "/services/individual-tax-preparation", label: "Individual tax returns" },
  },
  {
    id: "work",
    title: "Work and self-employment",
    description: "Freelancing, 1099 income, side businesses and working across state lines, including quarterly estimated payments.",
    questions: ["How much should I set aside for taxes?", "What can I deduct as a freelancer?", "Do I owe tax in the state my employer is in?"],
    articleSlugs: ["top-10-small-business-tax-deductions-checklist", "remote-work-state-taxes-multi-state-guide"],
    service: { href: "/services/small-business-tax-preparation", label: "Self-employed tax returns" },
  },
  {
    id: "deductions-credits",
    title: "Deductions and credits",
    description: "Which tax breaks still apply, who qualifies, and the records you need to claim them.",
    questions: ["Is the EV credit still available?", "What counts as a business expense?", "How does the SALT cap affect me?"],
    articleSlugs: ["top-10-small-business-tax-deductions-checklist", "ev-tax-credit-2026-qualification-checklist"],
    service: { href: "/services/tax-planning", label: "Tax planning" },
  },
  {
    id: "investing-retirement",
    title: "Investing and retirement",
    description: "Capital gains, crypto, Roth conversions and retirement accounts, and how each one is taxed.",
    questions: ["How is crypto taxed when I sell?", "Can I still contribute to a Roth?", "When do required distributions start?"],
    articleSlugs: ["crypto-capital-gains-tax-rules-2026", "backdoor-roth-ira-high-earner-guide"],
    service: { href: "/services/retirement-estate-tax-planning", label: "Retirement & estate planning" },
  },
  {
    id: "small-business",
    title: "Small business",
    description: "Choosing an entity, paying yourself, payroll and keeping books that are ready at tax time.",
    questions: ["LLC or S-Corp?", "How do I pay myself from my business?", "When do I need payroll?"],
    articleSlugs: ["llc-vs-scorp-tax-savings-guide", "top-10-small-business-tax-deductions-checklist"],
    service: { href: "/services/business-formation", label: "Business formation" },
  },
];
