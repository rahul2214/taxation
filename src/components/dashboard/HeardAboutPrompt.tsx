"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { updateCustomerHeardAbout, type CustomerRecord } from "@/lib/supabase/services";
import { HEARD_ABOUT_OPTIONS, heardAboutValue } from "@/data/heard-about";

const SKIP_KEY = "polaris:heard-about-skipped";

/**
 * Asks "How did you hear about us?" once for accounts that never answered it,
 * mainly Google sign-ups, which skip the signup form.
 */
export function HeardAboutPrompt({ customer }: { customer: CustomerRecord | null }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only ask when the column exists (migration run) and is still empty.
    if (!customer || !("heard_about" in customer) || customer.heard_about) return;
    const customerId = customer.id;

    try {
      if (sessionStorage.getItem(SKIP_KEY)) return;
    } catch {
      // Storage blocked: fall through and ask.
    }

    let cancelled = false;
    (async () => {
      // An email signup made before the migration kept its answer on the auth account; copy it over instead of asking again.
      const { data } = await supabase.auth.getUser();
      const saved = data.user?.user_metadata?.heard_about;
      if (typeof saved === "string" && saved) {
        try {
          await updateCustomerHeardAbout(customerId, saved);
          return;
        } catch (err) {
          console.warn("Could not copy heard_about from auth metadata:", err);
        }
      }
      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [customer]);

  const skip = () => {
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      // Storage blocked: the prompt may show again next visit, which is fine.
    }
    setOpen(false);
  };

  const save = async () => {
    if (!customer || !choice || (choice === "Other" && !other.trim())) return;
    setIsSaving(true);
    try {
      await updateCustomerHeardAbout(customer.id, heardAboutValue(choice, other));
      setOpen(false);
      toast({ title: "Thank you", description: "That helps us reach more people like you." });
    } catch (err) {
      console.warn("Could not save heard_about:", err);
      toast({ variant: "destructive", title: "Couldn't save your answer", description: "Please try again in a moment." });
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = Boolean(choice) && (choice !== "Other" || Boolean(other.trim()));

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : skip())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>One quick question</DialogTitle>
          <DialogDescription>How did you hear about Polaris Tax Services?</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="prompt-heard-about" className="sr-only">
            How did you hear about us?
          </Label>
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger id="prompt-heard-about">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {HEARD_ABOUT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {choice === "Other" && (
            <Input
              aria-label="Where did you hear about us?"
              placeholder="Please tell us where"
              maxLength={120}
              value={other}
              onChange={(e) => setOther(e.target.value)}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={skip} disabled={isSaving}>
            Skip for now
          </Button>
          <Button type="button" onClick={save} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
