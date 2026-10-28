/**
 * Service catalogue. Drives the /services hub, each /services/[slug] landing page,
 * Service structured data, the sitemap and footer links.
 *
 * Keep claims here factual: describe what the firm does, not outcomes it can't promise.
 */

export type ServiceFaq = { question: string; answer: string };

export type Service = {
  slug: string;
  /** Anchor id used by older /services#id links. */
  legacyAnchor: string;
  name: string;
  shortName: string;
  forms: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  summary: string;
  intro: string[];
  whoFor: string[];
  included: string[];
  documents: string[];
  steps: { title: string; body: string }[];
  price: string;
  pricePeriod: string;
  priceNote: string;
  faqs: ServiceFaq[];
  relatedPostSlugs: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "individual-tax-preparation",
    legacyAnchor: "personal",
    name: "Individual tax preparation",
    shortName: "Individual returns",
    forms: "Form 1040 and state returns",
    h1: "Individual tax return preparation by a CPA",
    metaTitle: "Individual Tax Preparation by a CPA",
    metaDescription:
      "Your Form 1040 and state returns prepared and reviewed by a licensed CPA. W-2s, investments, stock compensation, crypto and rentals. From $59, all 50 states.",
    keywords: ["individual tax preparation", "personal tax return preparation", "Form 1040 preparation", "CPA for personal taxes", "tax preparer for W-2 and 1099"],
    summary: "Form 1040 and state returns for employees, families and investors.",
    intro: [
      "Software asks you questions; a preparer asks the right ones. We prepare your federal Form 1040 and the state returns you need, compare the standard deduction with itemizing, and check the credits that apply to your household.",
      "You send documents through the secure portal, a licensed preparer builds the return, and you see a plain-English summary before anything is filed.",
    ],
    whoFor: [
      "Employees with one or more W-2s",
      "Investors with brokerage statements, dividends or crypto",
      "People with stock options or RSUs",
      "Landlords with one or two rental properties",
      "Anyone who moved states during the year",
    ],
    included: [
      "Federal Form 1040 and one state return",
      "Standard vs. itemized deduction comparison",
      "Child, education and dependent care credits where you qualify",
      "Review by a licensed CPA before filing",
      "E-filing with the IRS and your state",
      "Help with any IRS letter about a return we prepared",
    ],
    documents: [
      "Photo ID for you and your spouse",
      "W-2s and any 1099 forms (NEC, INT, DIV, B, R, K)",
      "Form 1098 if you paid mortgage interest",
      "Brokerage and crypto year-end statements",
      "Last year's return, if we didn't prepare it",
    ],
    steps: [
      { title: "Upload", body: "Create an account and upload your documents. We'll tell you if anything is missing." },
      { title: "Prepare", body: "Your preparer builds the return and contacts you if a choice needs your input." },
      { title: "Review and file", body: "You review a summary, sign Form 8879 electronically, and we e-file." },
    ],
    price: "$59",
    pricePeriod: "simple return",
    priceNote: "Itemized returns (Schedule A) $129. Each additional state $39. You see the price before we start.",
    faqs: [
      {
        question: "How long does an individual return take?",
        answer: "A straightforward return is usually ready for your review within two to three business days of receiving all your documents. Returns with investments, rentals or several states can take longer, and we'll tell you up front.",
      },
      {
        question: "Can you file my state return too?",
        answer: "Yes. One state return is included. If you lived or worked in more than one state, each additional state return is $39.",
      },
      {
        question: "What if I get a letter from the IRS later?",
        answer: "Send us a copy through the portal. If it concerns a return we prepared, we'll explain it and help you respond at no extra charge.",
      },
    ],
    relatedPostSlugs: ["irs-2026-tax-brackets-standard-deduction-updates", "crypto-capital-gains-tax-rules-2026", "remote-work-state-taxes-multi-state-guide"],
  },
  {
    slug: "small-business-tax-preparation",
    legacyAnchor: "business",
    name: "Small business tax preparation",
    shortName: "Small business taxes",
    forms: "Schedule C, Form 1065, Form 1120-S",
    h1: "Small business and self-employed tax preparation",
    metaTitle: "Small Business Tax Preparation Services",
    metaDescription:
      "Tax returns for freelancers, LLCs, partnerships and S-Corps: Schedule C, Form 1065 and 1120-S with K-1s, prepared by a CPA. From $199, price agreed up front.",
    keywords: ["small business tax preparation", "self-employed tax preparation", "LLC tax return", "S-Corp tax return preparation", "Form 1120-S preparation", "partnership tax return 1065"],
    summary: "Schedule C, partnership and S-Corp returns for owners and freelancers.",
    intro: [
      "Business and personal taxes affect each other, so we prepare them together. One CPA handles your Schedule C or entity return and your personal return, which means deductions, K-1s and estimated payments line up.",
      "If you are deciding whether an S-Corp election makes sense, we'll run the numbers with you before you file anything with the IRS.",
    ],
    whoFor: [
      "Freelancers and independent contractors paid on 1099s",
      "Single-member LLCs filing on Schedule C",
      "Multi-member LLCs and partnerships filing Form 1065",
      "S-Corporations filing Form 1120-S",
      "Owners thinking about an S-Corp election",
    ],
    included: [
      "Schedule C, Form 1065 or Form 1120-S, with K-1s",
      "Your personal Form 1040, prepared alongside",
      "Qualified business income (Section 199A) deduction",
      "Depreciation, including Section 179 where it applies",
      "Quarterly estimated tax vouchers for next year",
      "A named CPA you can contact during the year",
    ],
    documents: [
      "Profit and loss statement and balance sheet, or your bookkeeping file",
      "Bank and credit card statements for the year",
      "1099-NEC and 1099-K forms you received",
      "Payroll reports, if you run payroll",
      "Records of equipment or vehicles bought during the year",
    ],
    steps: [
      { title: "Scope", body: "We confirm which returns you need and agree a fixed price before starting." },
      { title: "Prepare", body: "Your CPA prepares the business and personal returns and flags anything that needs a decision." },
      { title: "File and plan", body: "We e-file, then set up estimated payments so next year has no surprises." },
    ],
    price: "$199",
    pricePeriod: "Schedule C",
    priceNote: "Form 1120-S or Form 1065 from $499. The quote is fixed once we've seen your records.",
    faqs: [
      {
        question: "Should my LLC elect S-Corp status?",
        answer: "It depends mainly on your profit and what a reasonable salary would be for your role. Once profit is high enough, paying part of it as salary and the rest as distributions can lower self-employment tax, but payroll and an extra return add cost. We'll model both before you decide.",
      },
      {
        question: "Do you need my books to be finished?",
        answer: "It helps. If your bookkeeping isn't up to date, we can clean it up first through our bookkeeping service and quote that separately.",
      },
      {
        question: "Can you help with quarterly estimated taxes?",
        answer: "Yes. Every business return includes estimated payment vouchers for the following year, based on what your return shows.",
      },
    ],
    relatedPostSlugs: ["llc-vs-scorp-tax-savings-guide", "top-10-small-business-tax-deductions-checklist"],
  },
  {
    slug: "irs-notice-audit-help",
    legacyAnchor: "audit",
    name: "IRS notice and audit help",
    shortName: "IRS notices & audits",
    forms: "CP2000, CP504, Form 2848",
    h1: "Help with IRS notices and audits",
    metaTitle: "IRS Notice & Audit Help (CP2000, CP504)",
    metaDescription:
      "Received a CP2000, CP504 or audit letter? A CPA or Enrolled Agent reviews it, explains your options and can deal with the IRS for you under Form 2848.",
    keywords: ["IRS notice help", "CP2000 response", "IRS audit representation", "CP504 notice", "penalty abatement", "tax resolution services"],
    summary: "Responses to IRS and state letters, audits and penalty relief.",
    intro: [
      "An IRS letter usually has a response deadline, so the first step is understanding exactly what it says. Send us a photo or scan and we'll tell you what the notice means, whether you agree with it, and what responding will involve.",
      "With your authorization on Form 2848, a CPA or Enrolled Agent can speak with the IRS on your behalf, so you don't have to handle the calls yourself.",
    ],
    whoFor: [
      "Anyone who has received a CP2000 proposed adjustment",
      "Taxpayers with a balance due notice such as CP14 or CP504",
      "People selected for a correspondence or office audit",
      "Taxpayers who want to request penalty relief",
      "Anyone who needs to set up a payment plan",
    ],
    included: [
      "Review of the notice and the return it refers to",
      "A written explanation of your options",
      "Preparing and sending the response and supporting documents",
      "Representation under Form 2848 where needed",
      "First-time penalty abatement requests where you qualify",
      "Installment agreement setup",
    ],
    documents: [
      "The notice or letter, all pages",
      "The tax return for the year in question",
      "Any documents that support your position (1099s, receipts, statements)",
    ],
    steps: [
      { title: "Send the letter", body: "Upload the notice. We check the deadline first." },
      { title: "Get options", body: "We explain what the IRS is asking for and what we'd recommend, with a quote." },
      { title: "Respond", body: "We prepare the response and, if you authorize us, handle contact with the IRS." },
    ],
    price: "Quoted",
    pricePeriod: "per case",
    priceNote: "Help with letters about a return we prepared is included at no charge. For other returns we quote after reviewing the notice.",
    faqs: [
      {
        question: "Is a CP2000 the same as an audit?",
        answer: "No. A CP2000 is a proposed adjustment generated when income reported to the IRS doesn't match your return. You can agree, partly agree or disagree with supporting documents. It should be answered by the date on the notice.",
      },
      {
        question: "Can you talk to the IRS for me?",
        answer: "Yes. Once you sign Form 2848, a CPA or Enrolled Agent at our firm can represent you and speak with the IRS directly about the matters and years listed on the form.",
      },
    ],
    relatedPostSlugs: ["crypto-capital-gains-tax-rules-2026", "irs-2026-tax-brackets-standard-deduction-updates"],
  },
  {
    slug: "tax-planning",
    legacyAnchor: "consulting",
    name: "Tax planning",
    shortName: "Tax planning",
    forms: "Year-round",
    h1: "Tax planning for business owners and high earners",
    metaTitle: "Tax Planning Services for Owners & High Earners",
    metaDescription:
      "Plan before the year ends: entity structure, salary vs. distributions, equity compensation, multi-state income and capital gains. Fixed-fee CPA tax planning.",
    keywords: ["tax planning services", "tax planning for business owners", "high income tax planning", "tax planning for founders", "equity compensation tax planning"],
    summary: "Planning on structure, timing and state exposure before the year closes.",
    intro: [
      "Most tax savings come from decisions made during the year, not from the return itself. Planning means looking at what you expect to earn and spend, and choosing structure and timing deliberately.",
      "We meet with you, model the options, and give you a written plan with the actions, dates and expected effect, so you can decide what to do.",
    ],
    whoFor: [
      "Business owners deciding between an LLC and an S-Corp",
      "Founders and employees with stock options, RSUs or QSBS",
      "High earners with income in more than one state",
      "Anyone planning a large sale of stock, crypto or property",
    ],
    included: [
      "Projection of this year's federal and state tax",
      "Entity and salary/distribution analysis for owners",
      "Timing of income, deductions and retirement contributions",
      "Equity compensation and capital gains planning",
      "Multi-state residency and nexus review",
      "A written summary with the recommended actions",
    ],
    documents: [
      "Last year's tax returns",
      "Year-to-date profit and loss, or recent pay stubs",
      "Equity grant and vesting statements, if any",
      "Details of any planned sale, move or major purchase",
    ],
    steps: [
      { title: "Discovery call", body: "We learn your situation and agree the scope and fee." },
      { title: "Model", body: "We project your tax under the options that matter to you." },
      { title: "Plan", body: "You get written recommendations and a follow-up call to go through them." },
    ],
    price: "Quoted",
    pricePeriod: "per engagement",
    priceNote: "Ongoing advisory for growing companies starts at $2,500 per month and includes entity returns.",
    faqs: [
      {
        question: "When is the best time to plan?",
        answer: "As early in the year as possible, and in any case before year-end. Many options, such as retirement contributions, timing of income or an S-Corp election for the next year, have deadlines.",
      },
      {
        question: "Is tax planning only for businesses?",
        answer: "No. Individuals with stock compensation, rental property, a planned sale of investments or income in several states often benefit as much as business owners.",
      },
    ],
    relatedPostSlugs: ["llc-vs-scorp-tax-savings-guide", "backdoor-roth-ira-high-earner-guide", "remote-work-state-taxes-multi-state-guide"],
  },
  {
    slug: "bookkeeping",
    legacyAnchor: "bookkeeping",
    name: "Monthly bookkeeping",
    shortName: "Bookkeeping",
    forms: "P&L and balance sheet",
    h1: "Monthly bookkeeping for small businesses",
    metaTitle: "Small Business Bookkeeping Services",
    metaDescription:
      "Monthly bookkeeping by the team that prepares your taxes: reconciliations, a monthly P&L and balance sheet, and books ready for your return. From $250 a month.",
    keywords: ["small business bookkeeping services", "monthly bookkeeping", "bookkeeping for LLC", "outsourced bookkeeping"],
    summary: "Reconciled books every month, ready for tax time.",
    intro: [
      "Clean books make tax season a matter of hours, and they give you numbers you can actually run the business on. We reconcile your accounts each month and send you a profit and loss statement and balance sheet.",
      "Because the same firm prepares your return, year-end is a hand-off inside one team rather than a scramble.",
    ],
    whoFor: [
      "Owners who are behind on their books",
      "Businesses that need reliable monthly numbers for lenders or investors",
      "S-Corps and partnerships that need clean books for K-1s",
    ],
    included: [
      "Monthly bank and credit card reconciliations",
      "Monthly profit and loss statement and balance sheet",
      "Payroll tie-out",
      "1099 filing for your contractors",
      "Year-end package handed straight to your tax preparer",
    ],
    documents: [
      "Read-only access to business bank and card accounts, or statements",
      "Access to your accounting software, if you use one",
      "Payroll reports",
    ],
    steps: [
      { title: "Set up", body: "We connect to your accounts and agree a chart of accounts." },
      { title: "Monthly close", body: "We reconcile and categorize, and ask you about anything unclear." },
      { title: "Report", body: "You receive your monthly statements and a short note on anything unusual." },
    ],
    price: "$250",
    pricePeriod: "per month",
    priceNote: "Catch-up work for past months is quoted separately.",
    faqs: [
      {
        question: "Can you catch up on past months?",
        answer: "Yes. We quote catch-up work separately based on how many months and accounts are involved, then move you onto the monthly service.",
      },
      {
        question: "Do I need to use specific software?",
        answer: "No. We work with common accounting software, and can set one up for you if you don't have it.",
      },
    ],
    relatedPostSlugs: ["top-10-small-business-tax-deductions-checklist", "llc-vs-scorp-tax-savings-guide"],
  },
  {
    slug: "retirement-estate-tax-planning",
    legacyAnchor: "retirement",
    name: "Retirement and estate tax planning",
    shortName: "Retirement & estate",
    forms: "IRA, RMD, gifting",
    h1: "Retirement and estate tax planning",
    metaTitle: "Retirement & Estate Tax Planning",
    metaDescription:
      "Help with the tax side of retirement: Roth conversions, required minimum distributions, Social Security tax and gifting, from the CPA who files your return.",
    keywords: ["retirement tax planning", "Roth conversion planning", "required minimum distribution help", "estate tax planning CPA"],
    summary: "Roth conversions, distributions and gifting, planned for tax.",
    intro: [
      "Retirement changes where your income comes from, and with it your tax. We help you decide when to draw from which accounts, whether Roth conversions make sense, and how gifts and inheritances will be taxed.",
      "We work alongside your financial adviser or estate attorney where you have one. We don't sell investments or insurance.",
    ],
    whoFor: [
      "People approaching or in retirement",
      "Anyone considering a Roth conversion",
      "Retirees taking required minimum distributions",
      "Families planning gifts or an inheritance",
    ],
    included: [
      "Projection of tax across retirement income sources",
      "Roth conversion analysis",
      "Required minimum distribution planning",
      "How Social Security benefits will be taxed",
      "Gift tax return (Form 709) preparation where needed",
    ],
    documents: [
      "Recent tax returns",
      "Year-end statements for IRAs, 401(k)s and brokerage accounts",
      "Social Security benefit statement",
      "Any existing estate documents, if relevant",
    ],
    steps: [
      { title: "Review", body: "We look at your accounts, income and goals." },
      { title: "Model", body: "We compare scenarios such as conversion amounts and withdrawal order." },
      { title: "Recommend", body: "You get written recommendations you can share with your adviser." },
    ],
    price: "Quoted",
    pricePeriod: "per engagement",
    priceNote: "Fixed fee agreed after the first call.",
    faqs: [
      {
        question: "Do you manage investments?",
        answer: "No. We advise on the tax side only and are happy to coordinate with your financial adviser.",
      },
      {
        question: "Is a Roth conversion right for me?",
        answer: "It depends on your current and expected future tax rates, how you'll pay the tax on the conversion, and your time horizon. We model the trade-off with your actual numbers before you decide.",
      },
    ],
    relatedPostSlugs: ["backdoor-roth-ira-high-earner-guide"],
  },
];

export const getServiceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);

/** Which service an article's readers most likely need next, by article category. */
export const SERVICE_FOR_BLOG_CATEGORY: Record<string, string> = {
  "IRS Updates": "individual-tax-preparation",
  "Small Business": "small-business-tax-preparation",
  "Tax Deductions": "small-business-tax-preparation",
  "Crypto & Investments": "individual-tax-preparation",
  "Retirement & Planning": "retirement-estate-tax-planning",
};
