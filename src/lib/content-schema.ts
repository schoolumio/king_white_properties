/**
 * CMS content registry. Every editable corporate content block is declared here
 * with its fields and default values. The admin CMS renders editors from these
 * descriptors and the public site reads values via getContent(key).
 *
 * Default photography references are placeholders for commissioned imagery and
 * can be replaced in Admin → Content.
 */

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea" | "markdown" | "url" | "email" | "color" | "image"; help?: string }
  | { name: string; label: string; type: "boolean"; help?: string }
  | { name: string; label: string; type: "stringList"; help?: string }
  | { name: string; label: string; type: "objectList"; fields: FieldDef[]; help?: string; itemLabel?: string }
  | { name: string; label: string; type: "group"; fields: FieldDef[]; help?: string };

export type SectionDef = {
  key: string;
  title: string;
  group: "Company" | "Homepage" | "Pages" | "Divisions" | "System";
  description: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
};

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=80`;

export const PLACEHOLDER_IMAGES = {
  architecture: U("photo-1486406146926-c627a92ad1ab"),
  automobile: U("photo-1503376780353-7e6692767b70"),
  office: U("photo-1497366216548-37526070297c"),
  residence: U("photo-1600596542815-ffad4c1539a9"),
  residence2: U("photo-1600585154340-be6161a56a0c"),
  automobile2: U("photo-1494976388531-d1058494cdd8"),
  automobile3: U("photo-1492144534655-ae79c964c9d7"),
  city: U("photo-1449824913935-59a10b8d2000"),
  meeting: U("photo-1556761175-5973dc0f32e7"),
  meeting2: U("photo-1600880292203-757bb62b4baf"),
  apartments: U("photo-1545324418-cc1a3fa10c00"),
  construction: U("photo-1541888946425-d81bb19240f5"),
  facade: U("photo-1554469384-e58fac16e23a"),
  fleet: U("photo-1580273916550-e323be2ae537"),
  office2: U("photo-1497366811353-6870744d04b2"),
};

const cta = (label: string): FieldDef => ({
  name: label,
  label: label === "primaryCta" ? "Primary button" : "Secondary button",
  type: "group",
  fields: [
    { name: "label", label: "Label", type: "text" },
    { name: "href", label: "Link", type: "text" },
  ],
});

const titled: FieldDef[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

export const CONTENT_SECTIONS: SectionDef[] = [
  // ───────────────────────── Company
  {
    key: "site",
    title: "Company information",
    group: "Company",
    description: "Name, contact details and social links used across the website, footer and emails.",
    fields: [
      { name: "companyName", label: "Company name", type: "text" },
      { name: "legalName", label: "Registered legal name", type: "text", help: "Shown in the footer copyright line. Leave blank to use the company name." },
      { name: "registration", label: "Registration statement", type: "text", help: "e.g. RC number. Only publish verified details." },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "description", label: "Corporate description", type: "textarea" },
      { name: "logo", label: "Logo (light background)", type: "image", help: "Optional. A wordmark is generated from the company name when empty." },
      { name: "logoInverse", label: "Logo (dark background)", type: "image" },
      { name: "country", label: "Country of operation", type: "text" },
      { name: "currency", label: "Primary currency code", type: "text" },
      { name: "email", label: "Corporate email", type: "email" },
      { name: "phone", label: "Telephone", type: "text" },
      { name: "phoneSecondary", label: "Secondary telephone", type: "text" },
      { name: "whatsapp", label: "WhatsApp number (international format)", type: "text" },
      { name: "address", label: "Head office address", type: "textarea" },
      { name: "officeHours", label: "Office hours", type: "text" },
      {
        name: "socials",
        label: "Social media",
        type: "group",
        fields: [
          { name: "linkedin", label: "LinkedIn URL", type: "url" },
          { name: "x", label: "X (Twitter) URL", type: "url" },
          { name: "instagram", label: "Instagram URL", type: "url" },
          { name: "facebook", label: "Facebook URL", type: "url" },
          { name: "youtube", label: "YouTube URL", type: "url" },
        ],
      },
    ],
    defaults: {
      companyName: "[COMPANY NAME]",
      legalName: "",
      registration: "",
      tagline: "Building Value. Enabling Mobility. Shaping Tomorrow.",
      description:
        "An integrated enterprise advancing real estate, infrastructure and automotive mobility through strategic investments, quality assets and long-term partnerships.",
      logo: "",
      logoInverse: "",
      country: "Nigeria",
      currency: "NGN",
      email: "",
      phone: "",
      phoneSecondary: "",
      whatsapp: "",
      address: "",
      officeHours: "",
      socials: { linkedin: "", x: "", instagram: "", facebook: "", youtube: "" },
    },
  },
  {
    key: "seo",
    title: "Search & social metadata",
    group: "Company",
    description: "Default metadata used where a page does not define its own.",
    fields: [
      { name: "defaultTitle", label: "Default page title", type: "text" },
      { name: "description", label: "Default meta description", type: "textarea" },
      { name: "ogImage", label: "Default social sharing image", type: "image" },
      { name: "keywords", label: "Keywords", type: "stringList" },
    ],
    defaults: {
      defaultTitle: "Real Estate, Infrastructure & Automotive Enterprise",
      description:
        "An integrated enterprise in real estate, infrastructure and automotive mobility — property development, premium vehicles, corporate fleet solutions, investment and strategic partnerships.",
      ogImage: "",
      keywords: ["real estate Nigeria", "property development", "luxury cars Nigeria", "corporate fleet solutions", "real estate investment", "joint venture partnerships"],
    },
  },
  {
    key: "theme",
    title: "Brand colours",
    group: "Company",
    description: "Corporate palette. Changes apply across the public website.",
    fields: [
      { name: "navy", label: "Midnight navy", type: "color" },
      { name: "graphite", label: "Graphite", type: "color" },
      { name: "ivory", label: "Warm ivory", type: "color" },
      { name: "gold", label: "Champagne gold (accent)", type: "color" },
      { name: "slate", label: "Slate grey", type: "color" },
    ],
    defaults: { navy: "#101D32", graphite: "#20252C", ivory: "#F5F3EE", gold: "#B89A62", slate: "#727B87" },
  },

  // ───────────────────────── Homepage
  {
    key: "home.hero",
    title: "Hero",
    group: "Homepage",
    description: "The opening screen of the website.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline lines", type: "stringList", help: "One line per entry." },
      { name: "statement", label: "Supporting statement", type: "textarea" },
      cta("primaryCta"),
      cta("secondaryCta"),
      { name: "imagePrimary", label: "Architectural image", type: "image" },
      { name: "imagePrimaryAlt", label: "Architectural image description", type: "text" },
      { name: "imageSecondary", label: "Automotive image", type: "image" },
      { name: "imageSecondaryAlt", label: "Automotive image description", type: "text" },
    ],
    defaults: {
      eyebrow: "Real Estate · Infrastructure · Automotive",
      headline: ["Building Value.", "Enabling Mobility.", "Shaping Tomorrow."],
      statement:
        "An integrated enterprise advancing real estate, infrastructure and automotive mobility through strategic investments, quality assets and long-term partnerships.",
      primaryCta: { label: "Explore Our Businesses", href: "/#divisions" },
      secondaryCta: { label: "Investment & Partnership Enquiries", href: "/partnerships#proposal" },
      imagePrimary: PLACEHOLDER_IMAGES.architecture,
      imagePrimaryAlt: "Contemporary high-rise architecture viewed from street level",
      imageSecondary: PLACEHOLDER_IMAGES.automobile,
      imageSecondaryAlt: "Premium sports automobile",
    },
  },
  {
    key: "home.intro",
    title: "Corporate introduction",
    group: "Homepage",
    description: "Introduces the group before individual products.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "lead", label: "Lead paragraph", type: "textarea" },
      { name: "body", label: "Body", type: "markdown" },
      { name: "image", label: "Image", type: "image" },
      { name: "imageAlt", label: "Image description", type: "text" },
      { name: "linkLabel", label: "Company profile link label", type: "text" },
    ],
    defaults: {
      eyebrow: "The Group",
      heading: "Beyond Assets. Building Lasting Value.",
      lead: "We are an integrated enterprise operating across two complementary markets: the places where people live and work, and the means by which they move.",
      body:
        "Our Real Estate & Infrastructure division acquires, develops, leases and manages residential and commercial property. Our Automotive & Mobility division supplies premium, commercial and fleet vehicles to individuals and organisations.\n\nBoth divisions operate independently, with dedicated teams and processes, while sharing one corporate governance framework, one client relationship standard and one long-term view of value.",
      image: PLACEHOLDER_IMAGES.office,
      imageAlt: "Executive office environment",
      linkLabel: "Read the company profile",
    },
  },
  {
    key: "home.divisions",
    title: "Business divisions",
    group: "Homepage",
    description: "The two-division showcase.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      {
        name: "realEstate",
        label: "Real Estate & Infrastructure",
        type: "group",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "capabilities", label: "Capabilities", type: "stringList" },
          { name: "image", label: "Image", type: "image" },
          { name: "imageAlt", label: "Image description", type: "text" },
        ],
      },
      {
        name: "automotive",
        label: "Automotive & Mobility",
        type: "group",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "capabilities", label: "Capabilities", type: "stringList" },
          { name: "image", label: "Image", type: "image" },
          { name: "imageAlt", label: "Image description", type: "text" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Our Businesses",
      heading: "Two Sectors. One Vision.",
      intro: "Each division is run by specialists with its own operations, catalogue and client team — supported by shared corporate standards.",
      realEstate: {
        title: "Real Estate & Infrastructure",
        description:
          "Residential and commercial property, land, development and asset management — delivered with discipline from acquisition through to long-term stewardship.",
        capabilities: [
          "Property acquisition",
          "Real estate development",
          "Residential & commercial property",
          "Leasing & management",
          "Investment opportunities",
          "Development partnerships",
        ],
        image: PLACEHOLDER_IMAGES.residence,
        imageAlt: "Contemporary residential architecture",
      },
      automotive: {
        title: "Automotive & Mobility",
        description:
          "Premium, commercial and fleet vehicles for individuals and organisations — sourced, inspected and supported by a dedicated mobility team.",
        capabilities: [
          "Vehicle sales",
          "Premium & luxury automobiles",
          "Commercial vehicles",
          "Corporate fleet solutions",
          "Vehicle leasing",
          "Mobility services",
        ],
        image: PLACEHOLDER_IMAGES.automobile2,
        imageAlt: "Premium automobile in profile",
      },
    },
  },
  {
    key: "home.featured",
    title: "Featured developments & vehicles",
    group: "Homepage",
    description: "Headings for the featured catalogue sections (records are selected with the “Featured” flag).",
    fields: [
      { name: "developmentsHeading", label: "Developments heading", type: "text" },
      { name: "developmentsIntro", label: "Developments introduction", type: "textarea" },
      { name: "vehiclesHeading", label: "Vehicles heading", type: "text" },
      { name: "vehiclesIntro", label: "Vehicles introduction", type: "textarea" },
    ],
    defaults: {
      developmentsHeading: "Developments That Create Lasting Value.",
      developmentsIntro: "A selection of projects across our real estate portfolio, from completed assets to developments in progress.",
      vehiclesHeading: "Mobility Without Compromise.",
      vehiclesIntro: "Selected vehicles from our current inventory, each presented with verified specifications and availability.",
    },
  },
  {
    key: "home.investment",
    title: "Investment & strategic opportunities",
    group: "Homepage",
    description: "Opportunity categories shown on the homepage and investment pages. Only list categories the company actively supports.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "categories", label: "Opportunity categories", type: "objectList", fields: titled, itemLabel: "Category" },
      { name: "image", label: "Image", type: "image" },
      { name: "imageAlt", label: "Image description", type: "text" },
    ],
    defaults: {
      eyebrow: "Investment & Partnerships",
      heading: "Capital. Collaboration. Long-Term Impact.",
      intro:
        "We engage with investors, institutions and enterprises on opportunities that align with our divisions and governance standards. Every engagement begins with a structured conversation.",
      categories: [
        { title: "Real estate development partnerships", description: "Co-development of residential, commercial and mixed-use projects." },
        { title: "Property investment opportunities", description: "Company-approved opportunities within our real estate portfolio." },
        { title: "Joint venture proposals", description: "Structured ventures with landowners, developers and capital partners." },
        { title: "Corporate fleet acquisition", description: "Vehicle procurement programmes for organisations of every size." },
        { title: "Institutional procurement", description: "Asset supply to public-sector and institutional buyers." },
        { title: "Strategic commercial partnerships", description: "Long-term collaboration with suppliers, financiers and service partners." },
        { title: "Infrastructure collaboration", description: "Participation in infrastructure that supports communities and commerce." },
      ],
      image: PLACEHOLDER_IMAGES.meeting2,
      imageAlt: "Corporate partners in discussion",
    },
  },
  {
    key: "home.principles",
    title: "Why the company",
    group: "Homepage",
    description: "Operating principles. Avoid unverified claims or metrics.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "items", label: "Principles", type: "objectList", fields: titled, itemLabel: "Principle" },
    ],
    defaults: {
      eyebrow: "Operating Principles",
      heading: "An Enterprise Built Around Long-Term Value.",
      intro: "The principles below shape how we select assets, structure partnerships and serve clients.",
      items: [
        { title: "Strategic thinking", description: "Decisions are made against a long horizon, with clear commercial logic." },
        { title: "Asset quality", description: "We prioritise well-located, well-specified and properly documented assets." },
        { title: "Operational discipline", description: "Defined processes for acquisition, inspection, documentation and handover." },
        { title: "Transparency", description: "Clear information, verified availability and honest communication at every stage." },
        { title: "Long-term partnerships", description: "Relationships structured for mutual, durable value rather than single transactions." },
        { title: "Customer confidence", description: "Dedicated relationship officers and accountable follow-through on every enquiry." },
      ],
    },
  },
  {
    key: "home.governance",
    title: "Governance & leadership introduction",
    group: "Homepage",
    description: "Governance pillars shown alongside leadership profiles.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "pillars", label: "Governance pillars", type: "objectList", fields: titled, itemLabel: "Pillar" },
    ],
    defaults: {
      eyebrow: "Governance",
      heading: "Leadership. Accountability. Direction.",
      intro: "Clear leadership, defined responsibilities and documented policies underpin how the group operates.",
      pillars: [
        { title: "Executive leadership", description: "Group direction set by an accountable executive team." },
        { title: "Corporate governance", description: "Oversight structures and decision rights defined across the group." },
        { title: "Organisational structure", description: "Independent divisions supported by shared corporate functions." },
        { title: "Compliance & policies", description: "Documented policies governing conduct, data and transactions." },
      ],
    },
  },
  {
    key: "home.insights",
    title: "Insights",
    group: "Homepage",
    description: "Insights and publications section heading.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
    ],
    defaults: {
      eyebrow: "Insights",
      heading: "Perspectives That Move Business Forward.",
      intro: "Announcements, market perspectives, project updates and corporate publications from across the group.",
    },
  },
  {
    key: "home.cta",
    title: "Closing call to action",
    group: "Homepage",
    description: "Final call to action before the footer.",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "statement", label: "Statement", type: "textarea" },
      cta("primaryCta"),
      cta("secondaryCta"),
      { name: "image", label: "Background image", type: "image" },
      { name: "imageAlt", label: "Image description", type: "text" },
    ],
    defaults: {
      heading: "Let's Build Something of Lasting Value.",
      statement:
        "Whether you are exploring an investment opportunity, seeking a strategic partner, acquiring premium assets or discussing institutional collaboration, we welcome meaningful conversations.",
      primaryCta: { label: "Discuss a Partnership", href: "/partnerships#proposal" },
      secondaryCta: { label: "Contact Our Team", href: "/contact" },
      image: PLACEHOLDER_IMAGES.city,
      imageAlt: "City skyline at dusk",
    },
  },

  // ───────────────────────── Pages
  {
    key: "about",
    title: "Company profile",
    group: "Pages",
    description: "About Us page — profile, vision, mission and values.",
    fields: [
      { name: "heading", label: "Page heading", type: "text" },
      { name: "lead", label: "Lead statement", type: "textarea" },
      { name: "profile", label: "Company profile", type: "markdown" },
      { name: "vision", label: "Vision", type: "textarea" },
      { name: "mission", label: "Mission", type: "textarea" },
      { name: "values", label: "Values", type: "objectList", fields: titled, itemLabel: "Value" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
      { name: "image2", label: "Supporting image", type: "image" },
      { name: "image2Alt", label: "Supporting image description", type: "text" },
    ],
    defaults: {
      heading: "An integrated enterprise for assets, investment and mobility.",
      lead: "We bring together real estate, infrastructure and automotive capabilities under one corporate group, with independent divisions and shared standards.",
      profile:
        "[COMPANY NAME] is a corporate group operating across Real Estate & Infrastructure and Automotive & Mobility.\n\nThe Real Estate & Infrastructure division is responsible for residential and commercial property, land acquisition and sales, property development, leasing, property management and development partnerships.\n\nThe Automotive & Mobility division supplies new and pre-owned vehicles, premium and luxury automobiles, commercial vehicles and corporate fleet solutions, including sourcing, leasing and acquisition support.\n\n*Replace this profile with the company's approved corporate narrative in Admin → Content → Company profile.*",
      vision: "To be a trusted enterprise creating lasting value through quality assets, dependable mobility and enduring partnerships.",
      mission:
        "To develop, supply and manage real estate and automotive assets with discipline and transparency, serving individuals, organisations and institutions over the long term.",
      values: [
        { title: "Integrity", description: "We do what we say, and we document what we do." },
        { title: "Excellence", description: "We hold our assets and our service to an institutional standard." },
        { title: "Accountability", description: "Every client relationship and transaction has a clear owner." },
        { title: "Partnership", description: "We build relationships that endure beyond a single transaction." },
      ],
      image: PLACEHOLDER_IMAGES.facade,
      imageAlt: "Glass facade of a commercial building",
      image2: PLACEHOLDER_IMAGES.meeting,
      image2Alt: "Leadership team in a working session",
    },
  },
  {
    key: "governance",
    title: "Corporate governance",
    group: "Pages",
    description: "Governance page content. Policies are published as documents under Publications (category: Policy).",
    fields: [
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "framework", label: "Governance framework", type: "markdown" },
      { name: "structure", label: "Organisational structure", type: "markdown" },
      { name: "compliance", label: "Compliance information", type: "markdown" },
    ],
    defaults: {
      intro: "Our governance framework defines how decisions are made, how risk is managed and how accountability is maintained across the group.",
      framework: "",
      structure:
        "The group is organised as a parent company with two operating divisions:\n\n- **Real Estate & Infrastructure** — property, development, leasing and management\n- **Automotive & Mobility** — vehicle sales, fleet solutions, sourcing and leasing\n\nShared corporate functions provide governance, client relationship management, investor relations, finance and administration to both divisions.",
      compliance: "",
    },
  },
  {
    key: "investments.page",
    title: "Investor relations",
    group: "Pages",
    description: "Investments overview page.",
    fields: [
      { name: "heading", label: "Page heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "approach", label: "Investment approach", type: "markdown" },
      { name: "process", label: "Engagement process", type: "objectList", fields: titled, itemLabel: "Step" },
      { name: "disclaimer", label: "Investment disclaimer", type: "textarea" },
      { name: "contactName", label: "Investor relations contact name", type: "text" },
      { name: "contactEmail", label: "Investor relations email", type: "email" },
      { name: "contactPhone", label: "Investor relations telephone", type: "text" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
    ],
    defaults: {
      heading: "Investment & Institutional Engagement",
      intro:
        "We welcome conversations with investors, financial institutions and strategic partners on opportunities aligned with our real estate, infrastructure and mobility activities.",
      approach:
        "Every opportunity presented here has been approved by the company for discussion. Terms are shared only once they have been formally approved, and detailed documentation is provided to qualified parties on request.",
      process: [
        { title: "Initial enquiry", description: "Submit an enquiry or proposal. You will receive a reference number immediately." },
        { title: "Introductory discussion", description: "Our investor relations team reviews your submission and arranges a conversation." },
        { title: "Due diligence", description: "Qualified parties receive documentation under appropriate confidentiality." },
        { title: "Structuring", description: "Terms are agreed and documented with the relevant division and advisers." },
      ],
      disclaimer:
        "Information on this website does not constitute an offer to sell or a solicitation of an offer to buy any security or investment. No returns are guaranteed. All opportunities are subject to due diligence, contract and applicable law.",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      image: PLACEHOLDER_IMAGES.facade,
      imageAlt: "Commercial office architecture",
    },
  },
  {
    key: "partnerships.page",
    title: "Partnerships",
    group: "Pages",
    description: "Institutional partnerships page.",
    fields: [
      { name: "heading", label: "Page heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "categories", label: "Partnership categories", type: "objectList", fields: titled, itemLabel: "Category" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
    ],
    defaults: {
      heading: "Institutional & Strategic Partnerships",
      intro:
        "We work with public institutions, financiers, development organisations and enterprises to deliver real estate, infrastructure and mobility outcomes.",
      categories: [
        { title: "Government and public-sector partnerships", description: "Housing, infrastructure and fleet programmes with public institutions." },
        { title: "Financial institutions", description: "Mortgage, asset finance, leasing and project finance collaboration." },
        { title: "International development organisations", description: "Programmes supporting housing, mobility and sustainable urban growth." },
        { title: "Corporate partnerships", description: "Staff housing, executive mobility and corporate fleet programmes." },
        { title: "Institutional investors", description: "Structured participation in approved real estate opportunities." },
        { title: "Strategic joint ventures", description: "Co-development and co-investment with landowners and developers." },
        { title: "Suppliers and commercial partners", description: "Manufacturers, contractors, consultants and service providers." },
      ],
      image: PLACEHOLDER_IMAGES.meeting2,
      imageAlt: "Partners meeting in a boardroom",
    },
  },
  {
    key: "contact.page",
    title: "Contact page",
    group: "Pages",
    description: "Contact page content and office map.",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "latitude", label: "Office latitude", type: "text" },
      { name: "longitude", label: "Office longitude", type: "text" },
    ],
    defaults: {
      heading: "Start a conversation.",
      intro: "Tell us what you are looking for. Your enquiry is routed to the right team and you will receive a reference number immediately.",
      latitude: "",
      longitude: "",
    },
  },

  // ───────────────────────── Divisions
  {
    key: "realEstate.landing",
    title: "Real Estate landing page",
    group: "Divisions",
    description: "Content for /real-estate.",
    fields: [
      { name: "heading", label: "Hero heading", type: "text" },
      { name: "statement", label: "Hero statement", type: "textarea" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
      { name: "intro", label: "Division introduction", type: "markdown" },
      { name: "capabilities", label: "Capabilities", type: "objectList", fields: titled, itemLabel: "Capability" },
      { name: "managementHeading", label: "Property management heading", type: "text" },
      { name: "managementBody", label: "Property management description", type: "textarea" },
      { name: "managementServices", label: "Property management services", type: "stringList" },
      { name: "partnershipHeading", label: "Development partnerships heading", type: "text" },
      { name: "partnershipBody", label: "Development partnerships description", type: "textarea" },
      { name: "image2", label: "Supporting image", type: "image" },
      { name: "image2Alt", label: "Supporting image description", type: "text" },
    ],
    defaults: {
      heading: "Real Estate & Infrastructure",
      statement: "Residential, commercial and land assets — acquired, developed and managed for lasting value.",
      image: PLACEHOLDER_IMAGES.residence2,
      imageAlt: "Modern residence at dusk",
      intro:
        "Our real estate division covers the full property lifecycle: identifying and acquiring land, developing residential and commercial projects, and leasing and managing completed assets on behalf of owners and investors.",
      capabilities: [
        { title: "Land acquisition & sales", description: "Sourcing, verification and transfer of land with properly documented title." },
        { title: "Property development", description: "Residential, commercial and mixed-use projects from concept to completion." },
        { title: "Sales & leasing", description: "Homes, offices and commercial space for sale and lease." },
        { title: "Property management", description: "Tenant, maintenance and facility management for owners and investors." },
        { title: "Investment opportunities", description: "Company-approved opportunities for qualified investors." },
        { title: "Infrastructure", description: "Estate and enabling infrastructure delivered alongside our developments." },
      ],
      managementHeading: "Property management",
      managementBody: "We manage residential and commercial assets with the same discipline we apply to our own portfolio.",
      managementServices: ["Tenant sourcing and screening", "Rent collection and reporting", "Facility and maintenance management", "Service charge administration"],
      partnershipHeading: "Development partnerships",
      partnershipBody:
        "We partner with landowners, capital providers and institutions on joint development structures. Share your proposal and our development team will respond.",
      image2: PLACEHOLDER_IMAGES.construction,
      image2Alt: "Development site with tower crane",
    },
  },
  {
    key: "automotive.landing",
    title: "Automotive landing page",
    group: "Divisions",
    description: "Content for /automotive.",
    fields: [
      { name: "heading", label: "Hero heading", type: "text" },
      { name: "statement", label: "Hero statement", type: "textarea" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
      { name: "intro", label: "Division introduction", type: "markdown" },
      { name: "capabilities", label: "Services", type: "objectList", fields: titled, itemLabel: "Service" },
      { name: "sourcingHeading", label: "Vehicle sourcing heading", type: "text" },
      { name: "sourcingBody", label: "Vehicle sourcing description", type: "textarea" },
      { name: "leasingHeading", label: "Leasing heading", type: "text" },
      { name: "leasingBody", label: "Leasing description", type: "textarea" },
      { name: "image2", label: "Supporting image", type: "image" },
      { name: "image2Alt", label: "Supporting image description", type: "text" },
    ],
    defaults: {
      heading: "Automotive & Mobility",
      statement: "Premium, commercial and fleet vehicles — sourced with care, presented with clarity and supported beyond the sale.",
      image: PLACEHOLDER_IMAGES.automobile3,
      imageAlt: "Premium automobile on an open road",
      intro:
        "Our automotive division serves private clients, corporate organisations and institutions with new and pre-owned vehicles, fleet procurement, vehicle sourcing and leasing.",
      capabilities: [
        { title: "New & pre-owned sales", description: "Vehicles presented with full specifications and verified availability." },
        { title: "Premium & luxury", description: "Executive and luxury automobiles for discerning clients." },
        { title: "Commercial vehicles", description: "Pickups, vans, trucks and buses for operational needs." },
        { title: "Corporate fleet", description: "Structured procurement and replacement programmes for organisations." },
        { title: "Vehicle sourcing", description: "We locate specific vehicles that are not currently in stock." },
        { title: "Inspection & acquisition support", description: "Pre-purchase inspection and documentation support." },
      ],
      sourcingHeading: "Can't find the vehicle you need?",
      sourcingBody: "Tell us the make, model and specification. Our sourcing team will search trusted channels and come back to you.",
      leasingHeading: "Leasing & mobility solutions",
      leasingBody: "Leasing structures for individuals and organisations, arranged with our financing partners where available.",
      image2: PLACEHOLDER_IMAGES.fleet,
      image2Alt: "Executive vehicle detail",
    },
  },
  {
    key: "fleet.page",
    title: "Corporate fleet solutions",
    group: "Divisions",
    description: "Content for /automotive/fleet-solutions.",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "offerings", label: "Offerings", type: "objectList", fields: titled, itemLabel: "Offering" },
      { name: "process", label: "Procurement process", type: "objectList", fields: titled, itemLabel: "Step" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Hero image description", type: "text" },
    ],
    defaults: {
      heading: "Corporate Fleet Solutions",
      intro:
        "A single accountable partner for organisational vehicle procurement — from executive cars to commercial fleets — with structured quotations and delivery planning.",
      offerings: [
        { title: "Fleet acquisition", description: "New fleet programmes specified around your operational requirements." },
        { title: "Multiple vehicle procurement", description: "Consolidated sourcing and pricing for volume orders." },
        { title: "Commercial vehicles", description: "Pickups, vans, trucks and buses for logistics and operations." },
        { title: "Executive vehicles", description: "Premium vehicles for leadership and protocol requirements." },
        { title: "Fleet replacement", description: "Planned renewal of ageing vehicles with minimal disruption." },
        { title: "Vehicle leasing", description: "Leasing structures that preserve capital, where available." },
        { title: "Fleet sourcing", description: "Specific models and specifications sourced to order." },
      ],
      process: [
        { title: "Requirement brief", description: "Share categories, quantities, budget and timeline." },
        { title: "Specification & quotation", description: "We propose vehicles and a formal quotation." },
        { title: "Procurement", description: "Documentation, inspection and payment milestones are agreed." },
        { title: "Delivery & handover", description: "Vehicles are delivered with documentation and handover." },
      ],
      image: PLACEHOLDER_IMAGES.fleet,
      imageAlt: "Fleet of executive vehicles",
    },
  },

  // ───────────────────────── System
  {
    key: "notifications",
    title: "Notification recipients",
    group: "System",
    description: "Who receives email alerts for new submissions. Separate multiple addresses with new lines.",
    fields: [
      { name: "defaultRecipients", label: "Default recipients (all categories)", type: "stringList" },
      { name: "realEstate", label: "Property, inspection & development enquiries", type: "stringList" },
      { name: "automotive", label: "Automotive, test drive & sourcing enquiries", type: "stringList" },
      { name: "fleet", label: "Fleet requests", type: "stringList" },
      { name: "investment", label: "Investment enquiries", type: "stringList" },
      { name: "partnership", label: "Partnership proposals", type: "stringList" },
      { name: "general", label: "General enquiries", type: "stringList" },
      { name: "acknowledge", label: "Send an acknowledgement email to the person who submitted", type: "boolean" },
    ],
    defaults: {
      defaultRecipients: [],
      realEstate: [],
      automotive: [],
      fleet: [],
      investment: [],
      partnership: [],
      general: [],
      acknowledge: true,
    },
  },
];

export function getSectionDef(key: string) {
  return CONTENT_SECTIONS.find((s) => s.key === key);
}
