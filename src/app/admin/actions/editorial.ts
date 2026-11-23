"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { fd, handleActionError, parseMedia, refresh, uniqueSlug } from "@/lib/admin-form";
import { slugify } from "@/lib/utils";
import type { ActionState } from "./types";

const publish = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// ─────────────────────────── Articles
export async function saveArticle(_prev: ActionState, f: FormData): Promise<ActionState> {
  let id = fd.opt(f, "id");
  try {
    const user = await authorize("insights.manage");
    if (f.get("op") === "delete" && id) {
      await db.article.delete({ where: { id } });
      await audit({ userId: user.id, action: "article.delete", entityType: "Article", entityId: id, summary: "Deleted an article" });
      refresh("/insights");
      id = null;
    } else {
      const title = z.string().min(3, "Enter a title").max(200).parse(fd.str(f, "title"));
      const excerpt = z.string().min(10, "Enter an excerpt").max(500).parse(fd.str(f, "excerpt"));
      const body = z.string().min(20, "Enter the article body").max(60000).parse(fd.str(f, "body"));
      const type = z.enum(["ANNOUNCEMENT", "COMPANY_NEWS", "REAL_ESTATE_INSIGHT", "AUTOMOTIVE_INSIGHT", "PROJECT_UPDATE"]).parse(fd.str(f, "type"));
      const publishStatus = publish.parse(fd.str(f, "publishStatus") || "DRAFT");
      const existing = id ? await db.article.findUnique({ where: { id } }) : null;
      const requested = slugify(fd.str(f, "slug") || title);
      const slug = existing?.slug === requested ? requested : await uniqueSlug(requested, async (s) => !!(await db.article.findFirst({ where: { slug: s, NOT: id ? { id } : undefined } })));
      const cover = await parseMedia(f, "cover");
      if (cover[0]?.alt) await db.mediaAsset.update({ where: { id: cover[0].mediaId }, data: { alt: cover[0].alt } });
      const data = {
        title,
        excerpt,
        body,
        type,
        slug,
        publishStatus,
        coverId: cover[0]?.mediaId ?? null,
        authorName: fd.opt(f, "authorName"),
        featured: fd.bool(f, "featured"),
        metaTitle: fd.opt(f, "metaTitle"),
        metaDescription: fd.opt(f, "metaDescription"),
        publishedAt: fd.date(f, "publishedAt") ?? (publishStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null)),
      };
      const saved = id ? await db.article.update({ where: { id }, data }) : await db.article.create({ data });
      await audit({ userId: user.id, action: id ? "article.update" : "article.create", entityType: "Article", entityId: saved.id, summary: `${id ? "Updated" : "Created"} article “${title}” (${publishStatus.toLowerCase()})` });
      refresh("/insights", `/insights/${saved.slug}`);
      if (id) return { success: "Article saved." };
      id = saved.id;
    }
  } catch (err) {
    return handleActionError(err);
  }
  redirect(id ? `/admin/insights/${id}?created=1` : "/admin/insights");
}

// ─────────────────────────── Publications
export async function savePublication(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("publication.manage");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      await db.publication.delete({ where: { id } });
      await audit({ userId: user.id, action: "publication.delete", entityType: "Publication", entityId: id, summary: "Deleted a publication" });
      refresh("/insights/publications");
      return { success: "Publication deleted." };
    }
    const title = z.string().min(3, "Enter a title").max(200).parse(fd.str(f, "title"));
    const category = z.enum(["CORPORATE_PROFILE", "ANNUAL_REPORT", "BROCHURE", "POLICY", "RESEARCH", "PRESS_RELEASE", "OTHER"]).parse(fd.str(f, "category"));
    const publishStatus = publish.parse(fd.str(f, "publishStatus") || "DRAFT");
    const file = await parseMedia(f, "file");
    if (!file.length) return { error: "Upload the publication file.", fieldErrors: { file: "Required" } };
    // Publications are public downloads by definition.
    await db.mediaAsset.update({ where: { id: file[0].mediaId }, data: { visibility: "PUBLIC" } });
    const existing = id ? await db.publication.findUnique({ where: { id } }) : null;
    const slug = existing?.slug ?? (await uniqueSlug(title, async (s) => !!(await db.publication.findUnique({ where: { slug: s } }))));
    const data = {
      title,
      slug,
      category,
      publishStatus,
      description: fd.opt(f, "description"),
      fileId: file[0].mediaId,
      publishedAt: fd.date(f, "publishedAt") ?? existing?.publishedAt ?? (publishStatus === "PUBLISHED" ? new Date() : null),
    };
    if (id) await db.publication.update({ where: { id }, data });
    else await db.publication.create({ data });
    await audit({ userId: user.id, action: id ? "publication.update" : "publication.create", entityType: "Publication", summary: `${id ? "Updated" : "Added"} publication “${title}”` });
    refresh("/insights/publications", "/admin/publications");
    return { success: id ? "Publication saved." : "Publication added." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─────────────────────────── Leadership
export async function saveLeader(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("leadership.manage");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      await db.leadershipProfile.delete({ where: { id } });
      await audit({ userId: user.id, action: "leadership.delete", entityType: "LeadershipProfile", entityId: id, summary: "Deleted a leadership profile" });
      refresh("/about/governance", "/admin/leadership");
      return { success: "Profile deleted." };
    }
    const name = z.string().min(2, "Enter a name").max(120).parse(fd.str(f, "name"));
    const position = z.string().min(2, "Enter a position").max(160).parse(fd.str(f, "position"));
    const linkedin = fd.opt(f, "linkedin");
    if (linkedin && !/^https:\/\//.test(linkedin)) return { error: "LinkedIn must be a full https:// URL." };
    const photo = await parseMedia(f, "photo");
    const data = {
      name,
      position,
      group: z.enum(["BOARD", "EXECUTIVE", "MANAGEMENT"]).parse(fd.str(f, "group") || "EXECUTIVE"),
      bio: fd.opt(f, "bio"),
      linkedin,
      order: fd.int(f, "order") ?? 0,
      published: fd.bool(f, "published"),
      photoId: photo[0]?.mediaId ?? null,
    };
    if (id) await db.leadershipProfile.update({ where: { id }, data });
    else await db.leadershipProfile.create({ data });
    await audit({ userId: user.id, action: id ? "leadership.update" : "leadership.create", entityType: "LeadershipProfile", summary: `${id ? "Updated" : "Added"} leadership profile: ${name}` });
    refresh("/about/governance", "/admin/leadership");
    return { success: id ? "Profile saved." : "Profile added." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─────────────────────────── Pages
export async function savePage(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("pages.manage");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      await db.page.delete({ where: { id } });
      await audit({ userId: user.id, action: "page.delete", entityType: "Page", entityId: id, summary: "Deleted a page" });
      refresh("/admin/pages");
      return { success: "Page deleted." };
    }
    const title = z.string().min(2, "Enter a title").max(160).parse(fd.str(f, "title"));
    const body = z.string().min(10, "Enter the page content").max(100000).parse(fd.str(f, "body"));
    const slug = slugify(fd.str(f, "slug") || title);
    const data = { title, body, slug, metaDescription: fd.opt(f, "metaDescription"), published: fd.bool(f, "published") };
    const saved = id ? await db.page.update({ where: { id }, data }) : await db.page.create({ data });
    await audit({ userId: user.id, action: id ? "page.update" : "page.create", entityType: "Page", entityId: saved.id, summary: `${id ? "Updated" : "Created"} page “${title}”` });
    refresh(`/legal/${saved.slug}`, "/admin/pages");
    return { success: "Page saved." };
  } catch (err) {
    return handleActionError(err);
  }
}
