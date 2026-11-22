/**
 * Short, page-specific FAQ sets rendered by <PageFaq> on public pages.
 * The full list lives on /faq; service and article pages carry their own FAQs.
 */

type Faq = { question: string; answer: string };

export const PAGE_FAQS: Record<string, Faq[]> = {
  home: [
    {
      question: "How much does tax preparation cost?",
      answer: "Simple individual returns start at $99 (Basic Filing), itemized returns at $199 (Standard Filing), self-employed Schedule C returns at $349 (Premium Filing) and S-Corp or partnership returns at $499. You see a fixed price before any work begins.",
    },
    {
      question: "Do you file returns for clients outside New York?",
      answer: "Yes. Our CPAs and Enrolled Agents prepare federal returns and state returns for clients in all 50 states, entirely online.",
    },
    {
      question: "Do you handle multinational companies?",
      answer: "Yes. Our MNC tax filing service covers US corporate returns and international information forms such as Form 5471 and 5472 for foreign-owned subsidiaries and US parents with overseas entities.",
    },
    {
      question: "Is the Tax Compass a tax calculator?",
      answer: "No. It suggests a place to start based on two questions. It does not calculate tax or determine eligibility, and it never asks for sensitive information.",
    },
  ],
  services: [
    {
      question: "Which service is right for me?",
      answer: "Use the Tax Compass on our home page or book a free 15-minute call. We'll point you to the right service and quote a fixed price before you commit.",
    },
    {
      question: "Can one CPA handle my personal and business returns?",
      answer: "Yes. Preparing them together keeps K-1s, deductions and estimated payments consistent, and you have one person to contact.",
    },
    {
      question: "Are prices fixed?",
      answer: "Yes. Every engagement has a price agreed before work starts. If your situation changes, we tell you before the price does.",
    },
  ],
  about: [
    {
      question: "Who prepares my return?",
      answer: "A licensed CPA or Enrolled Agent owns your file from start to finish, and every return is reviewed before it is filed.",
    },
    {
      question: "Where is your office?",
      answer: "Our office is at 440 Park Avenue South, New York. Most clients work with us online through the secure client portal.",
    },
    {
      question: "Can you represent me before the IRS?",
      answer: "Yes. Our CPAs and Enrolled Agents can represent clients before the IRS under Form 2848 for notices, audits and collections.",
    },
  ],
  contact: [
    {
      question: "How quickly will someone reply?",
      answer: "A CPA replies within four business hours, Monday to Friday, 8am to 8pm Eastern.",
    },
    {
      question: "Is the first consultation free?",
      answer: "Yes. The first 15-minute call is free. We'll explain what your situation needs and what it costs.",
    },
    {
      question: "Should I email my tax documents?",
      answer: "Please don't send Social Security numbers or tax documents by regular email. Upload them through the secure client portal instead.",
    },
  ],
  resources: [
    {
      question: "Who writes these articles?",
      answer: "Our licensed CPAs and Enrolled Agents write and review every guide, and we update them when tax law changes.",
    },
    {
      question: "Can I rely on an article for my own return?",
      answer: "Articles are general information, not advice for your situation. Book a consultation if you'd like a CPA to look at your specific facts.",
    },
    {
      question: "How often is the content updated?",
      answer: "We review articles each filing season and whenever the IRS releases new guidance or figures.",
    },
  ],
  guarantee: [
    {
      question: "How do I make a claim under the guarantee?",
      answer: "Upload the IRS or state notice to your portal. We review it and, if a calculation error on our part caused a penalty or interest, we reimburse it.",
    },
    {
      question: "Does the guarantee cover the tax itself?",
      answer: "No. Additional tax you owe is always your liability. The guarantee covers penalties and interest caused by our calculation errors.",
    },
    {
      question: "What if I'm not happy with the return before it's filed?",
      answer: "You review the finished return, the refund figure and your preparer's notes first. If you aren't happy at that point, you don't pay.",
    },
  ],
  security: [
    {
      question: "How are my documents stored?",
      answer: "Files are encrypted in transit with TLS and at rest with AES-256, and only the staff working on your return can access them.",
    },
    {
      question: "Do you share my information?",
      answer: "No. IRC Section 7216 prohibits tax preparers from disclosing or using return information for anything other than preparing your return.",
    },
    {
      question: "What should I do if I suspect fraud?",
      answer: "Call us at (212) 847-1920 right away. We never ask for passwords or payment by gift card, text or social media.",
    },
  ],
  booking: [
    {
      question: "What happens on the consultation call?",
      answer: "A CPA asks about your situation, explains which service fits, and gives you a price. There's no obligation to go ahead.",
    },
    {
      question: "Can I reschedule?",
      answer: "Yes. Call the office or email taxsupport@plrstax.com and we'll move it.",
    },
    {
      question: "What should I have ready?",
      answer: "Last year's return, if you have it, and a short list of what changed this year. You don't need to share any documents on the call.",
    },
  ],
  legal: [
    {
      question: "Who can I contact about these terms or policies?",
      answer: "Email taxsupport@plrstax.com or call (212) 847-1920 and we'll answer your question.",
    },
    {
      question: "Is information on this website tax advice?",
      answer: "No. Website content is general information. Advice is given only within a signed engagement that covers your specific facts.",
    },
    {
      question: "How can I request a copy or deletion of my data?",
      answer: "Contact us by email. Some records must be kept for the period required by law, and we'll explain what applies.",
    },
  ],
};
