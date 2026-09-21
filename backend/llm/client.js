const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function callLLM({ system, prompt, maxTokens = 1024 }) {
  // 1. Prioritize Groq API
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    let content = response.choices[0]?.message?.content || "";
    // If output is wrapped in ```json ... ``` fences, unwrap it
    if (content.includes("```")) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        content = match[1];
      }
    }
    return content.trim();
  }

  // 2. Fallback to Gemini if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: system,
    });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    if (text.includes("```")) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        text = match[1];
      }
    }
    return text.trim();
  }

  // 3. Fallback to Anthropic if ANTHROPIC_API_KEY is available
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  } catch {
    throw new Error(
      "No valid LLM provider configured. Please set GROQ_API_KEY in your .env file."
    );
  }
}

module.exports = { callLLM };