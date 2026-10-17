import { BlogPost, POLARIS_TEAM_AUTHOR } from "./types";

export const evTaxCreditPost: BlogPost = {
  id: "7",
  slug: "ev-tax-credit-2026-qualification-checklist",
  title: "Electric Vehicle (EV) Clean Vehicle Tax Credit in 2026: Who Qualifies?",
  excerpt: "Everything you need to know about claiming up to $7,500 for new electric cars and $4,000 for used EVs, including instant point-of-sale dealer rebates and income caps.",
  category: "Tax Deductions",
  tags: ["EV Tax Credit", "Clean Energy", "Section 30D", "Deductions", "Car Buying", "Inflation Reduction Act"],
  author: POLARIS_TEAM_AUTHOR,
  date: "September 05, 2026",
  readTime: "6 min read",
  imageUrl: "https://images.unsplash.com/photo-1558441719-8b4bee567990?auto=format&fit=crop&q=80&w=1200&h=675",
  trending: false,
  views: 8200,
  seo: {
    metaTitle: "EV Tax Credit 2026: Qualified Vehicles & Point-of-Sale Rebate",
    metaDescription: "Complete guide to the up to $7,500 federal EV tax credit under Section 30D. Check MSRP caps, income limits, battery sourcing rules, and dealer point-of-sale rebates.",
    keywords: [
      "EV tax credit 2026",
      "federal electric vehicle rebate $7500",
      "Section 30D clean vehicle credit",
      "point of sale EV discount dealer",
      "EV tax credit income limits",
      "qualifying electric cars 2026",
      "used EV tax credit $4000"
    ],
    publishedIso: "2026-09-05T14:30:00Z",
    modifiedIso: "2026-10-11T12:00:00Z",
  },
  keyTakeaways: [
    "The Section 30D credit provides up to $7,500 for new clean vehicles and up to $4,000 (capped at 30% of sales price) for used EVs.",
    "Buyers can transfer the credit directly to participating registered dealerships for an immediate point-of-sale price reduction.",
    "Income thresholds: Modified AGI cannot exceed $300,000 for married couples, $225,000 for heads of household, and $150,000 for singles.",
    "Vehicle MSRP caps apply: Vans, SUVs, and pickup trucks must be under $80,000; all other passenger cars under $55,000.",
  ],
  content: {
    introduction: "Federal incentives for purchasing zero-emission vehicles have shifted into their most consumer-friendly phase yet. Instead of waiting until tax filing season to claim a non-refundable credit, car buyers can now receive the cash value of the federal EV tax credit directly at the dealership counter as an upfront discount.",
    sections: [
      {
        heading: "Point-of-Sale Transfer Mechanism",
        body: [
          "Under the IRS Energy Credits Online portal, eligible buyers can elect to transfer their full clean vehicle credit to registered licensed auto dealers.",
          "This means you can walk into a showroom, purchase an eligible $45,000 electric crossover, and immediately walk away with a $7,500 down payment reduction or cash rebate, financing only the net remaining balance.",
        ],
        tip: "Even if you choose the point-of-sale transfer, you must still file IRS Form 8936 when preparing your annual tax return. If your actual year-end AGI exceeds the legal statutory cap, you may be required to repay the credit back to the IRS.",
      },
      {
        heading: "Income Limits: The Lookback Provision",
        body: [
          "To qualify, your modified adjusted gross income (MAGI) cannot exceed: $300,000 for married couples filing jointly; $225,000 for heads of household; and $150,000 for all other filers.",
          "Fortunately, the IRS includes a favorable 'lookback provision.' You can qualify using either your MAGI from the year you take delivery of the vehicle, OR your MAGI from the immediately preceding calendar year, whichever is lower.",
        ],
      },
      {
        heading: "Critical Mineral & Battery Component Rules",
        body: [
          "The full $7,500 credit is split into two equal halves of $3,750: One half is contingent on meeting battery critical mineral extraction and processing criteria with US free-trade partners.",
          "The second $3,750 half depends on North American manufacturing percentages for battery components. Vehicles containing components sourced from 'Foreign Entities of Concern' (FEOC) are completely disqualified from receiving the credit.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I get a tax credit on a leased EV?",
        answer: "Yes! Leased EVs fall under Commercial Clean Vehicle rules (IRC Section 45W), which do not impose North American assembly or consumer income caps. Dealers often pass this full $7,500 credit directly into lower monthly lease payments.",
      },
      {
        question: "How do I check if my specific VIN qualifies?",
        answer: "Enter the vehicle identification number (VIN) on the official FuelEconomy.gov clean vehicle lookup tool before signing purchase documents, and obtain a Time-of-Sale report from the dealership.",
      },
    ],
  },
};
