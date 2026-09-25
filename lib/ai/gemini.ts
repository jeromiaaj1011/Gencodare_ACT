// Google Gemini API Integration Layer with Structured JSON Contracts

interface GeminiRequestOptions {
  systemInstruction?: string;
  prompt: string;
  responseSchema?: any;
}

export async function callGemini(options: GeminiRequestOptions): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null; // Signals fallback to deterministic cognitive engine
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: options.prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
      },
    };

    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}. Falling back to deterministic engine.`);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (error) {
    console.warn("Failed to communicate with Gemini API. Seamlessly falling back to deterministic engine:", error);
    return null;
  }
}
