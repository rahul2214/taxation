import { BlogPost, POLARIS_TEAM_AUTHOR } from "./types";

// URL kept from the original article so existing links and rankings carry over.
export const evTaxCreditPost: BlogPost = {
  id: "7",
  slug: "ev-tax-credit-2026-qualification-checklist",
  title: "The Federal EV Tax Credit Has Ended: What It Means If You Bought or Leased an EV",
  excerpt: "The federal clean vehicle credits ended for vehicles acquired after September 30, 2025. Here is who can still claim one on their return, and what to check if you bought close to the deadline.",
  category: "Tax Deductions",
  tags: ["EV Tax Credit", "Clean Vehicle Credit", "Section 30D", "Form 8936", "One Big Beautiful Bill"],
  author: POLARIS_TEAM_AUTHOR,
  date: "September 05, 2026",
  readTime: "5 min read",
  imageUrl: "https://images.unsplash.com/photo-1558441719-8b4bee567990?auto=format&fit=crop&q=80&w=1200&h=675",
  trending: false,
  views: 8200,
  seo: {
    metaTitle: "EV Tax Credit Ended Sept 30, 2025: Who Can Still Claim It",
    metaDescription: "The federal EV tax credits (30D, 25E, 45W) ended for vehicles acquired after September 30, 2025. See who can still claim the credit and how Form 8936 works.",
    keywords: [
      "EV tax credit 2026",
      "EV tax credit ended",
      "clean vehicle credit September 30 2025",
      "Section 30D credit",
      "used EV tax credit",
      "Form 8936",
    ],
    publishedIso: "2026-09-05T14:30:00Z",
    modifiedIso: "2026-10-28T09:00:00Z",
  },
  keyTakeaways: [
    "The new clean vehicle credit (Section 30D), the used clean vehicle credit (25E) and the commercial clean vehicle credit (45W) are not available for vehicles acquired after September 30, 2025.",
    "\"Acquired\" means you signed a written binding contract and made a payment, including a nominal down payment or a trade-in, on or before September 30, 2025.",
    "If you acquired the vehicle by that date, you can still claim the credit when you take delivery, even if delivery happened later.",
    "Claims are made on Form 8936 with your return, including when the credit was transferred to the dealer at the time of sale.",
  ],
  sources: [
    { label: "IRS: Clean vehicle tax credits", url: "https://www.irs.gov/clean-vehicle-tax-credits" },
    { label: "IRS: FAQs on the One Big Beautiful Bill changes to clean vehicle credits", url: "https://www.irs.gov/newsroom/faqs-for-modification-of-sections-25c-25d-25e-30c-30d-45l-45w-and-179d-under-public-law-119-21-139-stat-72-july-4-2025-commonly-known-as-the-one-big-beautiful-bill-obbb" },
    { label: "IRS: Instructions for Form 8936", url: "https://www.irs.gov/instructions/i8936" },
  ],
  content: {
    introduction: "For several years, buyers of qualifying electric and plug-in hybrid vehicles could claim a federal credit of up to $7,500 for a new vehicle or up to $4,000 for a used one, often as an instant discount at the dealer. The One Big Beautiful Bill Act, signed in July 2025, ended those credits for vehicles acquired after September 30, 2025. If you are shopping for an EV now, there is no federal credit to plan around. If you bought one in 2025, the details below decide whether you can still claim it.",
    sections: [
      {
        heading: "Which credits ended, and when",
        body: [
          "Three credits are affected: the new clean vehicle credit under Section 30D, the previously owned (used) clean vehicle credit under Section 25E, and the commercial clean vehicle credit under Section 45W, which is the credit that lessors used to reduce lease payments.",
          "None of them is allowed for a vehicle acquired after September 30, 2025. There is no phase-down period: a vehicle acquired on October 1, 2025 does not qualify.",
        ],
      },
      {
        heading: "What counts as \"acquired\"",
        body: [
          "The IRS treats a vehicle as acquired on the date you entered into a written binding contract and made a payment. A nominal down payment or a vehicle trade-in counts as a payment.",
          "That means a buyer who signed a contract and paid a deposit on or before September 30, 2025 can still claim the credit when the vehicle is placed in service, that is, when they take possession, even if delivery happened later in 2025 or in 2026. Keep the dated contract and proof of the payment with your tax records.",
        ],
        tip: "If you signed near the deadline, check the contract date and the date of your deposit or trade-in before you file. Those two dates, not the delivery date, decide whether you qualify.",
      },
      {
        heading: "Claiming the credit on your return",
        body: [
          "Eligible buyers claim the credit on Form 8936, filed with their federal return for the year they took delivery. This applies even if you transferred the credit to the dealer and received it as a discount at the time of sale.",
          "The income limits that applied before still apply to qualifying vehicles. If your income for the year turns out to be above the limit, a credit you received at the dealer may need to be repaid on your return.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I get a federal tax credit for an EV I buy in 2026?",
        answer: "No. The federal clean vehicle credits are not available for vehicles acquired after September 30, 2025. Some states and utilities run their own incentives, so check your state's energy or revenue department.",
      },
      {
        question: "I signed a contract in September 2025 but took delivery later. Can I still claim it?",
        answer: "Yes, if you entered into a written binding contract and made a payment on or before September 30, 2025, and the vehicle otherwise qualifies. You claim the credit for the year you took delivery, using Form 8936.",
      },
    ],
  },
};
