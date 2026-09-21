const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

function getAgentClient() {
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return {
      provider: "groq",
      client: groq,
      async generate({ system, prompt }) {
        const completion = await groq.chat.completions.create({
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: prompt },
          ],
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          temperature: 0.2,
        });
        return completion.choices[0]?.message?.content || "";
      },
    };
  }

  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    return {
      provider: "gemini",
      client: genAI,
      async generate({ system, prompt }) {
        const result = await model.generateContent([
          ...(system ? [{ text: system }] : []),
          { text: prompt },
        ]);
        return result.response.text();
      },
    };
  }

  throw new Error("Neither GROQ_API_KEY nor GEMINI_API_KEY is defined in environment variables");
}

module.exports = { getAgentClient };
