import { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Mail, Phone, MapPin, Clock, ShieldCheck, ArrowRight, CalendarCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact Us & Partner Desk Directory | Polaris Tax Services",
  description: "Get in touch with Polaris CPAs and tax advisors. Phone, email, office address, and hours of operation.",
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20 text-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <header className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span>DIRECT CLIENT &amp; ADVISORY ASSISTANCE</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              Contact Our Practice
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Reach our licensed CPA desk directly via phone, encrypted email, or schedule an in-depth partner consultation.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            {/* Left Contact Information */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Phone & Advisory */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Direct Phone Inquiries</h3>
                    <p className="text-xs text-slate-500">M–F 8:00 AM – 8:00 PM EST</p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-bold text-slate-950 text-lg">(212) 847-1920</p>
                  <p className="text-xs text-slate-500">Toll-free client services &amp; partner desk</p>
                </div>
              </div>

              {/* Card 2: Email & Support */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Encrypted Email Desk</h3>
                    <p className="text-xs text-slate-500">24/7 Intake with 2-hour response SLA</p>
                  </div>
                </div>
                <div className="text-xs space-y-2 text-slate-600">
                  <p>Advisory &amp; New Filings: <a href="mailto:advisory@polaristax.com" className="text-blue-600 font-semibold hover:underline">advisory@polaristax.com</a></p>
                  <p>Client Portal Vault Support: <a href="mailto:support@polaristax.com" className="text-blue-600 font-semibold hover:underline">support@polaristax.com</a></p>
                  <p>IRS Notice Assistance: <a href="mailto:notices@polaristax.com" className="text-blue-600 font-semibold hover:underline">notices@polaristax.com</a></p>
                </div>
              </div>

              {/* Card 3: Physical Headquarters */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">New York Practice Office</h3>
                    <p className="text-xs text-slate-500">In-person consultations by appointment</p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-900">Polaris Tax Services Inc.</p>
                  <p>440 Park Avenue South, 12th Floor</p>
                  <p>New York, NY 10016</p>
                </div>
              </div>
            </div>

            {/* Right Quick Message / Inquiry Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 md:p-10 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" /> Send a Direct Message
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Have a question about services, pricing, or tax notices? A CPA will reply within 4 business hours.
                </p>
              </div>

              <form
                className="space-y-4"
                action="/book-appointment"
                method="GET"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name" className="text-xs font-semibold text-slate-700">
                      Full Name *
                    </Label>
                    <Input
                      id="contact-name"
                      name="name"
                      placeholder="Jane Miller"
                      required
                      className="h-10 text-xs border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email" className="text-xs font-semibold text-slate-700">
                      Email Address *
                    </Label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      required
                      className="h-10 text-xs border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-subject" className="text-xs font-semibold text-slate-700">
                    Inquiry Topic
                  </Label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className="w-full h-10 px-3 border border-slate-200 rounded-md text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option>General Tax Preparation Inquiry</option>
                    <option>Small Business / LLC Tax Strategy</option>
                    <option>IRS Notice or Audit Letter Received</option>
                    <option>Document Upload &amp; Portal Question</option>
                    <option>Other Advisory Question</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-message" className="text-xs font-semibold text-slate-700">
                    Message Details
                  </Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Briefly describe what assistance you need..."
                    rows={4}
                    className="text-xs resize-none border-slate-200"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-11 shadow-xs mt-2"
                >
                  Send Inquiry / Continue to Scheduler
                </Button>

                <p className="text-[11px] text-center text-slate-400">
                  Protected under strict CPA-client confidentiality guidelines. No data is shared.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
