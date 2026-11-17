import { Header } from "./Header";
import { Footer } from "./Footer";
import { FeedbackWidget } from "@/components/common/FeedbackWidget";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-ui text-ink antialiased selection:bg-brass-light selection:text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FeedbackWidget source="website" />
    </div>
  );
}
