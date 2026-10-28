import { BlogPost, POLARIS_TEAM_AUTHOR } from "./types";

export const irs2026TaxBracketsPost: BlogPost = {
  id: "1",
  slug: "irs-2026-tax-brackets-standard-deduction-updates",
  title: "IRS 2026 Tax Brackets & Standard Deduction: Key Changes You Need to Know",
  excerpt: "The IRS has released the 2026 federal income tax brackets and standard deduction, including changes from the One Big Beautiful Bill Act. Here is what moves, and what it means for your withholding.",
  category: "IRS Updates",
  tags: ["Standard Deduction", "Tax Brackets", "IRS Updates", "2026 Taxes", "Inflation Adjustments", "SALT Deduction"],
  author: POLARIS_TEAM_AUTHOR,
  date: "October 14, 2026",
  readTime: "6 min read",
  imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200&h=675",
  trending: true,
  views: 14820,
  seo: {
    metaTitle: "2026 Tax Brackets & Standard Deduction (IRS Figures)",
    metaDescription: "2026 federal tax brackets and standard deductions from IRS Rev. Proc. 2025-32. $16,100 single, $32,200 joint, $24,150 head of household; $40,400 SALT cap.",
    keywords: [
      "2026 tax brackets",
      "IRS standard deduction 2026",
      "2026 federal income tax rates",
      "IRS inflation adjustments 2026",
      "SALT cap 2026",
      "marginal tax rate 2026",
    ],
    publishedIso: "2026-10-14T08:00:00Z",
    modifiedIso: "2026-10-28T09:00:00Z",
  },
  keyTakeaways: [
    "The 2026 standard deduction is $16,100 for single filers, $32,200 for married couples filing jointly and $24,150 for heads of household.",
    "The seven rates (10% to 37%) are unchanged and now permanent; the income thresholds for each rate rose with inflation.",
    "The 37% rate starts above $640,600 of taxable income for single filers and $768,700 for joint filers.",
    "The state and local tax (SALT) deduction cap is $40,400 for 2026 ($20,200 if married filing separately), reduced for higher incomes but not below $10,000.",
  ],
  sources: [
    { label: "IRS: Tax inflation adjustments for tax year 2026 (IR-2025-103)", url: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill" },
    { label: "IRS Revenue Procedure 2025-32", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" },
    { label: "IRS: Federal income tax rates and brackets", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets" },
  ],
  content: {
    introduction: "Each autumn the IRS publishes inflation adjustments for the coming tax year. The 2026 figures also reflect the One Big Beautiful Bill Act, signed in July 2025, which made the current seven tax rates permanent and raised the cap on the state and local tax deduction. These are the numbers you will use for income earned in 2026, on the return you file in 2027.",
    sections: [
      {
        heading: "2026 standard deduction amounts",
        body: [
          "For tax year 2026 the standard deduction is $16,100 for single filers and married individuals filing separately, $32,200 for married couples filing jointly, and $24,150 for heads of household. For comparison, the 2025 amounts were $15,750, $31,500 and $23,625.",
          "If you are 65 or older, or blind, you also get an additional standard deduction amount. Separately, the One Big Beautiful Bill Act created a temporary deduction of up to $6,000 for people aged 65 and over for tax years 2025 through 2028, which phases out at higher incomes.",
        ],
        tip: "With the standard deduction this high, most households do better not itemizing. The higher SALT cap changes that math for some homeowners in high-tax states, so it is worth running both ways before you file.",
      },
      {
        heading: "2026 marginal tax rates and thresholds",
        body: [
          "The rates stay at 10%, 12%, 22%, 24%, 32%, 35% and 37%. For single filers in 2026 the 12% rate starts above $12,400 of taxable income, 22% above $50,400, 24% above $105,700, 32% above $201,775, 35% above $256,225 and 37% above $640,600.",
          "For married couples filing jointly the thresholds are $24,800, $100,800, $211,400, $403,550, $512,450 and $768,700 respectively. Remember these are marginal rates: only the income above each threshold is taxed at the higher rate.",
        ],
      },
      {
        heading: "The higher SALT deduction cap",
        body: [
          "If you itemize, the deduction for state and local income, sales and property taxes is capped at $40,400 for 2026 ($20,200 if married filing separately), up from the $10,000 cap that applied from 2018 through 2024.",
          "The cap is reduced for taxpayers with higher modified adjusted gross income, but it cannot fall below $10,000. If your income is near the phase-down range, the timing of income and property tax payments can make a real difference.",
        ],
      },
      {
        heading: "What to do before year-end",
        body: [
          "Check your withholding. If your pay changed this year, or you started freelance work, compare what has been withheld with what you expect to owe. Quarterly estimated payments may be needed to avoid an underpayment penalty.",
          "Contributions to a traditional 401(k) or a health savings account reduce taxable income for the year they are made, so December is a good time to confirm you have used the limits you intend to.",
        ],
        tip: "If you married, had a child or bought a home this year, submit an updated Form W-4 to your employer so next year's withholding reflects it.",
      },
    ],
    faq: [
      {
        question: "When do the 2026 tax brackets apply?",
        answer: "They apply to income earned from January 1 to December 31, 2026. You use them on the 2026 federal return you file in early 2027. Your 2025 return, filed in 2026, uses the 2025 brackets.",
      },
      {
        question: "Should I itemize or take the standard deduction in 2026?",
        answer: "Itemize only if your allowable itemized deductions (such as mortgage interest, state and local taxes up to the $40,400 cap, medical expenses above 7.5% of AGI and charitable gifts) add up to more than your standard deduction: $16,100 single, $32,200 married filing jointly or $24,150 head of household.",
      },
    ],
  },
};
