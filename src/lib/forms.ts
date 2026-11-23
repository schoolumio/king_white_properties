/**
 * Public enquiry form definitions — shared by the client (React Hook Form + Zod)
 * and the server action (authoritative re-validation).
 */
import { z } from "zod";

const req = (label: string, max = 200) => z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const opt = (max = 200) => z.string().trim().max(max, "Too long").optional().or(z.literal(""));
const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(200);
const phone = z
  .string()
  .trim()
  .max(30, "Too long")
  .regex(/^[+()\d\s-]*$/, "Enter a valid telephone number")
  .optional()
  .or(z.literal(""));
const phoneRequired = z
  .string()
  .trim()
  .min(7, "Telephone is required")
  .max(30, "Too long")
  .regex(/^[+()\d\s-]+$/, "Enter a valid telephone number");
const consent = z.boolean().refine((v) => v === true, "Please accept the privacy notice to continue");
const message = (required: boolean, max = 4000) =>
  required ? z.string().trim().min(10, "Please provide a little more detail").max(max, "Message is too long") : opt(max);
const futureDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || new Date(v).getTime() >= new Date(new Date().toDateString()).getTime(), "Choose a future date");

const relation = { relatedId: opt(40) };

export const FORM_SCHEMAS = {
  general: z.object({
    topic: z.enum(["GENERAL", "PROPERTY", "AUTOMOTIVE", "INVESTMENT"]),
    name: req("Full name", 120),
    email,
    phone,
    organisation: opt(160),
    subject: req("Subject", 160),
    message: message(true),
    consent,
  }),
  property: z.object({
    ...relation,
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    message: message(false),
    consent,
  }),
  inspection: z.object({
    ...relation,
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    preferredDate: futureDate,
    preferredTime: opt(40),
    attendees: opt(3),
    message: message(false),
    consent,
  }),
  development: z.object({
    ...relation,
    interest: z.enum(["UNITS", "INVESTMENT", "PARTNERSHIP", "INFORMATION"]),
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    organisation: opt(160),
    message: message(false),
    consent,
  }),
  vehicle: z.object({
    ...relation,
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    message: message(false),
    consent,
  }),
  testDrive: z.object({
    ...relation,
    requestType: z.enum(["TEST_DRIVE", "VEHICLE_INSPECTION"]),
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    preferredDate: futureDate,
    preferredTime: opt(40),
    message: message(false),
    consent,
  }),
  fleet: z.object({
    organisation: req("Organisation name", 160),
    name: req("Contact person", 120),
    position: opt(120),
    email,
    phone: phoneRequired,
    vehicleCategory: req("Vehicle category", 120),
    quantity: z.string().trim().regex(/^\d{1,5}$/, "Enter a quantity").refine((v) => Number(v) >= 1, "Enter a quantity"),
    budgetRange: opt(120),
    timeline: opt(120),
    acquisitionMode: opt(40),
    message: message(false),
    consent,
  }),
  sourcing: z.object({
    name: req("Full name", 120),
    email,
    phone: phoneRequired,
    make: req("Make", 60),
    model: req("Model", 60),
    yearFrom: z.string().trim().regex(/^(\d{4})?$/, "Enter a four-digit year").optional().or(z.literal("")),
    yearTo: z.string().trim().regex(/^(\d{4})?$/, "Enter a four-digit year").optional().or(z.literal("")),
    budget: opt(120),
    condition: opt(60),
    country: opt(80),
    message: message(false),
    consent,
  }),
  investment: z.object({
    ...relation,
    investorType: req("Investor type", 80),
    name: req("Full name", 120),
    organisation: opt(160),
    position: opt(120),
    email,
    phone: phoneRequired,
    country: req("Country", 80),
    interest: opt(160),
    indicativeRange: opt(120),
    message: message(true),
    consent,
  }),
  partnership: z.object({
    organisation: req("Organisation name", 160),
    organisationType: req("Organisation type", 80),
    name: req("Contact person", 120),
    position: req("Position or designation", 120),
    email,
    phone: phoneRequired,
    country: req("Country", 80),
    category: req("Partnership category", 120),
    message: message(true, 6000),
    estimatedValue: opt(120),
    consent,
  }),
} as const;

export type FormType = keyof typeof FORM_SCHEMAS;
export type FormValues<T extends FormType> = z.infer<(typeof FORM_SCHEMAS)[T]>;

export const ORGANISATION_TYPES = [
  "Government / public sector",
  "Financial institution",
  "International development organisation",
  "Corporate organisation",
  "Institutional investor",
  "Private investor / family office",
  "Developer / contractor",
  "Supplier / commercial partner",
  "Non-profit organisation",
  "Other",
];

export const INVESTOR_TYPES = [
  "Individual investor",
  "Family office",
  "Institutional investor",
  "Financial institution",
  "Corporate investor",
  "Development finance institution",
  "Other",
];

export const FLEET_CATEGORIES = [
  "Executive / luxury vehicles",
  "Saloon cars",
  "SUVs",
  "Pickups",
  "Vans & minibuses",
  "Buses",
  "Trucks",
  "Electric vehicles",
  "Mixed fleet",
];

export const BUDGET_RANGES = [
  "Under ₦50 million",
  "₦50 – 200 million",
  "₦200 – 500 million",
  "₦500 million – ₦1 billion",
  "Above ₦1 billion",
  "To be discussed",
];

export const TIMELINES = ["Immediately", "Within 1 month", "1 – 3 months", "3 – 6 months", "6 – 12 months", "Planning stage"];

export const PREFERRED_TIMES = ["Morning (9am – 12pm)", "Afternoon (12pm – 3pm)", "Late afternoon (3pm – 5pm)"];

export const PARTNERSHIP_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
export const PARTNERSHIP_DOCUMENT_MAX = 4 * 1024 * 1024;
