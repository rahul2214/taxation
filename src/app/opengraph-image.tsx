import { renderOgCard, OG_SIZE } from "@/components/seo/ogCard";

export const alt = "Polaris Tax Services: CPA tax preparation for individuals and small businesses";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderOgCard({
    eyebrow: "CPA tax preparation · New York",
    title: "Your taxes, prepared and signed by a CPA who knows your file.",
    footer: "Individual & small business returns from $59",
  });
}
