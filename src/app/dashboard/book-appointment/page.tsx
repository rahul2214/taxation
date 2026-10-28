"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  User,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  createAppointment,
  getAppointments,
  getCustomer,
  AppointmentRecord,
  CustomerRecord,
} from "@/lib/supabase/services";
import { PageHeading } from "@/components/portal/PageHeading";

export default function DashboardBookAppointmentPage() {
  const { user } = useFirebase();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Individual Tax Return (Form 1040)");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Morning (9:00 AM - 12:00 PM)");
  const [notes, setNotes] = useState("");

  // Get tomorrow's date for date picker min value
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      let currentCustomer: CustomerRecord | null = null;

      try {
        // 1. Load customer details to pre-fill form
        const custData = await getCustomer(user.uid);
        if (custData) {
          currentCustomer = custData;
          setCustomer(custData);
          const first = custData.first_name || "";
          const last = custData.last_name || "";
          setFullName(`${first} ${last}`.trim() || user.displayName || "");
          setEmail(custData.email || user.email || "");
          setPhone(custData.phone || "");
        } else if (user.email) {
          const byEmail = await getCustomer(user.email);
          if (byEmail) {
            currentCustomer = byEmail;
            setCustomer(byEmail);
            const first = byEmail.first_name || "";
            const last = byEmail.last_name || "";
            setFullName(`${first} ${last}`.trim() || user.displayName || "");
            setEmail(byEmail.email || user.email || "");
            setPhone(byEmail.phone || "");
          } else {
            setFullName(user.displayName || "");
            setEmail(user.email || "");
          }
        } else {
          setFullName(user.displayName || "");
          setEmail(user.email || "");
        }
      } catch (err: any) {
        console.warn("Customer profile load notice:", err?.message || err);
      } finally {
        setIsLoadingCustomer(false);
      }

      // 2. Load existing appointments for this customer
      try {
        let apts = await getAppointments(user.uid);
        const resolvedEmail = currentCustomer?.email || user.email;
        if ((!apts || apts.length === 0) && resolvedEmail) {
          const emailApts = await getAppointments(resolvedEmail);
          if (emailApts && emailApts.length > 0) {
            apts = emailApts;
          }
        }
        setAppointments(apts || []);
      } catch (err: any) {
        console.warn("Appointments load notice:", err?.message || err);
        setAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    }

    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim() || !email.trim() || !phone.trim() || !preferredDate) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please provide your name, email, phone number, and preferred date.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = [
        preferredTime ? `Preferred Time: ${preferredTime}` : "",
        notes.trim() ? `Client Notes: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // Save directly to Supabase with customer foreign keys
      const newApt = await createAppointment({
        customer_id: user.uid,
        customer_userid: customer?.userid || null,
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service,
        appointment_date: new Date(preferredDate).toISOString(),
        notes: combinedNotes,
        status: "Pending",
      });

      toast({
        title: "Appointment Requested!",
        description: "Your consultation request has been submitted. Our tax team will contact you shortly to confirm.",
      });

      // Reset form options
      setNotes("");
      setPreferredDate("");

      // Refresh appointments list
      let updatedApts = await getAppointments(user.uid, { forceRefresh: true });
      if ((!updatedApts || updatedApts.length === 0) && email.trim()) {
        const emailApts = await getAppointments(email.trim(), { forceRefresh: true });
        if (emailApts && emailApts.length > 0) {
          updatedApts = emailApts;
        }
      }
      setAppointments(updatedApts || []);
    } catch (err: any) {
      console.warn("Appointment booking notice:", err?.message || err);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message || "Failed to submit appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "Pending").toLowerCase();
    switch (s) {
      case "confirmed":
      case "completed":
        return (
          <Badge className="bg-brass/[0.06]0/15 text-brass-dark border-brass/30">
            {status || "Confirmed"}
          </Badge>
        );
      case "cancelled":
      case "rejected":
        return <Badge variant="destructive">{status || "Cancelled"}</Badge>;
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            Pending Confirmation
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <PageHeading
        title="Book a call with your CPA"
        description="Pick a day and a time that suits you. We'll go through your situation, answer questions and plan your filing."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Booking Form */}
        <div className="lg:col-span-7">
          <Card className="border-sidebar-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Request an Appointment</CardTitle>
              <CardDescription className="text-xs">
                Your contact details are pre-filled from your profile. Pick your desired service and preferred date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCustomer ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-9 h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(555) 000-0000"
                          className="pl-9 h-9 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@example.com"
                          className="pl-9 h-9 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-1.5">
                    <Label htmlFor="service" className="text-xs font-semibold">
                      Consultation Service *
                    </Label>
                    <select
                      id="service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Individual Tax Return (Form 1040)">
                        Individual & Family Tax Return (Form 1040)
                      </option>
                      <option value="Small Business & Self-Employed (Schedule C / LLC)">
                        Small Business & Self-Employed (Schedule C / LLC)
                      </option>
                      <option value="Corporate Tax Preparation (1120 / 1120-S / 1065)">
                        Corporate Tax Preparation (1120 / 1120-S / 1065)
                      </option>
                      <option value="Tax Planning & Deduction Strategy">
                        Tax Planning & Deduction Strategy
                      </option>
                      <option value="Prior Year Returns & Amendments">
                        Prior Year Returns & Amendments
                      </option>
                      <option value="IRS Notice & Audit Assistance">
                        IRS Notice & Audit Assistance
                      </option>
                      <option value="General Tax Consultation">
                        General Tax Consultation
                      </option>
                    </select>
                  </div>

                  {/* Date & Preferred Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredDate" className="text-xs font-semibold">
                        Preferred Date *
                      </Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        min={todayStr}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="h-9 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="preferredTime" className="text-xs font-semibold">
                        Preferred Time Window
                      </Label>
                      <select
                        id="preferredTime"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Morning (9:00 AM - 12:00 PM)">
                          Morning (9:00 AM - 12:00 PM)
                        </option>
                        <option value="Afternoon (12:00 PM - 4:00 PM)">
                          Afternoon (12:00 PM - 4:00 PM)
                        </option>
                        <option value="Evening (4:00 PM - 7:00 PM)">
                          Evening (4:00 PM - 7:00 PM)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Notes & Special Requests */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold">
                      Questions / Notes for Tax Advisor (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Briefly describe what you'd like to discuss (e.g., new house purchase, 1099 income, stock sales)..."
                      className="min-h-[85px] text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="mr-2 h-4 w-4" /> Request Appointment
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Existing Appointments & Preparation Tips */}
        <div className="lg:col-span-5 space-y-6">
          {/* Your Scheduled Consultations */}
          <Card className="border-sidebar-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Your Consultations
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {appointments.length} Total
                </Badge>
              </div>
              <CardDescription className="text-xs">
                History of consultations requested under your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Calendar className="h-8 w-8 mx-auto opacity-30 text-primary" />
                  <p className="font-medium text-foreground">No appointments scheduled</p>
                  <p>Submit the form on the left to request your consultation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt, idx) => (
                    <div
                      key={apt.id || idx}
                      className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground leading-tight">
                          {apt.service || "Tax Consultation"}
                        </span>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          {apt.appointment_date
                            ? new Date(apt.appointment_date).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Scheduled"}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 pt-1 border-t border-border/50">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist / Help Card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Preparation Checklist
              </CardTitle>
              <CardDescription className="text-xs">
                Have these ready to maximize your consultation session:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass shrink-0 mt-0.5" />
                <span>
                  <strong>Tax Documents</strong>: W-2s, 1099s, mortgage interest (1098), or K-1 forms.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass shrink-0 mt-0.5" />
                <span>
                  <strong>Prior Year Return</strong>: Your 2024 or 2025 federal & state returns.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass shrink-0 mt-0.5" />
                <span>
                  <strong>Direct Upload</strong>: You can upload your documents securely beforehand in the vault.
                </span>
              </div>

              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/dashboard/upload">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Documents in Advance
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
