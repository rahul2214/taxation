import Link from "next/link";
import { ShieldCheck, Facebook, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-2">
              <ShieldCheck className="h-7 w-7 text-accent" />
              <span className="font-headline">TaxEase</span>
            </Link>
            <p className="text-sm text-muted-foreground">Simplifying your taxes with professional ease.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/services" className="text-muted-foreground hover:text-primary">Services</Link></li>
                <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="/guarantee" className="text-muted-foreground hover:text-primary">Guarantee</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary">My Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <h3 className="font-semibold mb-2">Follow Us</h3>
            <div className="flex gap-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook /></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Linkedin /></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TaxEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
