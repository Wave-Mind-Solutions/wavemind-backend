/**
 * AI Service
 * Secures the Gemini API requests on the backend
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Calls Gemini to analyze the project requirement
 */
const analyzeProject = async ({ title, description, budget, priority, techStack }) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const prompt = `
You are an expert software architect and project estimator at WaveMind Solutions, a premium software agency.

OFFICIAL WAVEMIND SOLUTIONS WEBSITE PRICE MATRIX (STRICT HARD MINIMUMS):
- Business Website: Min ₹15,000 | Recommended ₹35,000 | Max ₹1,00,000
- E-commerce: Min ₹30,000 | Recommended ₹75,000 | Max ₹3,00,000+
- Portfolio: Min ₹10,000 | Recommended ₹25,000 | Max ₹75,000
- Blog: Min ₹10,000 | Recommended ₹25,000 | Max ₹60,000
- Education Website: Min ₹20,000 | Recommended ₹50,000 | Max ₹1,50,000
- Booking / Service Website: Min ₹20,000 | Recommended ₹50,000 | Max ₹1,50,000
- Custom Website / Web App: Min ₹50,000 | Recommended ₹1,50,000 | Max ₹5,00,000+

STRICT PRICING RULES:
1. Suggested price MUST NEVER be below the category Minimum Price (e.g. finalPrice = Math.max(calculatedPrice, category.min)).
2. Prices must be calculated by taking Base Price + Page Complexity + Feature Complexity + Backend Complexity + Design Complexity + Integration Complexity + 3D/Animation Complexity.
3. If the client's stated budget is below the Minimum Price for their website type, clearly reject it in budgetFeedback and state: "The minimum development price for a [Category] at WaveMind Solutions is [Min Price]. Your current budget is below the minimum required for this project." then recommend the suggested minimum budget.
4. Format all monetary values in Indian Rupees (₹) using Indian numbering format (e.g., ₹15,000, ₹35,000, ₹1,00,000, ₹1,50,000).

A client has submitted the following project for analysis:

**Project Title:** ${title || "Not specified"}
**Project Description:** ${description}
**Client's Budget:** ${budget ? `₹${Number(budget).toLocaleString("en-IN")}` : "Not specified"}
**Priority Level:** ${priority || "Medium"}
**Tech Preferences:** ${techStack?.length ? techStack.join(", ") : "None specified"}

Analyze this project thoroughly and respond ONLY with a valid JSON object (no markdown, no code blocks, no explanation outside JSON) in exactly this structure:

{
  "projectType": "string (Business Website, E-commerce, Portfolio, Blog, Education Website, Booking / Service Website, or Custom Website / Web App)",
  "complexityLevel": "string (Basic / Professional / Premium / Enterprise)",
  "complexityScore": number (1-10),
  "estimatedCost": number (suggested final price in INR, MUST be >= category min),
  "suggestedBudgetRange": "string (e.g. ₹30,000 – ₹45,000)",
  "techStack": ["array", "of", "recommended", "technologies", "max 7 items"],
  "recommendedApproach": "string (1-2 sentences about architecture approach)",
  "budgetFeedback": "string (brief comment explaining estimate based on complexity, or warning if below minimum)",
  "timeEstimate": "string (e.g. 3–4 weeks)",
  "teamRequired": ["array", "of", "roles", "needed"],
  "coreFeatures": ["array", "of", "essential", "features"],
  "riskFactors": ["array", "of", "key", "risks"],
  "optimizationTips": ["array", "of", "performance", "or", "cost", "tips"],
  "aiOpportunities": ["array", "of", "AI", "features"],
  "successScore": number (1-10),
  "recommendation": "string (1-2 sentence final recommendation)"
}

Be specific, practical, and tailored to the Indian market context. Use Indian Rupee (₹) for all monetary values.
`;

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API HTTP Error response:", errText);
    throw new Error(`Gemini API responded with status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Clean rawText of markdown JSON wrappers if any
  const cleaned = rawText.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON. Raw:", rawText);
    throw new Error("Failed to generate a clean structured analysis. Please try again.");
  }
};

/**
 * Calls Gemini to generate a response for the WaveMind Sales Assistant
 */
const generateSalesAssistantResponse = async (messages = []) => {
  if (!GEMINI_API_KEY) {
    return "Hello! I am the WaveMind AI Sales Assistant. I can help recommend the right website solution, estimate budgets according to our official price matrix, and guide you to create your project request!";
  }

  const systemInstruction = `
You are the professional AI Sales Assistant for WaveMind Solutions, an elite software development company.
YOUR PRIMARY GOAL:
Understand the user's project, recommend the correct website solution, collect useful project requirements, qualify the lead, and guide serious users toward creating a Project Request.

OFFICIAL WEBSITE PRICE MATRIX (STRICT HARD MINIMUMS):
- Business Website: Minimum ₹15,000 | Recommended ₹35,000 | Max ₹1,00,000
- E-commerce: Minimum ₹30,000 | Recommended ₹75,000 | Max ₹3,00,000+
- Portfolio: Minimum ₹10,000 | Recommended ₹25,000 | Max ₹75,000
- Blog: Minimum ₹10,000 | Recommended ₹25,000 | Max ₹60,000
- Education Website: Minimum ₹20,000 | Recommended ₹50,000 | Max ₹1,50,000
- Booking / Service Website: Minimum ₹20,000 | Recommended ₹50,000 | Max ₹1,50,000
- Custom Website / Web App: Minimum ₹50,000 | Recommended ₹1,50,000 | Max ₹5,00,000+

RULES:
1. NEVER recommend a price below the minimum price.
2. Ask ONE focused question at a time.
3. Be professional, concise, and helpful.
`;

  const formattedContents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  if (formattedContents.length === 0 || formattedContents[0].role !== "user") {
    formattedContents.unshift({
      role: "user",
      parts: [{ text: "Hello, I am interested in building a website." }],
    });
  }

  const payload = {
    contents: formattedContents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return "I'm experiencing a brief connection issue, but I'm here to help! What kind of website or web application are you looking to build?";
    }

    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Thank you! Could you please share more details about your website requirements?"
    );
  } catch (err) {
    console.error("Gemini Assistant Fetch Error:", err.message);
    return "I am ready to assist you with your software development project. What category of website are you planning?";
  }
};

module.exports = { analyzeProject, generateSalesAssistantResponse };
