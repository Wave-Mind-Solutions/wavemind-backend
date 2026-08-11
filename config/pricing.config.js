/**
 * WaveMind Solutions – Centralized AI Website Pricing Engine (Backend)
 * Official Baseline Price Matrix & Calculation Engine
 */

const OFFICIAL_WEBSITE_PRICING = {
  business: {
    key: "business",
    label: "Business Website",
    min: 15000,
    recommended: 35000,
    max: 100000,
    description: "Corporate, small business, & company landing sites",
    aliases: ["business", "business website", "corporate", "company"]
  },
  ecommerce: {
    key: "ecommerce",
    label: "E-commerce",
    min: 30000,
    recommended: 75000,
    max: 300000,
    description: "Online stores, product catalogs, cart & checkout systems",
    aliases: ["e-commerce", "ecommerce", "online store", "shop", "shopping app"]
  },
  portfolio: {
    key: "portfolio",
    label: "Portfolio",
    min: 10000,
    recommended: 25000,
    max: 75000,
    description: "Personal, creator, agency, & professional showcases",
    aliases: ["portfolio", "personal website", "resume", "showcase"]
  },
  blog: {
    key: "blog",
    label: "Blog",
    min: 10000,
    recommended: 25000,
    max: 60000,
    description: "Content hubs, news portals, & online publishing sites",
    aliases: ["blog", "magazine", "news portal", "content site"]
  },
  education: {
    key: "education",
    label: "Education Website",
    min: 20000,
    recommended: 50000,
    max: 150000,
    description: "LMS, course portals, schools, & educational institutions",
    aliases: ["education website", "education", "lms", "course portal", "school website", "learning platform"]
  },
  booking: {
    key: "booking",
    label: "Booking / Service Website",
    min: 20000,
    recommended: 50000,
    max: 150000,
    description: "Appointment scheduling, consultations, & service marketplaces",
    aliases: ["booking / service website", "booking", "service website", "appointment portal", "consultation"]
  },
  custom: {
    key: "custom",
    label: "Custom Website / Web App",
    min: 50000,
    recommended: 150000,
    max: 500000,
    description: "SaaS platforms, complex web applications, & enterprise systems",
    aliases: ["custom website / web app", "custom website", "custom", "web app", "saas", "custom web app", "enterprise"]
  }
};

/**
 * Format monetary amount in Indian Rupees (en-IN)
 */
function formatINR(amount) {
  const numeric = Math.max(0, Number(amount) || 0);
  return `₹${numeric.toLocaleString("en-IN")}`;
}

/**
 * Normalizes website type input string to match official pricing category
 */
function getPricingForCategory(inputType = "", customMatrix = null) {
  const matrix = customMatrix || OFFICIAL_WEBSITE_PRICING;
  const cleanInput = (inputType || "").toString().toLowerCase().trim();

  if (!cleanInput) {
    return matrix.business || OFFICIAL_WEBSITE_PRICING.business;
  }

  if (matrix[cleanInput]) {
    return matrix[cleanInput];
  }

  for (const key of Object.keys(matrix)) {
    const item = matrix[key];
    if (
      item.key.toLowerCase() === cleanInput ||
      item.label.toLowerCase() === cleanInput
    ) {
      return item;
    }

    if (
      item.aliases &&
      item.aliases.some(
        (alias) => cleanInput.includes(alias) || alias.includes(cleanInput)
      )
    ) {
      return item;
    }
  }

  if (
    cleanInput.includes("e-commerce") ||
    cleanInput.includes("ecommerce") ||
    cleanInput.includes("shop") ||
    cleanInput.includes("store")
  ) {
    return matrix.ecommerce || OFFICIAL_WEBSITE_PRICING.ecommerce;
  }
  if (cleanInput.includes("portfolio") || cleanInput.includes("resume")) {
    return matrix.portfolio || OFFICIAL_WEBSITE_PRICING.portfolio;
  }
  if (
    cleanInput.includes("blog") ||
    cleanInput.includes("news") ||
    cleanInput.includes("article")
  ) {
    return matrix.blog || OFFICIAL_WEBSITE_PRICING.blog;
  }
  if (
    cleanInput.includes("educat") ||
    cleanInput.includes("lms") ||
    cleanInput.includes("course") ||
    cleanInput.includes("school")
  ) {
    return matrix.education || OFFICIAL_WEBSITE_PRICING.education;
  }
  if (
    cleanInput.includes("book") ||
    cleanInput.includes("service") ||
    cleanInput.includes("appointment")
  ) {
    return matrix.booking || OFFICIAL_WEBSITE_PRICING.booking;
  }
  if (
    cleanInput.includes("custom") ||
    cleanInput.includes("saas") ||
    cleanInput.includes("app") ||
    cleanInput.includes("enterprise")
  ) {
    return matrix.custom || OFFICIAL_WEBSITE_PRICING.custom;
  }

  return matrix.business || OFFICIAL_WEBSITE_PRICING.business;
}

/**
 * Validate customer budget against category minimum price
 */
function validateBudget(categoryInput, budgetInput, customMatrix = null) {
  const category = getPricingForCategory(categoryInput, customMatrix);
  const budget = Number((budgetInput || "0").toString().replace(/[^\d]/g, "")) || 0;

  if (budget < category.min) {
    return {
      isValid: false,
      minRequired: category.min,
      category,
      message: `The minimum development price for ${category.label} at WaveMind Solutions is ${formatINR(category.min)}. Your current budget is below the minimum required for this project.`
    };
  }

  return {
    isValid: true,
    minRequired: category.min,
    category,
    message: `Budget is valid for ${category.label}.`
  };
}

module.exports = {
  OFFICIAL_WEBSITE_PRICING,
  getPricingForCategory,
  validateBudget,
  formatINR,
};
