import { BlogPost, POLARIS_TEAM_AUTHOR } from "./types";

export const remoteWorkStateTaxPost: BlogPost = {
  id: "6",
  slug: "remote-work-state-taxes-multi-state-guide",
  title: "Working Remotely Across State Lines: How to Handle Multi-State Tax Compliance",
  excerpt: "Remote workers and digital nomads face aggressive state tax audits. Learn how residency rules, convenience of employer laws, and reciprocity agreements affect you.",
  category: "IRS Updates",
  tags: ["Remote Work", "State Taxes", "Telecommuting", "Multi-State", "Convenience Rule", "Withholding"],
  author: POLARIS_TEAM_AUTHOR,
  date: "September 12, 2026",
  readTime: "8 min read",
  imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200&h=675",
  trending: false,
  views: 9400,
  seo: {
    metaTitle: "Remote Work State Taxes 2026: Multi-State Filing Guide",
    metaDescription: "Do you work remotely in a different state? Navigate convenience of employer rules, reciprocity agreements, non-resident returns, and avoid double taxation.",
    keywords: [
      "remote work state taxes",
      "multi state tax filing 2026",
      "convenience of employer rule",
      "state tax reciprocity agreements",
      "non resident state tax return",
      "telecommuting tax laws",
      "state tax residency 183 day rule"
    ],
    publishedIso: "2026-09-12T13:15:00Z",
    modifiedIso: "2026-10-12T09:40:00Z",
  },
  keyTakeaways: [
    "You generally owe state income taxes in the state where you physically perform your daily work.",
    "The 183-day rule establishes statutory tax residency in many states, subjecting worldwide income to state taxation.",
    "Beware the 'Convenience of the Employer' rule in states like New York, Pennsylvania, and Nebraska.",
    "Reciprocity agreements between neighboring states eliminate the need to file multiple state returns.",
  ],
  content: {
    introduction: "The expansion of remote and hybrid work has opened incredible geographic flexibility for workers, but it has created a multi-state taxation minefield. State revenue departments have stepped up automated tracking, cross-referencing cell phone location records, corporate IP logins, and wage reports to capture remote income.",
    sections: [
      {
        heading: "Physical Presence vs. Employer Headquarters",
        body: [
          "As a general principle of state tax law, you owe income tax to the state where you physically sit while performing the service—NOT necessarily where your employer's corporate headquarters is incorporated.",
          "If your employer is based in California or New York but you live and work full-time from Texas or Florida, you are generally subject to Texas or Florida rules (neither of which levies individual state income taxes).",
        ],
      },
      {
        heading: "The Dreaded 'Convenience of the Employer' Rule",
        body: [
          "Several states enforce aggressive 'convenience of the employer' rules, most notably New York, Nebraska, Pennsylvania, and Delaware.",
          "Under this rule, if your primary office is located in one of these states, but you work remotely from another state for your own personal convenience rather than out of strict business necessity, that state still taxes 100% of your wages.",
          "This can lead to severe double taxation unless your home state offers a comprehensive resident tax credit to offset the taxes paid to the employer's state.",
        ],
        tip: "If you work for a New York company but live elsewhere, ask your employer to document a bona fide business necessity for your remote location, such as needing to serve clients in your local territory.",
      },
      {
        heading: "State Reciprocity Agreements",
        body: [
          "To ease administrative burdens, many neighboring states maintain reciprocal tax agreements. For example, Virginia, Maryland, and Washington D.C. have reciprocity; workers pay income tax solely to their home state.",
          "Always file Form W-4 (or state equivalent non-resident exemption certificate) with your payroll team so taxes are withheld for the correct state from the first paycheck.",
        ],
      },
    ],
    faq: [
      {
        question: "How long can I work from another state on vacation before owing taxes?",
        answer: "Many states have a 'first day' rule where taxes kick in immediately, while others have thresholds ranging from 14 to 60 days. Staying more than 183 days typically triggers full statutory residency.",
      },
      {
        question: "Do I have to file two state tax returns?",
        answer: "Yes, if you earned income in one state while residing in another (without reciprocity), you typically file a Non-Resident Return for the work state, and a Resident Return for your home state with a credit for taxes paid.",
      },
    ],
  },
};
