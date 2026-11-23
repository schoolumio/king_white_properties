"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaItem = {
  mediaId: string;
  url: string | null;
  name?: string;
  mimeType?: string;
  alt?: string;
  title?: string;
  kind?: string;
  flag?: boolean;
};

type Props = {
  name: string;
  label: string;
  help?: string;
  initial?: MediaItem[];
  accept: "image" | "document" | "any";
  folder: string;
  visibility?: "PUBLIC" | "PRIVATE";
  max?: number;
  /** Per-item text field: "alt" for images, "title" for documents. */
  textField?: "alt" | "title";
  /** Optional per-item kind selector, e.g. PHOTO / FLOOR_PLAN. */
  kindOptions?: { value: string; label: string }[];
  /** Optional per-item boolean, e.g. "Public download". */
  flagLabel?: string;
};

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  any: "image/jpeg,image/png,image/webp,image/avif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
};

/** Upload + order + annotate media; serialises to a hidden JSON input for the server action. */
export function MediaInput({ name, label, help, initial = [], accept, folder, visibility = "PUBLIC", max, textField = accept === "image" ? "alt" : "title", kindOptions, flagLabel }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).slice(0, max ? Math.max(0, max - items.length) || 1 : files.length);
    for (const file of list) {
      if (file.size > 4 * 1024 * 1024) {
        setError(`“${file.name}” is larger than 4 MB. Please compress it (e.g. export at 2400px wide, ~80% quality) and try again.`);
        continue;
      }
      setBusy((b) => b + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        fd.append("visibility", visibility);
        fd.append("kind", accept);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({ error: res.status === 413 ? "File too large — maximum 4 MB." : `Upload failed (${res.status}).` }));
        if (!res.ok) throw new Error(json.error || "Upload failed");
        const item: MediaItem = {
          mediaId: json.id,
          url: json.url,
          name: json.originalName,
          mimeType: json.mimeType,
          alt: "",
          title: file.name.replace(/\.[^.]+$/, ""),
          kind: kindOptions?.[0]?.value,
          flag: true,
        };
        setItems((prev) => (max === 1 ? [item] : [...prev, item]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const update = (i: number, patch: Partial<MediaItem>) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const isImage = (it: MediaItem) => (it.mimeType ? it.mimeType.startsWith("image/") : accept === "image");

  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(items.map(({ mediaId, alt, title, kind, flag }) => ({ mediaId, alt, title, kind, flag })))} />
      {items.length > 0 && (
        <ul className="mb-3 divide-y divide-line border border-line">
          {items.map((it, i) => (
            <li key={it.mediaId} className="flex flex-wrap items-center gap-3 p-3">
              {isImage(it) && it.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt="" className="h-14 w-20 bg-slate-100 object-cover" />
              ) : (
                <span className="grid h-14 w-20 place-items-center bg-slate-100">
                  <FileText className="h-5 w-5 text-ink/40" />
                </span>
              )}
              <div className="min-w-48 flex-1 space-y-1.5">
                <input
                  value={(textField === "alt" ? it.alt : it.title) ?? ""}
                  onChange={(e) => update(i, textField === "alt" ? { alt: e.target.value } : { title: e.target.value })}
                  placeholder={textField === "alt" ? "Describe the image (alt text)" : "Document title"}
                  className="h-9 w-full border border-line px-2 text-[13px]"
                  aria-label={textField === "alt" ? "Alt text" : "Document title"}
                />
                {it.name && <p className="truncate text-[11px] text-ink/45">{it.name}</p>}
              </div>
              {kindOptions && (
                <select value={it.kind} onChange={(e) => update(i, { kind: e.target.value })} className="h-9 border border-line px-2 text-[13px]" aria-label="Type">
                  {kindOptions.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              )}
              {flagLabel && (
                <label className="flex items-center gap-1.5 text-[12.5px] text-ink/70">
                  <input type="checkbox" checked={!!it.flag} onChange={(e) => update(i, { flag: e.target.checked })} /> {flagLabel}
                </label>
              )}
              <div className="flex gap-1">
                {(!max || max > 1) && (
                  <>
                    <button type="button" onClick={() => move(i, -1)} className="grid h-9 w-9 place-items-center border border-line hover:border-primary" aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="grid h-9 w-9 place-items-center border border-line hover:border-primary" aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="grid h-9 w-9 place-items-center border border-rose-200 text-rose-700 hover:bg-rose-50" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(!max || items.length < max || max === 1) && (
        <label className={cn("flex cursor-pointer items-center justify-center gap-2 border border-dashed border-primary/25 px-4 py-5 text-[13px] text-ink/70 hover:border-primary", busy > 0 && "pointer-events-none opacity-70")}>
          {busy > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy > 0 ? `Uploading ${busy} file${busy > 1 ? "s" : ""}…` : max === 1 && items.length ? "Replace file" : `Upload ${accept === "image" ? "images" : "files"}`}
          <input ref={inputRef} type="file" className="sr-only" accept={ACCEPT[accept]} multiple={!max || max > 1} onChange={(e) => upload(e.target.files)} />
        </label>
      )}
      {error && <p className="mt-1.5 text-xs text-rose-700">{error}</p>}
      {help && !error && <p className="mt-1.5 text-xs text-ink/50">{help}</p>}
    </div>
  );
}
