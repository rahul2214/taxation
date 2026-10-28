"use client";

import Link from "next/link";
import { Menu, LayoutDashboard, LogOut, Phone } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { getCachedAuth, clearCachedAuth } from "@/lib/cache/auth-cache";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#estimator", label: "Estimator" },
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Articles" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useFirebase();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cached = mounted ? getCachedAuth() : { user: null, role: null, isAdmin: false };
  const activeUser = mounted ? (user || cached.user) : null;
  const isAdmin = cached.isAdmin;
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";

  const handleSignOut = async () => {
    try {
      clearCachedAuth();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      console.warn("Sign out warning:", e);
      router.push("/");
    }
  };

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-paper-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      {/* Utility line */}
      <div className="hidden border-b border-paper-line/70 md:block">
        <div className="site-container flex h-9 items-center justify-between text-[12.5px] text-ink-muted">
          <p>Licensed CPAs &amp; Enrolled Agents · Serving clients in all 50 states</p>
          <div className="flex items-center gap-5">
            <a href="tel:+12128471920" className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone className="h-3 w-3" />
              (212) 847-1920
            </a>
            <span className="text-paper-line">|</span>
            <span>Mon–Fri, 8am–8pm ET</span>
          </div>
        </div>
      </div>

      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Polaris Tax Services home">
          <PolarisLogo theme="light" className="h-9 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative py-1 text-[14.5px] transition-colors",
                isActive(link.href)
                  ? "font-semibold text-ink after:absolute after:inset-x-0 after:-bottom-[21px] after:h-[2px] after:bg-brass"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {activeUser ? (
            <>
              <Link href={dashboardHref} className="btn-ink hidden h-10 py-0 sm:inline-flex">
                <LayoutDashboard className="h-4 w-4" />
                {isAdmin ? "Admin console" : "Your dashboard"}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden h-10 items-center gap-1.5 px-2 text-sm text-ink-muted transition-colors hover:text-ink sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden px-2 text-[14.5px] font-medium text-ink-soft hover:text-ink sm:inline">
                Sign in
              </Link>
              <Link href="/book-appointment" className="btn-ink h-10 px-3.5 py-0 text-[13.5px] sm:px-5">
                <span className="sm:hidden">Book a call</span>
                <span className="hidden sm:inline">Book a consultation</span>
              </Link>
            </>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-paper-line text-ink lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[300px] flex-col border-paper-line bg-paper p-0 font-ui text-ink">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>

              <div className="border-b border-paper-line px-6 py-5">
                <PolarisLogo theme="light" className="h-8 w-auto" />
              </div>

              <nav className="flex flex-col px-6 py-4" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "border-b border-paper-line/70 py-3.5 font-display text-xl",
                      isActive(link.href) ? "text-brass-dark" : "text-ink"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-3 border-t border-paper-line px-6 py-6">
                {activeUser ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setIsOpen(false)} className="btn-ink w-full">
                      {isAdmin ? "Admin console" : "Your dashboard"}
                    </Link>
                    <button
                      type="button"
                      className="btn-line w-full"
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/book-appointment" onClick={() => setIsOpen(false)} className="btn-ink w-full">
                      Book a consultation
                    </Link>
                    <Link href="/login" onClick={() => setIsOpen(false)} className="btn-line w-full">
                      Client sign in
                    </Link>
                  </>
                )}
                <a href="tel:+12128471920" className="block pt-2 text-center text-sm text-ink-muted">
                  Or call (212) 847-1920
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
