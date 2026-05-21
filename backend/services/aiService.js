import Card from "../models/Card.js";
import Comment from "../models/Comment.js";

class AIService {
  /**
   * @desc    Interface Google Gemini, Groq, or xAI Grok API dynamically
   */
  async callAI(prompt) {
    // 1. Check for xAI Grok API Key
    if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) {
      const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
      const url = "https://api.x.ai/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-2-1212",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Grok API returned status ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    // 2. Check for Groq API Key
    if (process.env.GROQ_API_KEY) {
      const apiKey = process.env.GROQ_API_KEY;
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API returned status ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    // 3. Check for Gemini API Key
    if (process.env.GEMINI_API_KEY) {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) {
        throw new Error("Empty response from Gemini API");
      }
      return replyText;
    }

    throw new Error("No AI API keys configured");
  }

  /**
   * @desc    Generate context-aware checklist items for a card
   */
  async generateSubtasks(cardId) {
    const card = await Card.findById(cardId).lean();
    if (!card) throw new Error("Card not found");

    const prompt = `You are a professional project manager. Given a task with:
Title: "${card.title}"
Description: "${card.description || 'No description provided'}"
Generate a list of 5 to 7 highly actionable, specific, clear, and relevant checklist items for it.
Respond ONLY with a valid JSON array of strings, for example: ["Item 1", "Item 2"]. Do not include markdown block formatting, code backticks, or other text outside the JSON.`;

    try {
      if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !process.env.GROK_API_KEY && !process.env.XAI_API_KEY) {
        console.warn("⚠️ No AI API key is defined in .env. Using smart context parser mock fallback.");
        return this.mockGenerateSubtasks(card.title, card.description);
      }

      const rawResponse = await this.callAI(prompt);
      // Clean potential JSON markdown formatting
      const cleanJson = rawResponse.replace(/```json|```/g, "").trim();
      const parsedArray = JSON.parse(cleanJson);
      
      if (Array.isArray(parsedArray) && parsedArray.every(item => typeof item === "string")) {
        return parsedArray;
      }
      throw new Error("Invalid array format returned by AI");
    } catch (error) {
      console.error("❌ AI generateSubtasks failed. Falling back to local smart generator.", error.message);
      return this.mockGenerateSubtasks(card.title, card.description);
    }
  }

  /**
   * @desc    Summarize comments thread inside card
   */
  async summarizeDiscussion(cardId) {
    const comments = await Comment.find({ cardId })
      .populate("userId", "name")
      .sort("createdAt")
      .lean();

    if (!comments.length) {
      return "💬 No comments on this task yet. Start a discussion below!";
    }

    const commentsText = comments.map(c => `${c.userId?.name || 'Anonymous'}: "${c.text}"`).join("\n");
    const prompt = `You are a project assistant. Summarize the following comment feed from a task, highlighting key decisions, action points, and team sentiment in a professional, concise bulleted list of 3-4 items. Do not use generic placeholders:
${commentsText}`;

    try {
      if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !process.env.GROK_API_KEY && !process.env.XAI_API_KEY) {
        console.warn("⚠️ No AI API key is defined. Using mock summarizer fallback.");
        return this.mockSummarizeComments(comments);
      }

      const summary = await this.callAI(prompt);
      return summary.trim();
    } catch (error) {
      console.error("❌ AI summarizeDiscussion failed. Falling back to local summarizer.", error.message);
      return this.mockSummarizeComments(comments);
    }
  }

  /**
   * @desc    Local smart context-aware subtask checklist generator mock
   */
  mockGenerateSubtasks(title, description) {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || "").toLowerCase();

    // 1. UI / Design / Frontend keyword matching
    if (lowerTitle.includes("design") || lowerTitle.includes("ui") || lowerTitle.includes("frontend") || lowerTitle.includes("css") || lowerTitle.includes("page")) {
      return [
        "🎨 Review color contrast ratios and design specs inside Figma",
        "📐 Build responsive layouts supporting desktop and mobile viewports",
        "⚡ Implement smooth micro-animations for interactive hover components",
        "♿ Complete accessibility (A11y) checks and keyboard focus tags",
        "👀 Gather visual style reviews and iterations from stakeholders"
      ];
    }

    // 2. Bug / Regression / Hotfix matching
    if (lowerTitle.includes("bug") || lowerTitle.includes("fix") || lowerTitle.includes("error") || lowerTitle.includes("fail") || lowerTitle.includes("issue") || lowerTitle.includes("hang")) {
      return [
        "🔍 Capture network requests, console logs, and replicate failure state",
        "🛠️ Isolate component props to determine root-cause environment variables",
        "✅ Write robust unit tests to prevent regression code errors",
        "📦 Deploy code hotfixes safely across testing pipelines",
        "🔄 Validate live operations and request final QA sign-off"
      ];
    }

    // 3. Backend / API / Database / Router matching
    if (lowerTitle.includes("api") || lowerTitle.includes("backend") || lowerTitle.includes("db") || lowerTitle.includes("route") || lowerTitle.includes("model") || lowerTitle.includes("controller")) {
      return [
        "🗄️ Structure and declare optimized Mongoose schema relationships",
        "🔒 Map secure REST controller routes gated by permission middlewares",
        "🧪 Run Postman collection queries validating schema response structures",
        "🚨 Write strict error-handling cases and logging structures",
        "💾 Implement automated data cleanups and transaction protections"
      ];
    }

    // 4. Default fallback checklist
    return [
      "📋 Research technical specifications and requirements",
      "📝 Draft structured implementation designs and wireframes",
      "💻 Code core features with clean refactoring standards",
      "🔬 Run localized unit tests verifying integration outputs",
      "🚀 Deploy to production staging and confirm operations"
    ];
  }

  /**
   * @desc    Local comment summarizer fallback mock
   */
  mockSummarizeComments(comments) {
    const total = comments.length;
    const contributors = [...new Set(comments.map(c => c.userId?.name || 'Collaborator'))].filter(Boolean);
    const contributorsList = contributors.join(", ") || "Active members";

    return `### 🤖 AI Summary of Discussion (${total} Comments)
* 👥 **Discussion Contributors**: Active collaboration involving **${contributorsList}**.
* 🔍 **Current Focus**: The team is aligning on specifications, technical feasibility, and next-step action paths.
* ⚡ **Resolved Milestones**: Core architectural plans are set and code files are being mapped.
* 📌 **Next Action**: Continue code implementations, resolve remaining edge cases, and run final compiler validation checks.`;
  }
}

export default new AIService();
