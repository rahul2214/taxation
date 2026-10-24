"use client";

import Link from "next/link";
import { Menu, LayoutDashboard, LogOut, User } from "lucide-react";
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
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/blogs", label: "Blogs" },
  { href: "/book-appointment", label: "Book Appointment" },
  { href: "/guarantee", label: "Guarantee" },
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
  const isAdmin = cached.isAdmin || activeUser?.role === "admin" || activeUser?.role === "superadmin";
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity">
          <PolarisLogo className="h-9 md:h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "relative py-1 transition-colors",
                  isActive
                    ? "text-slate-950 font-semibold after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-blue-600 after:rounded-full"
                    : "text-slate-600 hover:text-slate-950"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {activeUser ? (
            <>
              <Button asChild size="sm" className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs gap-2">
                <Link href={dashboardHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{isAdmin ? "Admin Console" : "Dashboard"}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:inline-flex text-slate-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-slate-700 hover:text-slate-950 font-medium">
                <Link href="/login">Client Portal</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">A list of links to navigate the site.</SheetDescription>
              <nav className="grid gap-6 text-lg font-medium mt-10">
                <Link href="/" className="flex items-center hover:opacity-90 transition-opacity mb-4" onClick={() => setIsOpen(false)}>
                  <PolarisLogo className="h-8 w-auto" />
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "transition-colors hover:text-primary",
                      pathname === link.href ? "text-primary" : "text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-2.5 pt-6 border-t border-slate-200">
                {activeUser ? (
                  <>
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2">
                      <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>{isAdmin ? "Admin Console" : "Go to Dashboard"}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
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
                    <Button asChild variant="outline" className="w-full border-slate-300 text-slate-800">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Client Portal</Link>
                    </Button>
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      <Link href="/signup" onClick={() => setIsOpen(false)}>Create Account</Link>
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
