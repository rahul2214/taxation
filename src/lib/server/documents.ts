// SERVER ONLY. Keeps tax_documents rows and their files in Cloudflare R2 in step:
// deleting a document deletes its file, replacing a document's file deletes the old file,
// and a new upload in a one-per-year category replaces the previous one.
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteFromR2, keyFromStoredUrl } from "@/lib/cloudflare/r2";

/** Categories that hold one document per customer per tax year; a new upload replaces the old. */
export const SINGLE_FILE_CATEGORIES = new Set(["Tax Estimation", "Tax Return Draft", "Final Document"]);

export type DocumentActor = { kind: "admin" } | { kind: "customer"; userId: string };

/** An error whose message is safe to show to the user. */
export class DocumentError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type DocRow = {
  id: string;
  customer_id: string;
  category: string;
  tax_year: number | null;
  uploader: string;
  file_url: string;
};

const ROW_FIELDS = "id, customer_id, category, tax_year, uploader, file_url";

/** Customers manage only documents they uploaded themselves; admins manage all. */
function canManage(actor: DocumentActor, row: DocRow) {
  if (actor.kind === "admin") return true;
  return row.customer_id === actor.userId && row.uploader === "customer";
}

async function loadRow(db: SupabaseClient, id: string): Promise<DocRow> {
  const { data, error } = await db.from("tax_documents").select(ROW_FIELDS).eq("id", id).maybeSingle();
  if (error) throw new DocumentError(error.message || "Database error", 500);
  if (!data) throw new DocumentError("Document not found.", 404);
  return data as DocRow;
}

/** Deletes a stored file unless another document row still points at it. */
async function removeFile(db: SupabaseClient, fileUrl: string) {
  if (!keyFromStoredUrl(fileUrl)) return;
  const { count } = await db.from("tax_documents").select("id", { count: "exact", head: true }).eq("file_url", fileUrl);
  if (count) return;
  const ok = await deleteFromR2(fileUrl);
  if (!ok) console.warn("R2 file could not be deleted (left in the bucket):", keyFromStoredUrl(fileUrl));
}

/** Deletes a document row, then its file in R2. */
export async function deleteDocument(db: SupabaseClient, actor: DocumentActor, id: string) {
  const row = await loadRow(db, id);
  if (!canManage(actor, row)) throw new DocumentError("You can only delete documents you uploaded.", 403);
  const { error } = await db.from("tax_documents").delete().eq("id", row.id);
  if (error) throw new DocumentError(error.message || "Could not delete the document.", 500);
  await removeFile(db, row.file_url);
  return { deleted: row.id };
}

/**
 * Points an existing document at a newly uploaded file, then deletes the old file.
 * The new file must already be in R2 (uploaded through /api/upload) and, for a customer,
 * in their own folder.
 */
export async function replaceDocumentFile(
  db: SupabaseClient,
  actor: DocumentActor,
  id: string,
  next: { fileUrl: string; documentName?: string }
) {
  const row = await loadRow(db, id);
  if (!canManage(actor, row)) throw new DocumentError("You can only replace documents you uploaded.", 403);

  const newKey = keyFromStoredUrl(next.fileUrl);
  if (!newKey) throw new DocumentError("The new file is not a file managed by this site.");
  if (actor.kind === "customer" && !newKey.startsWith(`customers/${actor.userId}/`)) {
    throw new DocumentError("The new file must be one you uploaded.", 403);
  }

  const update: Record<string, unknown> = {
    file_url: next.fileUrl,
    upload_date: new Date().toISOString(),
    // A new file needs checking again.
    status: "Pending",
  };
  const name = String(next.documentName || "").trim().slice(0, 200);
  if (name) update.document_name = name;

  const { data, error } = await db.from("tax_documents").update(update).eq("id", row.id).select().single();
  if (error) throw new DocumentError(error.message || "Could not update the document.", 500);
  if (row.file_url !== next.fileUrl) await removeFile(db, row.file_url);
  return data;
}

/**
 * After a new upload in a one-per-year category, deletes the customer's older documents
 * in that category and tax year (rows and files). Customers only replace their own uploads.
 */
export async function removeSupersededDocuments(db: SupabaseClient, actor: DocumentActor, id: string) {
  const row = await loadRow(db, id);
  if (!canManage(actor, row)) throw new DocumentError("Not allowed.", 403);
  if (!SINGLE_FILE_CATEGORIES.has(row.category)) return { removed: 0 };

  let q = db
    .from("tax_documents")
    .select(ROW_FIELDS)
    .eq("customer_id", row.customer_id)
    .eq("category", row.category)
    .neq("id", row.id);
  q = row.tax_year == null ? q.is("tax_year", null) : q.eq("tax_year", row.tax_year);
  if (actor.kind === "customer") q = q.eq("uploader", "customer");

  const { data: older, error } = await q;
  if (error) throw new DocumentError(error.message || "Database error", 500);

  let removed = 0;
  for (const old of (older || []) as DocRow[]) {
    const { error: delErr } = await db.from("tax_documents").delete().eq("id", old.id);
    if (delErr) {
      console.warn("Could not remove superseded document", old.id, delErr.message);
      continue;
    }
    await removeFile(db, old.file_url);
    removed++;
  }
  return { removed };
}

/** Deletes site tax form files that a settings update replaced. */
export async function removeReplacedFormFiles(
  before: { current_year_form_url?: string | null; prior_year_form_url?: string | null } | null,
  after: { current_year_form_url?: string | null; prior_year_form_url?: string | null } | null
) {
  if (!before) return;
  const stillUsed = new Set([after?.current_year_form_url, after?.prior_year_form_url].filter(Boolean));
  for (const old of [before.current_year_form_url, before.prior_year_form_url]) {
    if (old && !stillUsed.has(old) && keyFromStoredUrl(old)) {
      const ok = await deleteFromR2(old);
      if (!ok) console.warn("Old tax form file could not be deleted:", keyFromStoredUrl(old));
    }
  }
}
