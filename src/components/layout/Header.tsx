"use client";

import Link from "next/link";
import { Menu, LayoutDashboard, LogOut, User } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState } from "react";
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
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useFirebase();

  const cached = getCachedAuth();
  const activeUser = user || cached.user;
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
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <PolarisLogo className="h-9 md:h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "transition-colors hover:text-primary",
                pathname === link.href ? "text-primary font-semibold" : "text-foreground/80"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {activeUser ? (
            <>
              <Button asChild size="sm" className="hidden md:inline-flex shadow-sm gap-2">
                <Link href={dashboardHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{isAdmin ? "Admin Panel" : "Dashboard"}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:inline-flex text-muted-foreground hover:text-destructive gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-foreground/80 hover:text-foreground">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex shadow-sm">
                <Link href="/signup">Sign Up</Link>
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
              <div className="mt-auto space-y-2 pt-6 border-t">
                {activeUser ? (
                  <>
                    <Button asChild className="w-full gap-2">
                      <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>{isAdmin ? "Admin Panel" : "Go to Dashboard"}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:bg-destructive/10 gap-2"
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
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Log In</Link>
                    </Button>
                    <Button asChild className="w-full">
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
