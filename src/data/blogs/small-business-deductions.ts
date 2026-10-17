import { BlogPost } from "./types";

export const smallBusinessDeductionsPost: BlogPost = {
  id: "3",
  slug: "top-10-small-business-tax-deductions-checklist",
  title: "Top 10 Tax Deductions Every Small Business Owner and Freelancer Should Take",
  excerpt: "From home office deductions and Section 179 equipment depreciation to cell phone usage and travel, make sure you never leave money on the table this tax season.",
  category: "Tax Deductions",
  tags: ["Deductions", "Write-offs", "Small Business", "Section 179", "Home Office", "Mileage"],
  author: {
    name: "Marcus Vance, CPA",
    role: "Senior Tax Strategist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
  },
  date: "October 06, 2026",
  readTime: "7 min read",
  imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200&h=675",
  trending: true,
  views: 19800,
  seo: {
    metaTitle: "Top 10 Small Business Tax Deductions (2026 Checklist)",
    metaDescription: "Maximize your tax write-offs with this 2026 small business tax deduction checklist. Covers home office, Section 179 vehicle depreciation, mileage, and meals.",
    keywords: [
      "small business tax deductions 2026",
      "business expense write offs",
      "Section 179 depreciation limit",
      "home office tax deduction simplified",
      "business mileage rate 2026",
      "Schedule C deductions",
      "tax write off checklist"
    ],
    publishedIso: "2026-10-06T10:30:00Z",
    modifiedIso: "2026-10-16T14:00:00Z",
  },
  keyTakeaways: [
    "The home office deduction can be claimed using the simplified $5/sq ft method or actual actual-cost method.",
    "Section 179 allows immediate 100% write-offs on qualifying business hardware, software, and heavy vehicle purchases.",
    "Business mileage requires contemporaneous GPS tracking logs showing date, mileage, destination, and business purpose.",
    "Qualified business meals with clients remain 50% deductible if ordinary and necessary to business operations.",
  ],
  content: {
    introduction: "Overpaying on federal income tax is one of the most common drains on cash flow for early-stage companies and independent professionals. Fortunately, the Internal Revenue Code allows legitimate business owners to deduct all 'ordinary and necessary' expenses incurred in the operation of their trade.",
    sections: [
      {
        heading: "1. The Home Office Deduction: Simplified vs. Actual",
        body: [
          "If you utilize a dedicated area of your home exclusively and regularly as your principal place of business, you can deduct a percentage of your rent or mortgage interest, utilities, property insurance, and repairs.",
          "The IRS offers two calculation paths: the simplified option ($5 per square foot up to 300 sq. ft., maximum $1,500) or the actual expenses method, which often delivers much larger savings for homeowners in high-cost areas.",
        ],
        tip: "The space MUST be used exclusively for business. A desk in the corner of a child's playroom will not withstand an audit, but a spare bedroom used solely for client work qualifies.",
      },
      {
        heading: "2. Vehicle Mileage and Transportation",
        body: [
          "Driving to client meetings, job sites, and supply vendors is fully deductible. You can either use the standard mileage rate or track total operating expenses (gas, insurance, maintenance, depreciation) multiplied by your business use percentage.",
          "Keep an electronic mileage tracking log. Audits routinely disallow mileage claims that rely on year-end estimates rather than contemporaneous digital logs.",
        ],
      },
      {
        heading: "3. Section 179 First-Year Equipment Expensing",
        body: [
          "Under Section 179, businesses can deduct the full purchase price of qualifying machinery, computers, servers, office furniture, and work vehicles placed into service during the tax year, rather than capitalizing and depreciating them over 5 to 7 years.",
          "For 2026, the Section 179 deduction limit allows full write-offs on millions of dollars of qualifying business equipment, providing massive upfront tax relief.",
        ],
      },
      {
        heading: "4. Health Insurance Premiums for the Self-Employed",
        body: [
          "Sole proprietors, partners, and >2% S-Corp shareholders who carry their own health insurance can deduct 100% of their medical, dental, and qualifying long-term care insurance premiums as an above-the-line deduction, lowering total AGI.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I write off business clothing or suits?",
        answer: "Generally no. The IRS only permits deductions for protective gear, uniforms with company logos, or attire not suitable for everyday wear. Standard suits and professional business clothes are considered personal expenses.",
      },
      {
        question: "What receipts do I need to keep?",
        answer: "Retain digital copies of all receipts, bank statements, and invoices for at least three to six years. Credit card statements alone are often insufficient during an IRS audit without supporting itemized item receipts.",
      },
    ],
  },
};
