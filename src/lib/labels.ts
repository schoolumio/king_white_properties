import type {
  ArticleType,
  BodyType,
  FuelType,
  ListingType,
  OpportunitySector,
  OpportunityStatus,
  ProjectStatus,
  PropertySector,
  PropertyStatus,
  PublicationCategory,
  Transmission,
  UnitStatus,
  VehicleAvailability,
  VehicleCondition,
} from "@prisma/client";

export const SECTOR_LABELS: Record<PropertySector, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INDUSTRIAL: "Industrial",
  LAND: "Land",
  MIXED_USE: "Mixed-use",
};

export const LISTING_LABELS: Record<ListingType, string> = { SALE: "For Sale", LEASE: "For Lease", SALE_OR_LEASE: "Sale or Lease" };

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  AVAILABLE: "Available",
  UNDER_OFFER: "Under Offer",
  SOLD: "Sold",
  LEASED: "Leased",
  OFF_MARKET: "Off Market",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  UPCOMING: "Upcoming",
  UNDER_DEVELOPMENT: "Under Development",
  COMPLETED: "Completed",
  AVAILABLE_FOR_ACQUISITION: "Available for Acquisition",
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Available",
  LIMITED: "Limited availability",
  SOLD_OUT: "Sold out",
  COMING_SOON: "Coming soon",
};

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  NEW: "Brand New",
  FOREIGN_USED: "Foreign Used",
  LOCALLY_USED: "Locally Used",
  CERTIFIED_PRE_OWNED: "Certified Pre-Owned",
};

export const BODY_LABELS: Record<BodyType, string> = {
  SUV: "SUV",
  SEDAN: "Sedan",
  COUPE: "Coupe",
  HATCHBACK: "Hatchback",
  CONVERTIBLE: "Convertible",
  WAGON: "Wagon",
  PICKUP: "Pickup",
  VAN: "Van",
  TRUCK: "Truck",
  BUS: "Bus",
  OTHER: "Other",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = { AUTOMATIC: "Automatic", MANUAL: "Manual", OTHER: "Other" };

export const FUEL_LABELS: Record<FuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  PLUG_IN_HYBRID: "Plug-in Hybrid",
  ELECTRIC: "Electric",
  CNG: "CNG",
  OTHER: "Other",
};

export const AVAILABILITY_LABELS: Record<VehicleAvailability, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  IN_TRANSIT: "In Transit",
  ON_ORDER: "On Order",
  SOLD: "Sold",
};

export const OPPORTUNITY_SECTOR_LABELS: Record<OpportunitySector, string> = {
  REAL_ESTATE: "Real Estate",
  INFRASTRUCTURE: "Infrastructure",
  AUTOMOTIVE: "Automotive & Mobility",
  CORPORATE: "Corporate",
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  COMING_SOON: "Coming Soon",
  OPEN: "Open for Discussion",
  UNDER_REVIEW: "Under Review",
  FULLY_SUBSCRIBED: "Fully Subscribed",
  CLOSED: "Closed",
};

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  ANNOUNCEMENT: "Corporate Announcement",
  COMPANY_NEWS: "Company News",
  REAL_ESTATE_INSIGHT: "Real Estate Insight",
  AUTOMOTIVE_INSIGHT: "Automotive Insight",
  PROJECT_UPDATE: "Project Update",
};

export const PUBLICATION_LABELS: Record<PublicationCategory, string> = {
  CORPORATE_PROFILE: "Corporate Profile",
  ANNUAL_REPORT: "Annual Report",
  BROCHURE: "Brochure",
  POLICY: "Policy",
  RESEARCH: "Research",
  PRESS_RELEASE: "Press Release",
  OTHER: "Other",
};
