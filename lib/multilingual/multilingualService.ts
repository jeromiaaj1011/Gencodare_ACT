import { callGemini } from "../ai/gemini";

export interface MultilingualExplanation {
  language: string;
  nativeName: string;
  explanation: string;
  analogy: string;
  preservedTechnicalTerms: string[];
}

export const PRESERVED_TERMS = [
  "Call Stack",
  "Stack Frame",
  "Activation Record",
  "LIFO",
  "Return Address",
  "Memory Pointer",
  "DFS",
  "Recursion",
  "Base Case",
  "Heap",
  "Local Variables",
];

const PREBUILT_TRANSLATIONS: Record<string, MultilingualExplanation> = {
  ta: {
    language: "ta",
    nativeName: "தமிழ் (Tamil)",
    explanation:
      "ஒரு function மற்றொரு function-ஐ அழைக்கும் போது, அது பழைய function-ஐ அழிக்காது. கணினியின் Call Stack-ல் ஒவ்வொரு function invocation-க்கும் ஒரு தனிப்பட்ட Stack Frame ஒதுக்கப்படுகிறது. அழைக்கப்பட்ட குழந்தை function முடியும் வரை, பெற்றோர் function-ன் local variables பாதுகாப்பாக suspend நிலையில் இருக்கும்.",
    analogy:
      "நீங்கள் ஒரு புத்தகத்தைப் படித்துக் கொண்டிருக்கும் போது ஒரு குறிப்பை சரிபார்க்க மற்றொரு குறிப்பேட்டைத் திறப்பது போல. நீங்கள் அசல் புத்தகத்தை தூக்கி எறிய மாட்டீர்கள்; குறிப்பேட்டை முடித்துவிட்டு, புத்தகத்தில் விட்ட இடத்திலிருந்தே தொடர்வீர்கள்.",
    preservedTechnicalTerms: ["Call Stack", "Stack Frame", "function invocation", "local variables", "suspend"],
  },
  hi: {
    language: "hi",
    nativeName: "हिन्दी (Hindi)",
    explanation:
      "जब कोई function दूसरे function को कॉल करता है, तो वह पिछले function को overwrite नहीं करता। कंप्यूटर के Call Stack पर हर function invocation के लिए एक स्वतंत्र Stack Frame बनता है। जब तक child function समाप्त नहीं होता, तब तक parent function के local variables सुरक्षित रहते हैं।",
    analogy:
      "यह थाली के ढेर की तरह (LIFO) है। नई थाली ऊपर रखी जाती है। जब तक ऊपर की थाली नहीं हटती, नीचे की थाली वहीं सुरक्षित रहती है।",
    preservedTechnicalTerms: ["Call Stack", "Stack Frame", "function invocation", "local variables", "LIFO"],
  },
  te: {
    language: "te",
    nativeName: "తెలుగు (Telugu)",
    explanation:
      "ఒక function మరొక function-ని call చేసినప్పుడు, అది మునుపటి function-ని భర్తీ చేయదు. కంప్యూటర్ యొక్క Call Stack పై ప్రతి function invocation కొరకు ఒక ప్రత్యేక Stack Frame కేటాయించబడుతుంది. Child function పూర్తయ్యే వరకు parent function యొక్క local variables భద్రంగా నిలిపివేయబడి ఉంటాయి.",
    analogy:
      "మీరు ఒక పుస్తకం చదువుతూ మధ్యలో ఆగి నోట్స్ రాసుకున్నట్లు. నోట్స్ పూర్తయ్యాక, పుస్తకంలో ఆగిన పేజీ నుంచే మళ్ళీ చదవడం ప్రారంభిస్తారు.",
    preservedTechnicalTerms: ["Call Stack", "Stack Frame", "function invocation", "local variables"],
  },
};

export class MultilingualService {
  public static async getLocalizedExplanation(
    conceptId: string,
    languageCode: string
  ): Promise<MultilingualExplanation> {
    const lang = languageCode.toLowerCase();

    // Check pre-built verified translations first
    if (PREBUILT_TRANSLATIONS[lang]) {
      return PREBUILT_TRANSLATIONS[lang];
    }

    // Attempt live Gemini translation with strict term preservation
    const prompt = `
Translate this technical explanation into language "${languageCode}".
CRITICAL CONSTRAINT: You MUST preserve all programming keywords and technical computing terms (${PRESERVED_TERMS.join(
      ", "
    )}) strictly in English. Do NOT translate them literally into unnatural native words.

Concept: Call Stack & Execution Frames
Content: "When a function calls another, it does not overwrite the caller. The runtime pushes a separate Stack Frame in LIFO order, preserving all local variables until the child function returns."

Respond in JSON format:
{
  "language": "${languageCode}",
  "nativeName": "Native language name",
  "explanation": "Translated text with English technical terms preserved",
  "analogy": "Intuitive cultural real-world analogy in the language",
  "preservedTechnicalTerms": ["list of preserved English terms"]
}
`;

    const geminiText = await callGemini({
      prompt,
      systemInstruction: "You are ARCHAIA Multilingual Cognitive Bridge. Output ONLY raw JSON.",
    });

    if (geminiText) {
      try {
        const clean = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
      } catch (e) {
        console.warn("Failed to parse Gemini translation, using fallback:", e);
      }
    }

    // Default to Tamil or Hindi
    return PREBUILT_TRANSLATIONS["ta"];
  }
}
