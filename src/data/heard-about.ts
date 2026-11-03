// Answers to "How did you hear about us?", stored on customers.heard_about.
// Asked at email signup, and on first dashboard visit for accounts created with Google.
export const HEARD_ABOUT_OPTIONS = [
  "Google search",
  "Instagram",
  "Facebook",
  "Threads",
  "Friend or family",
  "Existing client referral",
  "Event or community group",
  "Other",
];

/** The value saved to the database, e.g. "Instagram" or "Other: Local newspaper". */
export const heardAboutValue = (choice: string, other: string) =>
  choice === "Other" ? `Other: ${other.trim()}` : choice;
