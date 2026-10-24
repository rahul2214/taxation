"use client";

import Link from "next/link";
import { Menu, LayoutDashboard, LogOut, ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { getCachedAuth, clearCachedAuth } from "@/lib/cache/auth-cache";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/#calculator", label: "Tax Estimator" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/guarantee", label: "Guarantee" },
  { href: "/blogs", label: "Blogs" },
  { href: "/about", label: "About Us" },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex h-18 lg:h-16 items-center justify-between px-6 lg:px-8">
        {/* 1. Left: Brand Logo Anchor */}
        <Link href="/" className="flex items-center shrink-0 hover:opacity-95 transition-opacity pr-4">
          <PolarisLogo className="h-9 md:h-10 w-auto" />
        </Link>

        {/* 2. Center: Desktop Nav Links (Spacious, Clear & Hoverable) */}
        <nav className="hidden lg:flex items-center xl:gap-2.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-medium tracking-normal transition-all duration-150",
                  isActive
                    ? "text-slate-950 font-semibold bg-slate-100 shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Right: Clear Action Cluster */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Subtle Vertical Divider before Actions */}
          <div className="hidden lg:block h-5 w-[1px] bg-slate-200/90 mr-1" />

          {activeUser ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 h-10 shadow-xs gap-2 rounded-lg">
                <Link href={dashboardHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{isAdmin ? "Admin Console" : "Dashboard"}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:inline-flex text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs h-10 px-3 rounded-lg gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-all"
              >
                Client Portal
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 h-10 shadow-xs rounded-lg transition-all"
              >
                <a href="/#book-consultation">Book Consultation</a>
              </Button>
            </>
          )}

          {/* 4. Mobile & Tablet Menu Trigger (Visible below 1024px to prevent cramping) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden border-slate-200 text-slate-800 hover:bg-slate-50 h-10 w-10 rounded-lg shrink-0 ml-1"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-white p-6 sm:p-8">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">List of site navigation links.</SheetDescription>

              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                  <PolarisLogo className="h-9 w-auto" />
                </Link>
              </div>

              {/* Mobile Navigation List with generous touch targets */}
              <nav className="grid gap-2 py-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-slate-100 text-slate-950 font-semibold"
                          : "text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Bottom Actions */}
              <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
                {activeUser ? (
                  <>
                    <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm h-11 rounded-lg gap-2">
                      <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>{isAdmin ? "Admin Console" : "Go to Dashboard"}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 text-sm h-11 rounded-lg gap-2"
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full border-slate-300 text-slate-800 text-sm font-semibold h-11 rounded-lg">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Client Portal</Link>
                    </Button>
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm h-11 rounded-lg shadow-xs">
                      <Link href="/#book-consultation" onClick={() => setIsOpen(false)}>Book Consultation</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
