import type { FieldConfig } from "./enquiry-form";
import { BUDGET_RANGES, FLEET_CATEGORIES, INVESTOR_TYPES, ORGANISATION_TYPES, PREFERRED_TIMES, TIMELINES } from "@/lib/forms";

const name: FieldConfig = { name: "name", label: "Full name", required: true, autoComplete: "name" };
const email: FieldConfig = { name: "email", label: "Email address", type: "email", required: true, autoComplete: "email" };
const phoneReq: FieldConfig = { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel", placeholder: "+234" };

export const PRESETS = {
  general: [
    {
      name: "topic",
      label: "Nature of enquiry",
      type: "radio",
      options: [
        { value: "GENERAL", label: "Corporate" },
        { value: "PROPERTY", label: "Real estate" },
        { value: "AUTOMOTIVE", label: "Automotive" },
        { value: "INVESTMENT", label: "Investment" },
      ],
    },
    name,
    email,
    { name: "phone", label: "Telephone", type: "tel", autoComplete: "tel" },
    { name: "organisation", label: "Organisation", autoComplete: "organization" },
    { name: "subject", label: "Subject", required: true, span: 2 },
    { name: "message", label: "Message", type: "textarea", required: true },
  ],
  property: [name, email, phoneReq, { name: "message", label: "Message", type: "textarea", placeholder: "Tell us what you would like to know about this property." }],
  inspection: [
    name,
    email,
    phoneReq,
    { name: "preferredDate", label: "Preferred date", type: "date" },
    { name: "preferredTime", label: "Preferred time", type: "select", options: PREFERRED_TIMES },
    { name: "attendees", label: "Number of attendees", type: "number" },
    { name: "message", label: "Additional notes", type: "textarea" },
  ],
  development: [
    {
      name: "interest",
      label: "I am interested in",
      type: "radio",
      options: [
        { value: "UNITS", label: "Acquiring a unit" },
        { value: "INVESTMENT", label: "Investment" },
        { value: "PARTNERSHIP", label: "Partnership" },
        { value: "INFORMATION", label: "More information" },
      ],
    },
    name,
    email,
    phoneReq,
    { name: "organisation", label: "Organisation", autoComplete: "organization" },
    { name: "message", label: "Message", type: "textarea" },
  ],
  vehicle: [name, email, phoneReq, { name: "message", label: "Message", type: "textarea", placeholder: "Questions about this vehicle, financing, delivery or trade-in." }],
  testDrive: [
    {
      name: "requestType",
      label: "Request",
      type: "radio",
      options: [
        { value: "TEST_DRIVE", label: "Test drive" },
        { value: "VEHICLE_INSPECTION", label: "Vehicle inspection" },
      ],
    },
    name,
    email,
    phoneReq,
    { name: "preferredDate", label: "Preferred date", type: "date" },
    { name: "preferredTime", label: "Preferred time", type: "select", options: PREFERRED_TIMES },
    { name: "message", label: "Notes", type: "textarea" },
  ],
  fleet: [
    { name: "organisation", label: "Organisation name", required: true, autoComplete: "organization" },
    { name: "name", label: "Contact person", required: true, autoComplete: "name" },
    { name: "position", label: "Position", autoComplete: "organization-title" },
    { name: "email", label: "Corporate email", type: "email", required: true, autoComplete: "email" },
    phoneReq,
    { name: "vehicleCategory", label: "Vehicle category", type: "select", options: FLEET_CATEGORIES, required: true },
    { name: "quantity", label: "Quantity required", type: "number", required: true },
    { name: "budgetRange", label: "Budget range", type: "select", options: BUDGET_RANGES },
    { name: "timeline", label: "Procurement timeline", type: "select", options: TIMELINES },
    { name: "acquisitionMode", label: "Acquisition", type: "select", options: ["Outright purchase", "Lease", "Undecided"] },
    { name: "message", label: "Additional requirements", type: "textarea", placeholder: "Specifications, branding, delivery locations, after-sales support…" },
  ],
  sourcing: [
    { name: "make", label: "Desired make", required: true, placeholder: "e.g. Toyota" },
    { name: "model", label: "Model", required: true, placeholder: "e.g. Land Cruiser" },
    { name: "yearFrom", label: "Year from", placeholder: "e.g. 2022" },
    { name: "yearTo", label: "Year to", placeholder: "e.g. 2025" },
    { name: "budget", label: "Budget", placeholder: "e.g. ₦120 million" },
    { name: "condition", label: "Condition preference", type: "select", options: ["Brand new", "Foreign used", "Locally used", "Any"] },
    { name: "country", label: "Country preference", placeholder: "e.g. USA, UAE, Canada" },
    name,
    email,
    phoneReq,
    { name: "message", label: "Additional specifications", type: "textarea", placeholder: "Trim, colour, features, intended use…" },
  ],
  investment: [
    { name: "investorType", label: "Investor type", type: "select", options: INVESTOR_TYPES, required: true },
    name,
    { name: "organisation", label: "Organisation", autoComplete: "organization" },
    { name: "position", label: "Position", autoComplete: "organization-title" },
    email,
    phoneReq,
    { name: "country", label: "Country", required: true, autoComplete: "country-name" },
    { name: "indicativeRange", label: "Indicative investment range", placeholder: "Optional" },
    { name: "message", label: "Your enquiry", type: "textarea", required: true },
  ],
  partnership: [
    { name: "organisation", label: "Organisation name", required: true, autoComplete: "organization" },
    { name: "organisationType", label: "Organisation type", type: "select", options: ORGANISATION_TYPES, required: true },
    { name: "name", label: "Contact person", required: true, autoComplete: "name" },
    { name: "position", label: "Position or designation", required: true, autoComplete: "organization-title" },
    { name: "email", label: "Official email", type: "email", required: true, autoComplete: "email" },
    phoneReq,
    { name: "country", label: "Country", required: true, autoComplete: "country-name" },
    { name: "category", label: "Partnership category", type: "select", required: true },
    { name: "message", label: "Proposal summary", type: "textarea", required: true },
    { name: "estimatedValue", label: "Estimated project or partnership value", span: 2 },
    { name: "document", label: "Supporting document", type: "file" },
  ],
} satisfies Record<string, FieldConfig[]>;

export function withOptions(fields: FieldConfig[], name: string, options: string[]) {
  return fields.map((f) => (f.name === name ? { ...f, options } : f));
}
