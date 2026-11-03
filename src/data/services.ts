/**
 * Service catalogue. Drives the /services hub, each /services/[slug] landing page,
 * Service structured data, the sitemap and footer links.
 *
 * Keep claims here factual: describe what the firm does, not outcomes it can't promise.
 */

export type ServiceFaq = { question: string; answer: string };

export type ServiceAudience = "individual" | "business";

export type Service = {
  slug: string;
  /** Groups the /services hub into personal and business sections. */
  audience: ServiceAudience;
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
    audience: "individual",
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
    audience: "business",
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
    slug: "mnc-tax-filing",
    audience: "business",
    legacyAnchor: "mnc",
    name: "MNC tax filing",
    shortName: "MNC tax filing",
    forms: "Form 1120, 5471, 5472, 1118 and 8858",
    h1: "Tax filing for multinational companies and their US entities",
    metaTitle: "MNC Tax Filing for US Subsidiaries & Groups",
    metaDescription:
      "US corporate tax filing for multinational companies: Form 1120, 5471 and 5472 information returns, foreign tax credits, GILTI and transfer pricing documentation, prepared by CPAs.",
    keywords: ["MNC tax filing", "multinational company tax return", "US subsidiary tax filing", "Form 5471 preparation", "Form 5472 foreign-owned corporation", "transfer pricing documentation", "GILTI tax"],
    summary: "US returns and international information forms for multinational groups and foreign-owned US companies.",
    intro: [
      "Multinational groups have US filing obligations that go well beyond a single corporate return. We prepare the US federal and state returns for your subsidiaries, along with the international information returns that carry steep penalties when they are late or incomplete.",
      "One team coordinates with your group finance function and overseas advisers, so intercompany charges, foreign tax credits and related-party disclosures are consistent across every filing.",
    ],
    whoFor: [
      "Foreign-owned US subsidiaries and branches",
      "US parent companies with controlled foreign corporations",
      "Groups with intercompany services, loans or royalties",
      "Companies expanding into the US for the first time",
      "Finance teams that need a US filing partner for the group calendar",
    ],
    included: [
      "Federal Form 1120 and state corporate returns",
      "Form 5472 for 25% foreign-owned US corporations",
      "Form 5471 and 8858 for foreign subsidiaries and branches",
      "Foreign tax credit (Form 1118), GILTI and FDII calculations",
      "Review of intercompany pricing and documentation",
      "Multi-state nexus and apportionment review",
    ],
    documents: [
      "Group structure chart showing ownership percentages",
      "Trial balance and financial statements for each US entity",
      "Intercompany agreements and transaction summaries",
      "Financial statements for foreign subsidiaries, if you are a US parent",
      "Prior-year federal and state returns",
    ],
    steps: [
      { title: "Scope", body: "We map your entities and filing obligations and agree a fixed fee for the year." },
      { title: "Prepare", body: "Our team prepares the returns and information forms, working with your finance team and overseas advisers." },
      { title: "Review and file", body: "You review a filing summary for each entity, sign, and we file and track every deadline." },
    ],
    price: "Quoted",
    pricePeriod: "per group",
    priceNote: "Fees depend on the number of entities and international forms. You receive a fixed quote before work begins.",
    faqs: [
      {
        question: "Does a foreign-owned US company have to file Form 5472?",
        answer: "Generally yes, if a foreign person owns at least 25% of the US corporation, or if a foreign-owned single-member LLC has reportable transactions with its owner. The penalty for a missing or late form starts at $25,000, so it is worth confirming early.",
      },
      {
        question: "Can you work with our overseas accountants?",
        answer: "Yes. Most of our multinational clients have advisers in other countries. We agree who provides what, share a filing calendar, and keep intercompany figures consistent on both sides.",
      },
      {
        question: "Do you prepare transfer pricing studies?",
        answer: "We review intercompany pricing as part of the return and prepare documentation for smaller groups. For complex groups we coordinate with a dedicated transfer pricing specialist and reflect their study in the filings.",
      },
    ],
    relatedPostSlugs: ["remote-work-state-taxes-multi-state-guide", "llc-vs-scorp-tax-savings-guide"],
  },
  {
    slug: "irs-notice-audit-help",
    audience: "individual",
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
    audience: "business",
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
    audience: "business",
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
    slug: "payroll",
    audience: "business",
    legacyAnchor: "payroll",
    name: "Payroll services",
    shortName: "Payroll",
    forms: "Forms 941, 940, W-2 and state filings",
    h1: "Payroll services for small businesses and S-Corp owners",
    metaTitle: "Small Business Payroll Services",
    metaDescription:
      "Payroll run by the CPA firm that files your taxes: direct deposit, payroll tax deposits, Forms 941 and 940, W-2s and state filings, including owner salaries for S-Corps.",
    keywords: ["small business payroll services", "payroll for S-Corp owner", "outsourced payroll", "Form 941 filing", "payroll tax filing service"],
    summary: "Pay runs, payroll tax deposits and year-end W-2s, handled for you.",
    intro: [
      "Payroll mistakes are expensive: late deposits and missed quarterly filings carry penalties that build quickly. We run payroll on your schedule, make the federal and state tax deposits, and file the quarterly and annual returns that go with them.",
      "Because the same firm prepares your business return, wages, payroll taxes and owner compensation line up with your books and your K-1s, with no year-end reconciliation scramble.",
    ],
    whoFor: [
      "Small businesses hiring their first employee",
      "S-Corp owners who need to pay themselves a reasonable salary",
      "Employers with staff in more than one state",
      "Owners who want to stop running payroll themselves",
    ],
    included: [
      "Weekly, biweekly, semi-monthly or monthly pay runs with direct deposit",
      "Federal and state payroll tax calculations and deposits",
      "Quarterly Form 941 and state withholding returns",
      "Annual Form 940, W-2s and W-3",
      "State unemployment filings and new hire reporting",
      "Payroll reports tied out to your bookkeeping",
    ],
    documents: [
      "Your EIN and state employer account numbers",
      "Completed Form W-4 and state withholding form for each employee",
      "Pay rates, schedules and any benefit deductions",
      "Prior payroll reports, if you are switching providers mid-year",
    ],
    steps: [
      { title: "Set up", body: "We register any missing state accounts and load your employees and pay schedules." },
      { title: "Run payroll", body: "You approve each pay run; we pay your team and make the tax deposits." },
      { title: "File", body: "We file the quarterly and annual returns and send W-2s at year-end." },
    ],
    price: "Quoted",
    pricePeriod: "per month",
    priceNote: "Fees depend on the number of employees, pay frequency and states. You receive a fixed monthly quote before setup.",
    faqs: [
      {
        question: "I'm the only person in my S-Corp. Do I need payroll?",
        answer: "Generally yes. An S-Corp owner who works in the business should be paid a reasonable salary through payroll, with tax withheld, before taking distributions. We set this up and help you choose a defensible salary figure.",
      },
      {
        question: "Can you take over payroll partway through the year?",
        answer: "Yes. We import your year-to-date figures from your current provider so quarterly returns and W-2s are complete and correct for the whole year.",
      },
      {
        question: "Do you handle contractors as well as employees?",
        answer: "Contractors aren't paid through payroll, but we file their 1099-NEC forms through our bookkeeping service and can help you decide whether someone should be treated as an employee.",
      },
    ],
    relatedPostSlugs: ["llc-vs-scorp-tax-savings-guide", "top-10-small-business-tax-deductions-checklist"],
  },
  {
    slug: "business-formation",
    audience: "business",
    legacyAnchor: "formation",
    name: "Business formation",
    shortName: "Business formation",
    forms: "LLC or corporation, EIN, Form 2553",
    h1: "Business formation and entity selection",
    metaTitle: "Business Formation & Entity Selection Help",
    metaDescription:
      "Choose the right structure for your business with a CPA: LLC, partnership, S-Corp or C-Corp. We handle the state filing, EIN, S-Corp election and tax registrations.",
    keywords: ["business formation services", "LLC formation", "choose a business entity", "S-Corp election Form 2553", "EIN application", "sole proprietor vs LLC"],
    summary: "The right entity from day one, with the filings to set it up.",
    intro: [
      "The structure you choose decides how your profits are taxed, how you pay yourself and how much paperwork you file each year. We compare sole proprietorship, LLC, partnership, S-Corp and C-Corp treatment using your expected income, then recommend the one that fits.",
      "Once you decide, we prepare the state formation filing, obtain your EIN and make any tax elections, so the business is set up correctly before its first transaction.",
    ],
    whoFor: [
      "People starting a business or side business",
      "Sole proprietors whose profits have grown",
      "LLC owners considering an S-Corp election",
      "Partners bringing a new co-owner into the business",
      "Foreign founders setting up a US company",
    ],
    included: [
      "Entity comparison based on your projected income",
      "State formation filing for an LLC or corporation",
      "EIN application with the IRS",
      "S-Corp election on Form 2553, where it makes sense",
      "State tax registrations such as sales tax and withholding",
      "A first-year tax calendar for the new entity",
    ],
    documents: [
      "Owners' names, addresses and ownership percentages",
      "The state where the business will operate",
      "A rough estimate of first-year revenue and expenses",
      "Your current business registration, if converting an existing business",
    ],
    steps: [
      { title: "Compare", body: "We talk through your plans and model the tax under each structure." },
      { title: "Form", body: "We prepare the state filing and EIN application, and any tax elections." },
      { title: "Get ready", body: "You receive your formation documents, registrations and a calendar of filing dates." },
    ],
    price: "Quoted",
    pricePeriod: "one-time",
    priceNote: "State filing fees are passed through at cost. We don't draft operating or shareholder agreements; we work alongside your attorney when you need one.",
    faqs: [
      {
        question: "Should I form an LLC or a corporation?",
        answer: "Most small businesses start as an LLC because it is simple to run and flexible for tax. A C-Corp can suit companies planning to raise venture capital or reinvest most of their profit. We'll compare both with your numbers.",
      },
      {
        question: "When should an LLC elect S-Corp status?",
        answer: "Usually once profit is high enough that savings on self-employment tax outweigh the cost of running payroll and filing Form 1120-S. The election generally has to be filed within two months and 15 days of the start of the tax year it applies to.",
      },
      {
        question: "Can a non-US resident form a US company?",
        answer: "Yes. Foreign owners can form a US LLC or corporation and obtain an EIN. Foreign-owned companies often have extra reporting, such as Form 5472, which we set up from the start.",
      },
    ],
    relatedPostSlugs: ["llc-vs-scorp-tax-savings-guide", "top-10-small-business-tax-deductions-checklist"],
  },
  {
    slug: "retirement-estate-tax-planning",
    audience: "individual",
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

export const SERVICE_GROUPS: { audience: ServiceAudience; title: string; lede: string }[] = [
  {
    audience: "individual",
    title: "For individuals and families",
    lede: "Personal returns, letters from the IRS and the tax side of retirement.",
  },
  {
    audience: "business",
    title: "For businesses",
    lede: "What a business needs from its tax firm: formation, books, payroll, returns and planning.",
  },
];

/** Which service an article's readers most likely need next, by article category. */
export const SERVICE_FOR_BLOG_CATEGORY: Record<string, string> = {
  "IRS Updates": "individual-tax-preparation",
  "Small Business": "small-business-tax-preparation",
  "Tax Deductions": "small-business-tax-preparation",
  "Crypto & Investments": "individual-tax-preparation",
  "Retirement & Planning": "retirement-estate-tax-planning",
};
