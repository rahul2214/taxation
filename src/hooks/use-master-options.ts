"use client";

import { useEffect, useState } from "react";
import {
  fallbackMasterData,
  getMasterOptions,
  MasterCategory,
  MasterDataRecord,
} from "@/lib/supabase/master-data";

/**
 * Dropdown options for a master data category.
 * Starts with the built-in values so the form renders immediately, then swaps in the admin-managed list.
 */
export function useMasterOptions(category: MasterCategory) {
  const [options, setOptions] = useState<MasterDataRecord[]>(() => fallbackMasterData(category));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMasterOptions(category)
      .then((rows) => {
        if (!cancelled) setOptions(rows);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { options, isLoading };
}

/** Value used for an option's <select> value: the master id when known, else the label. */
export const optionValue = (o: MasterDataRecord) => (o.id != null ? String(o.id) : o.label);

/** The selected value if it is still in the list, else the first option (lists can change after load). */
export function currentValue(options: MasterDataRecord[], value: string) {
  if (options.some((o) => optionValue(o) === value)) return value;
  return options[0] ? optionValue(options[0]) : "";
}

/** Resolves a <select> value back to { id, label } for saving. */
export function resolveOption(options: MasterDataRecord[], value: string) {
  const match = options.find((o) => optionValue(o) === value);
  return { id: match?.id ?? null, label: match?.label ?? value };
}
