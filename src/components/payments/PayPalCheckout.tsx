"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
export const isPayPalEnabled = Boolean(PAYPAL_CLIENT_ID);

declare global {
  interface Window {
    paypal?: any;
  }
}

let sdkPromise: Promise<any> | null = null;

function loadPayPalSdk(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.paypal) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": PAYPAL_CLIENT_ID,
      currency: "USD",
      intent: "capture",
      components: "buttons",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal SDK failed to load")));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("PayPal SDK failed to load"));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

async function postWithAuth(url: string, body: object) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

type Props = {
  purchaseId: string;
  onPaid: () => void;
  onError: (message: string) => void;
};

/** PayPal Smart Buttons for one plan purchase. Order creation and capture happen on our server. */
export function PayPalCheckout({ purchaseId, onPaid, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "processing" | "failed">("loading");

  // Keep latest callbacks without re-rendering the PayPal buttons
  const callbacks = useRef({ onPaid, onError });
  callbacks.current = { onPaid, onError };

  useEffect(() => {
    if (!isPayPalEnabled) return;
    let cancelled = false;
    let buttons: any = null;

    loadPayPalSdk()
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay" },
          createOrder: async () => {
            const { ok, json } = await postWithAuth("/api/paypal/create-order", { purchaseId });
            if (!ok || !json.id) throw new Error(json.error || "Could not start PayPal checkout.");
            return json.id;
          },
          onApprove: async (data: { orderID: string }, actions: any) => {
            setState("processing");
            const { ok, json } = await postWithAuth("/api/paypal/capture-order", {
              purchaseId,
              orderId: data.orderID,
            });
            if (json.error === "INSTRUMENT_DECLINED") {
              setState("ready");
              return actions.restart();
            }
            if (!ok) {
              setState("ready");
              callbacks.current.onError(json.error || "Payment could not be completed.");
              return;
            }
            callbacks.current.onPaid();
          },
          onError: (err: any) => {
            setState("ready");
            callbacks.current.onError(err?.message || "PayPal checkout failed. Please try again.");
          },
        });
        return buttons.render(containerRef.current).then(() => !cancelled && setState("ready"));
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });

    return () => {
      cancelled = true;
      try {
        buttons?.close?.();
      } catch {
        // already closed
      }
    };
  }, [purchaseId]);

  if (!isPayPalEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Online payment isn't available right now. Our team will contact you to collect payment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {state === "loading" && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      {state === "processing" && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment...
        </p>
      )}
      {state === "failed" && (
        <p className="text-sm text-destructive">Couldn't load PayPal. Check your connection and try again.</p>
      )}
      <div ref={containerRef} className={state === "processing" ? "pointer-events-none opacity-50" : ""} />
    </div>
  );
}
