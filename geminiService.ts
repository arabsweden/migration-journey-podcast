
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Never embed an owner API key in the public GitHub Pages build.
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('ميزات التحليل والصوت تحتاج ربط خدمة Gemini آمنة. هذه النسخة العامة تعرض الواجهة فقط حالياً.');
  }
  return new GoogleGenAI({ apiKey });
};

const getAnalysisPrompt = (lang: 'ar' | 'en') => `
  Analyze this migration or asylum journey story. 
  Extract the following information in JSON format. 
  IMPORTANT: All text fields must be in ${lang === 'ar' ? 'Arabic' : 'English'}.

  1. Summary of the journey.
  2. Lessons learned as a list.
  3. Migration advice based on the context.
  4. A catchy and impactful Podcast Title.
  5. A DETAILED and EXTENDED Podcast Script between two people (Ahmed and Sarah). 
     - The conversation must be comprehensive and educational.
     - MANDATORY: Include clear explanations of relevant laws.
     - FOR EVERY LAW MENTIONED: Provide the exact legal article/paragraph numbers (e.g., 'Article 4 of the Swedish Aliens Act (2005:716)') and the URL to the official government website or legal database (e.g., 'riksdagen.se' or 'migrationsverket.se').
     - Ahmed should act as a legal expert and Sarah as a social commentator, ensuring the citations are woven naturally into the dialogue.
     - Mention official sources such as Migrationsverket or the UN Refugee Agency (UNHCR).
     - The script should feel like a professional legal and social analysis episode, balancing personal story with deep legal insight.
  6. Related Resources (title and description) as a list. Include Swedish legal associations (e.g., Flyktinggruppernas riksråd - FARR) and official Swedish migration sources (Migrationsverket).
  7. Asylum Probability: Level (High, Medium, Low) and reasoning.
  8. Acceptance Tips: List of practical tips.
  9. Legal Context: Target country and key related laws. MANDATORY: Specifically include relevant sections of the Swedish Aliens Act (Utlänningslagen) if the destination is Sweden or Europe.
  10. Categories: origin country, destination country, and primary reason.
`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    lessons: { type: Type.ARRAY, items: { type: Type.STRING } },
    migrationAdvice: { type: Type.STRING },
    podcastTitle: { type: Type.STRING },
    podcastScript: { type: Type.STRING },
    relatedResources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "description"]
      }
    },
    asylumProbability: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING },
        reasoning: { type: Type.STRING }
      },
      required: ["level", "reasoning"]
    },
    acceptanceTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    legalContext: {
      type: Type.OBJECT,
      properties: {
        country: { type: Type.STRING },
        laws: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["country", "laws"]
    },
    categories: {
      type: Type.OBJECT,
      properties: {
        origin: { type: Type.STRING },
        destination: { type: Type.STRING },
        reason: { type: Type.STRING }
      },
      required: ["origin", "destination", "reason"]
    }
  },
  required: [
    "summary", "lessons", "migrationAdvice", "podcastTitle", 
    "podcastScript", "relatedResources", "asylumProbability", 
    "acceptanceTips", "legalContext", "categories"
  ]
};

export const transcribeAudio = async (base64Audio: string, mimeType: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const prompt = lang === 'ar' 
    ? "قم بتفريغ هذا التسجيل الصوتي نصياً بدقة كما نُطق باللغة العربية. أعد النص فقط."
    : "Transcribe this audio exactly as spoken in English. Return only the text.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    ]
  });

  return response.text || "";
};

export const translateLegalContext = async (country: string, laws: string[]) => {
  const ai = getAI();
  const prompt = `Translate the following legal information into English. Return only the JSON.
  Country: ${country}
  Laws: ${laws.join(', ')}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          laws: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["country", "laws"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeMigrationImage = async (base64Image: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: getAnalysisPrompt(lang) }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeMigrationDocument = async (base64Data: string, mimeType: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: getAnalysisPrompt(lang) }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeMigrationLink = async (url: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: `Visit the following link and analyze the migration story there: ${url}\n\n${getAnalysisPrompt(lang)}` }
        ]
      }
    ],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeMigrationAudio = async (base64Audio: string, mimeType: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType } },
          { text: getAnalysisPrompt(lang) }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeMigrationText = async (text: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: `Analyze the following migration story:\n\n${text}\n\n${getAnalysisPrompt(lang)}` }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateIntroJingle = async (title: string, lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const prompt = lang === 'ar' 
    ? `قل بحماس وبصوت مذيع محترف: أهلاً بكم في بودكاست الهجرة القانوني. حلقة اليوم بعنوان: ${title}. حلقة دسمة بالتفاصيل القانونية، لنبدأ.`
    : `Say with high energy and professional announcer voice: Welcome to the Legal Migration Podcast. Today's episode: ${title}. A deep dive into legal details. Let's begin.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generatePodcastAudio = async (script: string, ahmedVoice: string = 'Kore', sarahVoice: string = 'Puck', lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const prompt = lang === 'ar'
    ? `حول الحوار التالي إلى بودكاست صوتي مطول بين أحمد وسارة، ركز على وضوح الأرقام القانونية والمصادر المذكورة:\n${script}`
    : `Convert the following dialogue into an extended audio podcast between Ahmed and Sarah. Focus on the clarity of law numbers and sources mentioned:\n${script}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: lang === 'ar' ? 'أحمد' : 'Ahmed',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: ahmedVoice } }
            },
            {
              speaker: lang === 'ar' ? 'سارة' : 'Sarah',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: sarahVoice } }
            }
          ]
        }
      }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateBriefTTS = async (text: string, voice: string = 'Zephyr', lang: 'ar' | 'en' = 'ar') => {
  const ai = getAI();
  const prompt = lang === 'ar'
    ? `بأسلوب موجز ومشوق كإعلان إذاعي قصير، اقرأ الملخص التالي في أقل من 25 ثانية:\n${text}`
    : `In a concise and engaging style like a short radio ad, read the following summary in less than 25 seconds:\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const decodeBase64Audio = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Utility to create a WAV blob from raw PCM 16-bit mono data (Gemini's default output)
export const createWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000) => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Channels
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  const blob = new Blob([header, pcmData], { type: 'audio/wav' });
  return blob;
};

export interface AudioPlaybackSession {
  source: AudioBufferSourceNode;
  context: AudioContext;
  buffer: AudioBuffer;
  gainNode: GainNode;
  pcmData: Uint8Array;
}

export const setupAudioSession = async (audioData: Uint8Array): Promise<AudioPlaybackSession> => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(audioData.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioCtx.createBuffer(numChannels, frameCount, 24000);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(gainNode);
  
  return { source, context: audioCtx, buffer, gainNode, pcmData: audioData };
};
