"use client";

import type { ActionState } from "@/app/admin/actions/types";
import { ActionForm, ConfirmSubmit, SubmitButton } from "./form";

/** Publish / unpublish / archive / delete controls for a catalogue record. */
export function RecordCommands({
  id,
  status,
  action,
  label,
  allowDelete = true,
}: {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  label: string;
  allowDelete?: boolean;
}) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" && (
          <SubmitButton name="op" value="publish" variant="secondary">
            Publish
          </SubmitButton>
        )}
        {status === "PUBLISHED" && (
          <SubmitButton name="op" value="unpublish" variant="secondary">
            Unpublish
          </SubmitButton>
        )}
        {status !== "ARCHIVED" && (
          <ConfirmSubmit name="op" value="archive" variant="secondary" message={`Archive this ${label}? It will be removed from the website but kept for records.`}>
            Archive
          </ConfirmSubmit>
        )}
        {allowDelete && (
          <ConfirmSubmit name="op" value="delete" message={`Permanently delete this ${label}? This cannot be undone.`}>
            Delete
          </ConfirmSubmit>
        )}
      </div>
    </ActionForm>
  );
}
