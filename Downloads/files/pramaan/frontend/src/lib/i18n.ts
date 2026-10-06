export type Locale = "en" | "hi";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
];

export const UI: Record<Locale, Record<string, string>> = {
  en: {
    "nav.assistant": "Assistant",
    "nav.finder": "Standard Finder",
    "nav.standards": "Standards",
    "nav.labs": "Labs",
    "nav.guide": "Certification Guide",
    "nav.consumer": "Consumer Corner",
    "nav.insights": "Insights",
    "chat.title": "Ask about any Indian Standard",
    "chat.placeholder": "e.g. Which BIS standard applies to TMT steel bars?",
    "chat.you": "You",
    "chat.ai": "Pramaan AI",
    "chat.sources": "Cited sources",
    "chat.suggested": "Ask next",
    "chat.thinking": "Retrieving from BIS knowledge base",
    "chat.disclaimer":
      "Answers are generated from the built-in BIS knowledge base. Verify with the official Gazette / bis.gov.in before legal reliance.",
    "chat.new": "New conversation",
    "chat.hint": "Multilingual · source-cited",
  },
  hi: {
    "nav.assistant": "सहायक",
    "nav.finder": "मानक खोजें",
    "nav.standards": "मानक",
    "nav.labs": "प्रयोगशालाएँ",
    "nav.guide": "प्रमाणन गाइड",
    "nav.consumer": "उपभोक्ता कॉर्नर",
    "nav.insights": "विश्लेषण",
    "chat.title": "किसी भी भारतीय मानक के बारे में पूछें",
    "chat.placeholder": "जैसे: TMT स्टील बार पर कौन-सा BIS मानक लागू होता है?",
    "chat.you": "आप",
    "chat.ai": "प्रमाण AI",
    "chat.sources": "संदर्भित स्रोत",
    "chat.suggested": "आगे पूछें",
    "chat.thinking": "BIS ज्ञान-आधार से खोजा जा रहा है",
    "chat.disclaimer":
      "उत्तर अंतर्निहित BIS ज्ञान-आधार से तैयार किए गए हैं। कानूनी उपयोग से पहले bis.gov.in पर सत्यापित करें।",
    "chat.new": "नई बातचीत",
    "chat.hint": "बहुभाषी · स्रोत-उद्धृत",
  },
};

export function t(locale: Locale, key: string): string {
  return UI[locale]?.[key] ?? UI.en[key] ?? key;
}

export function detectLocale(text: string, fallback: Locale = "en"): Locale {
  // Devanagari unicode block
  return /[\u0900-\u097F]/.test(text) ? "hi" : fallback;
}
