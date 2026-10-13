
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  analyzeMigrationImage, 
  analyzeMigrationAudio, 
  analyzeMigrationText,
  analyzeMigrationDocument,
  analyzeMigrationLink,
  generatePodcastAudio, 
  generateIntroJingle,
  generateBriefTTS,
  decodeBase64Audio, 
  setupAudioSession,
  translateLegalContext,
  transcribeAudio,
  createWavBlob
} from './geminiService';
import { AnalysisResult, HistoryItem, Comment } from './types';
import { 
  ArrowUpTrayIcon, 
  MicrophoneIcon, 
  LightBulbIcon, 
  ChatBubbleLeftRightIcon, 
  PlayIcon, 
  StopIcon, 
  AcademicCapIcon, 
  ForwardIcon, 
  BackwardIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  MagnifyingGlassIcon, 
  ClockIcon, 
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  LinkIcon,
  BookmarkIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  ScaleIcon,
  MusicalNoteIcon,
  ShareIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  DocumentIcon,
  MapPinIcon,
  GlobeAltIcon,
  TagIcon,
  FunnelIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  InboxIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  ListBulletIcon,
  LanguageIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

type InputMode = 'image' | 'audio' | 'text' | 'document' | 'link';
type Language = 'ar' | 'en';

const VOICES = [
  { name: 'Kore', label: { ar: 'كوري (عميق)', en: 'Kore (Deep)' } },
  { name: 'Puck', label: { ar: 'بوك (رقيق)', en: 'Puck (Soft)' } },
  { name: 'Charon', label: { ar: 'شارون (هادئ)', en: 'Charon (Calm)' } },
  { name: 'Fenrir', label: { ar: 'فينرير (قوي)', en: 'Fenrir (Strong)' } },
  { name: 'Zephyr', label: { ar: 'زفير (ناعم)', en: 'Zephyr (Smooth)' } },
];

const translations = {
  ar: {
    appName: "محلل رحلات الهجرة",
    searchPlaceholder: "ابحث في القصص السابقة (البلد، السبب، الدروس)...",
    quickHistory: "السجل الأخير",
    noHistory: "لا يوجد سجل حالياً",
    resultsFor: "نتائج البحث عن",
    noResults: "عذراً، لم نجد نتائج",
    noResultsHint: "حاول البحث بكلمات أخرى مثل اسم البلد أو نوع التحدي.",
    resetSearch: "إعادة ضبط البحث",
    image: "صورة",
    audio: "صوت",
    text: "نص",
    document: "وثيقة",
    link: "رابط",
    uploadImage: "ارفع صورة لرحلة الهجرة",
    uploadImageHint: "سيقوم الذكاء الاصطناعي بتحليل المشهد والدروس",
    uploadDoc: "ارفع ملف PDF أو TXT",
    uploadDocHint: "قصص طويلة أو وثائق قانونية",
    analyzeNow: "بدء التحليل الآن",
    analyzing: "جاري التحليل...",
    analyzingHint: "نقوم باستخلاص الدروس، الحكمة، والفرص القانونية لرحلتك",
    textPlaceholder: "اكتب هنا تفاصيل قصة الهجرة التي ترغب في تحليلها...",
    linkPlaceholder: "أدخل رابط المقال أو الخبر...",
    recordAudio: "سجل قصتك بصوتك",
    startRecord: "ابدأ التسجيل",
    stopSend: "إيقاف وإرسال",
    origin: "المنشأ:",
    destination: "الوجهة:",
    migrationAdvice: "نصيحة الهجرة (هل ننصح بها؟)",
    lessonsLearned: "أهم الدروس المستفادة",
    asylumProbability: "فرص قبول اللجوء",
    asylumLevel: "المستوى:",
    legalContext: "السياق القانوني والمصادر",
    open: "فتح",
    share: "مشاركة التحليل",
    podcastSeries: "سلسلة بودكاست الهجرة (تحليل مفصل)",
    voiceSettings: "تخصيص الأصوات",
    ahmedVoice: "صوت أحمد",
    sarahVoice: "صوت سارة",
    preparingPodcast: "جاري تحضير البث الصوتي (بودكاست مفصل بالقوانين)...",
    heroTitle: "حلل رحلة الهجرة بذكاء",
    heroDescription: "وثق تجاربك، استخلص الدروس، وافهم السياق القانوني السويدي والأوروبي بالتفصيل مع أرقام القوانين والمصادر الرسمية.",
    successPodcast: "تم توليد البودكاست القانوني المفصل!",
    successComment: "تمت إضافة تعليقك!",
    shareSuccess: "تم نسخ الرابط!",
    cancel: "إلغاء",
    analyzeDoc: "تحليل الوثيقة",
    recording: "جاري التسجيل...",
    translateToEN: "ترجمة للإنجليزية",
    originalLang: "اللغة الأصلية",
    translating: "جاري الترجمة...",
    downloadPodcast: "تحميل البودكاست (WAV)",
    transcription: "النص الذي سجلته",
    checkTranscription: "تأكد من صحة النص، يمكنك حفظه أو نسخه قبل البدء بالتحليل:",
    confirmAnalysis: "تأكيد وتحليل الرحلة",
    swedishLawNote: "ملاحظة: التحليل يركز على بنود القانون السويدي (Utlänningslagen) ومصادر مصلحة الهجرة (Migrationsverket).",
    transcribing: "جاري تحويل صوتك إلى نص...",
    copyText: "نسخ النص",
    downloadText: "تحميل النص",
    exportFullAnalysis: "تصدير التحليل كاملاً (TXT)",
    copied: "تم النسخ!",
    audioSummary: "ملخص صوتي سريع",
    playingSummary: "جاري تشغيل الملخص...",
    translateLegal: "ترجمة القوانين للإنجليزية",
    preparingDownload: "جاري التجهيز للتحميل...",
    downloadDone: "تم التحميل بنجاح!",
    summaryLabel: "الملخص:",
    acceptanceTipsLabel: "نصائح القبول:",
    relatedResourcesLabel: "المصادر ذات الصلة:",
    reasonLabel: "سبب الرحلة:"
  },
  en: {
    appName: "Migration Journey Analyst",
    searchPlaceholder: "Search previous stories (Country, Reason, Lessons)...",
    quickHistory: "Quick History",
    noHistory: "No history found",
    resultsFor: "Results for",
    noResults: "Sorry, no results found",
    noResultsHint: "Try different keywords like country name or challenge type.",
    resetSearch: "Reset search",
    image: "Image",
    audio: "Audio",
    text: "Text",
    document: "Document",
    link: "Link",
    uploadImage: "Upload a journey image",
    uploadImageHint: "AI will analyze the scene and lessons",
    uploadDoc: "Upload PDF or TXT",
    uploadDocHint: "Long stories or legal documents",
    analyzeNow: "Start Analysis Now",
    analyzing: "Analyzing data...",
    analyzingHint: "Extracting lessons, wisdom, and legal context for your journey",
    textPlaceholder: "Write the details of the migration story you want to analyze here...",
    linkPlaceholder: "Enter the article or news link...",
    recordAudio: "Record your story with your voice",
    startRecord: "Start Recording",
    stopSend: "Stop & Send",
    origin: "Origin:",
    destination: "Destination:",
    migrationAdvice: "Migration Advice (Do we recommend it?)",
    lessonsLearned: "Key Lessons Learned",
    asylumProbability: "Asylum Acceptance Chances",
    asylumLevel: "Level:",
    legalContext: "Legal Context & Sources",
    open: "Open",
    share: "Share Analysis",
    podcastSeries: "Migration Podcast (Detailed Analysis)",
    voiceSettings: "Voice Settings",
    ahmedVoice: "Ahmed's Voice",
    sarahVoice: "Sarah's Voice",
    preparingPodcast: "Preparing detailed podcast with legal references...",
    heroTitle: "Smart Migration Journey Analysis",
    heroDescription: "Document your experiences, extract lessons, and understand Swedish and European legal context in detail with law numbers and official sources.",
    successPodcast: "Detailed legal podcast generated!",
    successComment: "Comment added!",
    shareSuccess: "Link copied!",
    cancel: "Cancel",
    analyzeDoc: "Analyze Document",
    recording: "Recording...",
    translateToEN: "Translate to English",
    originalLang: "Original Language",
    translating: "Translating...",
    downloadPodcast: "Download Podcast (WAV)",
    transcription: "Your Recorded Text",
    checkTranscription: "Verify the text. You can save or copy it before starting the analysis:",
    confirmAnalysis: "Confirm & Analyze Journey",
    swedishLawNote: "Note: Analysis prioritizes Swedish Aliens Act (Utlänningslagen) and Migrationsverket sources.",
    transcribing: "Converting speech to text...",
    copyText: "Copy Text",
    downloadText: "Download Text",
    exportFullAnalysis: "Export Full Analysis (TXT)",
    copied: "Copied!",
    audioSummary: "Audio Summary",
    playingSummary: "Playing summary...",
    translateLegal: "Translate Laws to English",
    preparingDownload: "Preparing for download...",
    downloadDone: "Download complete!",
    summaryLabel: "Summary:",
    acceptanceTipsLabel: "Acceptance Tips:",
    relatedResourcesLabel: "Related Resources:",
    reasonLabel: "Journey Reason:"
  }
};

const App: React.FC = () => {
  // Main Application State
  const [lang, setLang] = useState<Language>('ar');
  const [activeMode, setActiveMode] = useState<InputMode>('image');
  const [image, setImage] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<{ name: string; base64: string; type: string; size: string } | null>(null);
  const [urlLink, setUrlLink] = useState("");
  const [textStory, setTextStory] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Audio Input/Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Legal Context Translation State
  const [isLegalTranslated, setIsLegalTranslated] = useState(false);
  const [translatedLegal, setTranslatedLegal] = useState<{ country: string, laws: string[] } | null>(null);
  const [isTranslatingLegal, setIsTranslatingLegal] = useState(false);

  // Podcast Settings
  const [ahmedVoice, setAhmedVoice] = useState('Kore');
  const [sarahVoice, setSarahVoice] = useState('Puck');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Podcast Audio State
  const podcastPcmRef = useRef<Uint8Array | null>(null);
  const [isPodcastReady, setIsPodcastReady] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [isBriefPlaying, setIsBriefPlaying] = useState(false);
  const briefAudioRef = useRef<AudioBuffer | null>(null);
  const briefSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // History & Search State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const isSearching = searchTerm.trim().length > 0;

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for Audio
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const podcastSectionRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  const t = translations[lang];

  // Set document direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Persistence
  useEffect(() => {
    const savedHistory = localStorage.getItem('migration_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Sync volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lower = searchTerm.toLowerCase();
    return history.filter(item => 
      item.analysis.podcastTitle.toLowerCase().includes(lower) ||
      item.analysis.summary.toLowerCase().includes(lower) ||
      item.analysis.categories.origin.toLowerCase().includes(lower) ||
      item.analysis.categories.destination.toLowerCase().includes(lower) ||
      item.analysis.categories.reason.toLowerCase().includes(lower) ||
      item.analysis.legalContext.country.toLowerCase().includes(lower)
    );
  }, [history, searchTerm]);

  const addToHistory = (imageStr: string | null, analysisResult: AnalysisResult) => {
    const newId = Date.now().toString();
    const newItem: HistoryItem = {
      id: newId,
      timestamp: Date.now(),
      image: imageStr || "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&q=80&w=200", 
      analysis: analysisResult
    };
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
    setCurrentStoryId(newId);
    localStorage.setItem('migration_history', JSON.stringify(newHistory));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    stopAudio();
    stopBriefAudio();
    setResult(item.analysis);
    setCurrentStoryId(item.id);
    setImage(item.image);
    setSearchTerm("");
    setTranscription("");
    setRecordedBase64(null);
    audioBufferRef.current = null;
    podcastPcmRef.current = null;
    setIsPodcastReady(false);
    briefAudioRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setIsLegalTranslated(false);
    setTranslatedLegal(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerSuccess(t.copied);
  };

  const handleDownloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFullAnalysis = () => {
    if (!result) return;
    const content = `
${t.appName} - ${result.podcastTitle}
--------------------------------------------------
${t.origin} ${result.categories.origin}
${t.destination} ${result.categories.destination}
${t.reasonLabel} ${result.categories.reason}
--------------------------------------------------

${t.summaryLabel}
${result.summary}

${t.migrationAdvice}:
${result.migrationAdvice}

${t.lessonsLearned}:
${result.lessons.map((l, i) => `${i + 1}. ${l}`).join('\n')}

${t.acceptanceTipsLabel}
${result.acceptanceTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${t.asylumProbability}:
${t.asylumLevel} ${result.asylumProbability.level}
${result.asylumProbability.reasoning}

${t.legalContext} (${result.legalContext.country}):
${result.legalContext.laws.map((l, i) => `- ${l}`).join('\n')}

${t.relatedResourcesLabel}
${result.relatedResources.map(r => `- ${r.title}: ${r.description}`).join('\n')}

--------------------------------------------------
Generated by Migration Journey Analyst AI
    `.trim();
    handleDownloadText(content, `${result.podcastTitle.replace(/\s+/g, '_')}_Full_Analysis.txt`);
  };

  const stopAudio = (resetOffset = true) => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    if (resetOffset) {
      setCurrentTime(0);
      offsetRef.current = 0;
    }
  };

  const stopBriefAudio = () => {
    if (briefSourceRef.current) {
      try { briefSourceRef.current.stop(); } catch (e) {}
      briefSourceRef.current = null;
    }
    setIsBriefPlaying(false);
  };

  const handleBriefPlayToggle = async () => {
    if (!result?.summary) return;
    if (isBriefPlaying) {
      stopBriefAudio();
      return;
    }
    if (briefAudioRef.current) {
      playBriefBuffer(briefAudioRef.current);
      return;
    }
    setGeneratingBrief(true);
    try {
      const base64 = await generateBriefTTS(result.summary, 'Zephyr', lang);
      if (base64) {
        const audioBytes = decodeBase64Audio(base64);
        const session = await setupAudioSession(audioBytes);
        briefAudioRef.current = session.buffer;
        playBriefBuffer(session.buffer);
      }
    } catch (e) {
      alert("TTS brief generation failed.");
    } finally {
      setGeneratingBrief(false);
    }
  };

  const playBriefBuffer = (buffer: AudioBuffer) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    briefSourceRef.current = source;
    setIsBriefPlaying(true);
    source.onended = () => setIsBriefPlaying(false);
  };

  const playAtOffset = (offset: number) => {
    if (!audioBufferRef.current || !audioCtxRef.current || !gainNodeRef.current) return;
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
    }
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(gainNodeRef.current);
    offsetRef.current = offset;
    startTimeRef.current = performance.now() / 1000;
    source.start(0, offset);
    audioSourceRef.current = source;
    setIsPlaying(true);
    source.onended = () => {
      if (Math.abs(currentTime - duration) < 0.2) {
        setIsPlaying(false);
        setCurrentTime(0);
        offsetRef.current = 0;
      }
    };
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = requestAnimationFrame(updateProgress);
  };

  const updateProgress = () => {
    if (!isPlaying || !startTimeRef.current) return;
    const now = performance.now() / 1000;
    const elapsedSinceStart = (now - startTimeRef.current) * playbackRate;
    const newCurrentTime = Math.min(offsetRef.current + elapsedSinceStart, duration);
    setCurrentTime(newCurrentTime);
    if (newCurrentTime < duration) {
      timerRef.current = requestAnimationFrame(updateProgress);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      offsetRef.current = 0;
    }
  };

  const ensurePodcastAudio = async () => {
    if (podcastPcmRef.current) return podcastPcmRef.current;
    if (!result?.podcastScript || !result?.podcastTitle) return null;

    setGeneratingAudio(true);
    try {
      const [introBase64, mainBase64] = await Promise.all([
        generateIntroJingle(result.podcastTitle, lang),
        generatePodcastAudio(result.podcastScript, ahmedVoice, sarahVoice, lang)
      ]);

      if (mainBase64) {
        let finalAudioBytes: Uint8Array;
        const mainBytes = decodeBase64Audio(mainBase64);
        if (introBase64) {
          const introBytes = decodeBase64Audio(introBase64);
          finalAudioBytes = new Uint8Array(introBytes.length + mainBytes.length);
          finalAudioBytes.set(introBytes);
          finalAudioBytes.set(mainBytes, introBytes.length);
        } else {
          finalAudioBytes = mainBytes;
        }
        
        const session = await setupAudioSession(finalAudioBytes);
        audioBufferRef.current = session.buffer;
        audioCtxRef.current = session.context;
        gainNodeRef.current = session.gainNode;
        podcastPcmRef.current = finalAudioBytes;
        setDuration(session.buffer.duration);
        setIsPodcastReady(true);
        return finalAudioBytes;
      }
    } catch (error) {
      alert("Podcast generation failed.");
    } finally {
      setGeneratingAudio(false);
    }
    return null;
  };

  const handlePodcastPlayToggle = async () => {
    if (isPlaying) {
      offsetRef.current = currentTime;
      stopAudio(false);
      return;
    }
    if (audioBufferRef.current) {
      playAtOffset(offsetRef.current);
      return;
    }
    const bytes = await ensurePodcastAudio();
    if (bytes) {
      playAtOffset(0);
      triggerSuccess(t.successPodcast);
    }
  };

  const downloadPodcast = async () => {
    let bytes = podcastPcmRef.current;
    if (!bytes) {
      bytes = await ensurePodcastAudio();
    }
    if (!bytes || !result) return;
    
    const blob = createWavBlob(bytes);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.podcastTitle.replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSuccess(t.downloadDone);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setRecordedBase64(base64);
          setIsTranscribing(true);
          try {
            const text = await transcribeAudio(base64, 'audio/webm', lang);
            setTranscription(text);
          } catch (err) {
            console.error("Transcription failed", err);
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setTranscription("");
      setRecordedBase64(null);
      setRecordingTime(0);
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      alert("Microphone access failed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const processAudioAnalysis = async () => {
    if (!recordedBase64) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const data = await analyzeMigrationAudio(recordedBase64, 'audio/webm', lang);
      setResult(data);
      addToHistory(null, data);
      setRecordedBase64(null);
      setTranscription("");
    } catch (error) {
      alert("Audio analysis failed.");
    } finally { setAnalyzing(false); }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      let data;
      if (activeMode === 'image' && image) {
        data = await analyzeMigrationImage(image, lang);
        addToHistory(image, data);
      } else if (activeMode === 'text' && textStory.trim()) {
        data = await analyzeMigrationText(textStory, lang);
        addToHistory(null, data);
      } else if (activeMode === 'document' && docFile) {
        data = await analyzeMigrationDocument(docFile.base64, docFile.type, lang);
        addToHistory(null, data);
      } else if (activeMode === 'link' && urlLink.trim()) {
        data = await analyzeMigrationLink(urlLink, lang);
        addToHistory(null, data);
      }
      if (data) {
        setResult(data);
        setIsPodcastReady(false);
        podcastPcmRef.current = null;
      }
    } catch (error) {
      alert("Analysis failed.");
    } finally { setAnalyzing(false); }
  };

  const handleShare = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result);
    const encoded = btoa(encodeURIComponent(dataStr));
    const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    triggerSuccess(t.shareSuccess);
  };

  const handleLegalTranslateToggle = async () => {
    if (isLegalTranslated) { setIsLegalTranslated(false); return; }
    if (translatedLegal) { setIsLegalTranslated(true); return; }
    if (!result) return;
    setIsTranslatingLegal(true);
    try {
      const translation = await translateLegalContext(result.legalContext.country, result.legalContext.laws);
      setTranslatedLegal(translation);
      setIsLegalTranslated(true);
    } catch (error) { console.error(error); } finally { setIsTranslatingLegal(false); }
  };

  const handleTermAction = (term: string) => {
    setResult(null);
    setSearchTerm(term);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExternalSearch = (law: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(law + " " + (lang === 'ar' ? "لجوء هجرة" : "migration asylum"))}`, '_blank');
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.playbackRate.value = rate;
      offsetRef.current = currentTime;
      startTimeRef.current = performance.now() / 1000;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayLegalCountry = isLegalTranslated && translatedLegal ? translatedLegal.country : result?.legalContext.country;
  const displayLegalLaws = isLegalTranslated && translatedLegal ? translatedLegal.laws : result?.legalContext.laws;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 space-x-reverse border border-emerald-500/50 backdrop-blur-sm">
            <CheckCircleIcon className="w-6 h-6" />
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse shrink-0">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 cursor-pointer" onClick={() => { setResult(null); setSearchTerm(""); setTranscription(""); setRecordedBase64(null); }}>
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
              {t.appName}
            </h1>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse w-full md:max-w-lg relative">
            <div className="relative w-full group">
              <MagnifyingGlassIcon className={`w-5 h-5 absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600`} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${lang === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-2.5 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600`}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="p-2.5 rounded-2xl border bg-white border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2">
              <LanguageIcon className="w-6 h-6" />
              <span className="text-xs font-black uppercase">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button onClick={() => setShowHistory(!showHistory)} className={`p-2.5 rounded-2xl border transition-all ${showHistory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`} title={t.quickHistory}>
              <ClockIcon className="w-6 h-6" />
            </button>

            {showHistory && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in duration-200 max-h-[400px] overflow-y-auto z-50">
                <div className="p-4 border-b border-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">{t.quickHistory}</div>
                {history.length === 0 ? <div className="p-8 text-center text-slate-400 italic text-sm">{t.noHistory}</div> : 
                  history.slice(0, 5).map(item => (
                    <div key={item.id} onClick={() => loadHistoryItem(item)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer group transition-all">
                      <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{item.analysis.podcastTitle}</h4>
                        <span className="text-[10px] text-slate-400">{item.analysis.categories.origin} ➔ {item.analysis.categories.destination}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        {/* Input Area */}
        {!result && !analyzing && !isSearching && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-center py-16">
              <div className="relative inline-block mb-10">
                <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-10 animate-pulse"></div>
                <div className="relative bg-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border border-slate-100 rotate-6 group hover:rotate-0 transition-transform">
                  <SparklesIcon className="w-12 h-12 text-indigo-500" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-6">{t.heroTitle}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium">{t.heroDescription}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center p-1 bg-white border border-slate-200 rounded-[2rem] shadow-sm max-w-3xl mx-auto overflow-hidden mb-8">
              {[
                { id: 'image', label: t.image, icon: ArrowUpTrayIcon },
                { id: 'audio', label: t.audio, icon: MicrophoneIcon },
                { id: 'text', label: t.text, icon: DocumentTextIcon },
                { id: 'document', label: t.document, icon: DocumentDuplicateIcon },
                { id: 'link', label: t.link, icon: LinkIcon },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => { setActiveMode(mode.id as InputMode); setTranscription(""); setRecordedBase64(null); }}
                  className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 rounded-[1.5rem] font-bold transition-all ${
                    activeMode === mode.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <mode.icon className="w-5 h-5" />
                  <span className="text-sm">{mode.label}</span>
                </button>
              ))}
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 min-h-[400px] flex flex-col items-center justify-center">
              {activeMode === 'audio' && (
                <div className="w-full flex flex-col items-center space-y-6">
                  <div className={`p-10 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white shadow-2xl scale-110' : 'bg-slate-200 text-slate-400'}`}>
                    <MicrophoneIcon className={`w-16 h-16 ${isRecording ? 'animate-pulse' : ''}`} />
                  </div>
                  {isRecording ? <div className="text-3xl font-mono font-black text-red-600">{formatTime(recordingTime)}</div> : <div className="text-slate-800 font-black text-xl">{t.recordAudio}</div>}
                  <button onClick={isRecording ? stopRecording : startRecording} className={`px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${isRecording ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border'}`}>
                    {isRecording ? t.stopSend : t.startRecord}
                  </button>
                  <p className="text-slate-400 text-sm font-bold text-center max-w-md">{t.swedishLawNote}</p>

                  {isTranscribing && (
                    <div className="flex items-center gap-3 text-indigo-600 font-black animate-pulse py-4">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t.transcribing}</span>
                    </div>
                  )}

                  {transcription && !isRecording && (
                    <div className="w-full max-w-2xl bg-slate-50 p-8 rounded-[2rem] border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-indigo-600">
                             <DocumentTextIcon className="w-6 h-6" />
                             <h4 className="font-black text-lg">{t.transcription}</h4>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleCopyText(transcription)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-500" title={t.copyText}>
                                <ClipboardDocumentIcon className="w-5 h-5" />
                             </button>
                             <button onClick={() => handleDownloadText(transcription, 'My_Migration_Story.txt')} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-500" title={t.downloadText}>
                                <ArrowDownTrayIcon className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                       <p className="text-slate-700 text-lg leading-relaxed mb-8 p-4 bg-white rounded-xl border border-slate-100 shadow-sm whitespace-pre-wrap">{transcription}</p>
                       <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-400 font-bold max-w-xs">{t.checkTranscription}</p>
                          <button onClick={processAudioAnalysis} disabled={analyzing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all">
                             {analyzing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                             <span>{t.confirmAnalysis}</span>
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeMode !== 'audio' && (
                <div className="w-full h-full flex flex-col items-center">
                   {activeMode === 'image' && !image && (
                     <label className="group w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                       <div className="bg-slate-100 p-6 rounded-full group-hover:bg-indigo-100 transition-colors">
                         <ArrowUpTrayIcon className="w-12 h-12 text-slate-400 group-hover:text-indigo-600" />
                       </div>
                       <span className="mt-4 text-slate-700 font-black text-xl">{t.uploadImage}</span>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e)} />
                     </label>
                   )}
                   {activeMode === 'image' && image && (
                     <div className="relative w-full text-center">
                        <img src={image} className="max-h-[300px] mx-auto rounded-3xl shadow-xl" alt="" />
                        <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg text-red-500"><XMarkIcon className="w-5 h-5" /></button>
                        <button onClick={runAnalysis} className="mt-6 bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black">{t.analyzeNow}</button>
                     </div>
                   )}
                   {activeMode === 'text' && (
                     <div className="w-full space-y-4">
                        <textarea rows={6} className="w-full p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500" placeholder={t.textPlaceholder} value={textStory} onChange={e => setTextStory(e.target.value)} />
                        <button onClick={runAnalysis} className="block mx-auto bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black">{t.analyzeNow}</button>
                     </div>
                   )}
                   {activeMode === 'document' && (
                      <div className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                        <label className="group cursor-pointer flex flex-col items-center">
                          <DocumentDuplicateIcon className="w-16 h-16 text-slate-400 group-hover:text-indigo-600 mb-4" />
                          <span className="font-black text-slate-700">{t.uploadDoc}</span>
                          <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 setDocFile({ name: file.name, base64: (reader.result as string).split(',')[1], type: file.type, size: (file.size / 1024).toFixed(2) + ' KB' });
                               };
                               reader.readAsDataURL(file);
                             }
                          }} />
                        </label>
                        {docFile && <div className="mt-4 font-bold text-indigo-600">{docFile.name} ({docFile.size})</div>}
                        {docFile && <button onClick={runAnalysis} className="mt-6 bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black">{t.analyzeNow}</button>}
                      </div>
                   )}
                   {activeMode === 'link' && (
                     <div className="w-full space-y-6 flex flex-col items-center">
                        <div className="w-full relative">
                          <LinkIcon className={`w-5 h-5 absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                          <input type="url" placeholder={t.linkPlaceholder} value={urlLink} onChange={e => setUrlLink(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 pr-12" />
                        </div>
                        <button onClick={runAnalysis} className="bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black">{t.analyzeNow}</button>
                     </div>
                   )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Loading */}
        {analyzing && (
           <div className="py-24 text-center space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto relative">
                <SparklesIcon className="w-10 h-10 text-indigo-500 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">{t.analyzing}</h3>
                <p className="text-slate-400 font-bold">{t.analyzingHint}</p>
              </div>
           </div>
        )}

        {/* Results Dashboard */}
        {result && !analyzing && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-indigo-50 px-5 py-2.5 rounded-2xl font-black text-indigo-700 cursor-pointer" onClick={() => handleTermAction(result.categories.origin)}>
                  <GlobeAltIcon className="w-5 h-5" />
                  <span className="text-xs uppercase opacity-60">{t.origin}</span>
                  <span className="text-sm">{result.categories.origin}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-2xl font-black text-emerald-700 cursor-pointer" onClick={() => handleTermAction(result.categories.destination)}>
                  <MapPinIcon className="w-5 h-5" />
                  <span className="text-xs uppercase opacity-60">{t.destination}</span>
                  <span className="text-sm">{result.categories.destination}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={downloadPodcast} 
                  disabled={generatingAudio}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black transition-all shadow-md active:scale-95 ${isPodcastReady ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50'}`}
                >
                  {generatingAudio ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  )}
                  <span>{generatingAudio ? t.preparingDownload : t.downloadPodcast}</span>
                </button>
                <button onClick={exportFullAnalysis} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition-all">
                  <DocumentIcon className="w-5 h-5" />
                  <span>{t.exportFullAnalysis}</span>
                </button>
                <button onClick={handleShare} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all">
                  <ShareIcon className="w-5 h-5" />
                  <span>{t.share}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><LightBulbIcon className="w-8 h-8 text-amber-300" /></div>
                   <h3 className="text-2xl font-black">{t.migrationAdvice}</h3>
                </div>
                <p className="text-xl leading-relaxed font-bold border-r-4 border-amber-300 pr-6 italic">{result.migrationAdvice}</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
                <div className="flex items-center gap-4 mb-8 text-indigo-600">
                   <div className="p-3 bg-indigo-50 rounded-2xl"><ListBulletIcon className="w-8 h-8" /></div>
                   <h3 className="text-2xl font-black">{t.lessonsLearned}</h3>
                </div>
                <div className="space-y-4">
                  {result.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">{idx + 1}</div>
                      <p className="text-slate-700 font-bold leading-relaxed">{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-emerald-50 rounded-2xl"><ShieldCheckIcon className="w-10 h-10 text-emerald-500" /></div>
                   <h3 className="text-2xl font-black">{t.asylumProbability}</h3>
                </div>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-black text-sm uppercase">
                    {t.asylumLevel} {result.asylumProbability.level}
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl">{result.asylumProbability.reasoning}</p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-8 text-indigo-600">
                   <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl"><BuildingLibraryIcon className="w-10 h-10" /></div>
                    <h3 className="text-2xl font-black">{t.legalContext}</h3>
                   </div>
                   <button 
                    onClick={handleLegalTranslateToggle} 
                    disabled={isTranslatingLegal} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm ${isLegalTranslated ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                   >
                     {isTranslatingLegal ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <ArrowsRightLeftIcon className="w-4 h-4" />}
                     <span>{isTranslatingLegal ? t.translating : (isLegalTranslated ? t.originalLang : t.translateLegal)}</span>
                   </button>
                </div>
                <div className="space-y-4 flex-1">
                   <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg w-fit text-xs font-black mb-2 uppercase tracking-wider">
                      {displayLegalCountry}
                   </div>
                   {displayLegalLaws?.map((law, idx) => (
                     <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => handleExternalSearch(law)}>
                        <ScaleIcon className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-slate-700 font-bold flex-1">{law}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopyText(law); }} 
                            className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all border border-slate-100"
                            title={t.copyText}
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                          <ArrowTopRightOnSquareIcon className={`w-4 h-4 text-slate-300 ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <section ref={podcastSectionRef} className="bg-slate-900 p-8 md:p-14 rounded-[4rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                   <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full mb-6 border border-white/10 backdrop-blur-md">
                      <MusicalNoteIcon className={`w-4 h-4 text-indigo-400 ${isPlaying ? 'animate-bounce' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">{t.podcastSeries}</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight">{result.podcastTitle}</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleBriefPlayToggle}
                      disabled={generatingBrief}
                      className={`flex items-center gap-3 p-5 rounded-3xl border transition-all active:scale-95 ${isBriefPlaying ? 'bg-amber-600 border-amber-500 shadow-amber-500/20 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      title={t.audioSummary}
                    >
                      {generatingBrief ? (
                        <div className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <BoltIcon className={`w-7 h-7 ${isBriefPlaying ? 'animate-pulse' : ''}`} />
                      )}
                      <span className="font-black text-sm hidden lg:inline">{isBriefPlaying ? t.playingSummary : t.audioSummary}</span>
                    </button>

                    <button 
                      onClick={downloadPodcast} 
                      disabled={generatingAudio}
                      className={`flex items-center gap-3 p-5 rounded-3xl border transition-all group active:scale-95 shadow-xl ${isPodcastReady ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700' : 'bg-white/10 border-white/20 hover:bg-white/20'}`} 
                      title={t.downloadPodcast}
                    >
                      {generatingAudio ? (
                         <div className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                         <ArrowDownTrayIcon className="w-7 h-7" />
                      )}
                      <span className="font-black text-sm hidden lg:inline">
                        {generatingAudio ? t.preparingDownload : t.downloadPodcast}
                      </span>
                    </button>
                    
                    <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} className={`p-5 rounded-3xl border transition-all ${showVoiceSettings ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10'}`}>
                      <AdjustmentsHorizontalIcon className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                {showVoiceSettings && (
                  <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 mb-12 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500">{t.ahmedVoice}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {VOICES.map(v => (<button key={v.name} onClick={() => setAhmedVoice(v.name)} className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${ahmedVoice === v.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>{v.label[lang]}</button>))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500">{t.sarahVoice}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {VOICES.map(v => (<button key={v.name} onClick={() => setSarahVoice(v.name)} className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${sarahVoice === v.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>{v.label[lang]}</button>))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {generatingAudio && (
                  <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center rounded-[4rem]">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                    <h4 className="text-xl font-black">{t.preparingPodcast}</h4>
                  </div>
                )}

                <div className="w-full max-w-3xl space-y-4 mx-auto mb-10">
                  <div className="relative h-12 flex items-center">
                    <div className="absolute inset-0 h-2 my-auto bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]" style={{ width: `${(currentTime / (duration || 1)) * 100}%`, float: lang === 'ar' ? 'right' : 'left' }}></div>
                    </div>
                    <input type="range" min="0" max={duration || 100} value={currentTime} onChange={e => { const nt = parseFloat(e.target.value); setCurrentTime(nt); if (isPlaying) playAtOffset(nt); else offsetRef.current = nt; }} className="w-full h-full bg-transparent appearance-none cursor-pointer relative z-10 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-xl" />
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-500 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                   <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 order-2 md:order-1">
                      {[1, 1.25, 1.5].map(rate => (<button key={rate} onClick={() => handleSpeedChange(rate)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>{rate}x</button>))}
                   </div>
                   <div className="flex items-center gap-8 order-1 md:order-2">
                      <button onClick={() => playAtOffset(Math.max(0, currentTime - 10))} className="p-4 text-slate-400 hover:text-white active:scale-90"><BackwardIcon className="w-10 h-10" /></button>
                      <button onClick={handlePodcastPlayToggle} className={`group w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl relative border-4 ${isPlaying ? 'bg-red-500 border-red-400/20' : 'bg-white border-transparent'}`}>{isPlaying ? <StopIcon className="w-12 h-12 text-white" /> : <PlayIcon className="w-12 h-12 text-slate-900 translate-x-[-2px]" />}</button>
                      <button onClick={() => playAtOffset(Math.min(duration, currentTime + 10))} className="p-4 text-slate-400 hover:text-white active:scale-90"><ForwardIcon className="w-10 h-10" /></button>
                   </div>
                   <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/10 order-3">
                      <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white">{isMuted || volume === 0 ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}</button>
                      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                   </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Search Results */}
        {isSearching && !result && !analyzing && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {filteredHistory.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-slate-400 font-bold">{t.noResults}</div>
              ) : (
                filteredHistory.map(item => (
                  <div key={item.id} onClick={() => loadHistoryItem(item)} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                    <img src={item.image} className="w-full h-40 object-cover rounded-2xl mb-4 group-hover:scale-[1.02] transition-transform" alt="" />
                    <h4 className="font-black text-slate-800 line-clamp-1">{item.analysis.podcastTitle}</h4>
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2">{item.analysis.summary}</p>
                  </div>
                ))
              )}
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/60 backdrop-blur-xl border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-black z-[40] uppercase tracking-[0.4em]">
        {lang === 'ar' ? 'نظام تحليل واكتشاف رحلات الهجرة بالذكاء الاصطناعي' : 'AI Migration Journey Analysis & Discovery System'}
      </footer>
    </div>
  );
};

export default App;
