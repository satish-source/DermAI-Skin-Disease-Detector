import React, { useState, useRef, useEffect } from "react";
import { X, Send, User, Sparkles, Globe, Stethoscope, RefreshCw, Key, Check, Copy, Volume2, ThumbsUp, ThumbsDown, Mic, MicOff, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { api } from "../api";

// The Iconic Google Gemini 4-Pointed Sparkle Star Logo
function GeminiStar({ className = "w-5 h-5", animate = false }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} ${animate ? "animate-spin" : ""}`} style={{ animationDuration: "8s" }} fill="none">
      <path
        d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
        fill="url(#gemini_grad)"
      />
      <defs>
        <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.33" stopColor="#9B72CB" />
          <stop offset="0.66" stopColor="#D96570" />
          <stop offset="1" stopColor="#F4B400" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DermAIChatbot({ isOpen, setIsOpen, activeCaseContext, onOpenTelehealth }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("dermai_gemini_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState("");
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      source: "gemini_live",
      text: "👋 **Hello! I'm DermAura AI**, your specialized clinical dermatology copilot.\n\nAsk me about **any skin condition, rash, or disease** (such as *Acne, Eczema, Psoriasis, Fungal Ringworm, Hives, Shingles, Vitiligo, Warts, or Lesions*) or your active screening case. I provide **immediate at-home relief, medical solutions, and guidance on what to do further**!\n\nWhat can I help you explore today?",
      suggested: [
        "What is the best solution for severe acne?",
        "How do I soothe dry, itchy eczema?",
        "What cures a fungal ringworm infection?",
        "What should I do further for my case?",
        "Why does healthy skin say Clinical Review?",
        "What are the ABCDE melanoma warning signs?"
      ]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice Input SpeechRecognition API
  const handleToggleVoiceInput = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${spoken}` : spoken));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Copy to clipboard
  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to speech readout
  const handleSpeakMessage = (text, id) => {
    if (!window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown stars
    const cleanText = text.replace(/[*#_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveApiKey = () => {
    const trimmed = tempKeyInput.trim();
    setGeminiApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("dermai_gemini_key", trimmed);
    } else {
      localStorage.removeItem("dermai_gemini_key");
    }
    setShowKeyModal(false);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 3000);
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const data = await api.sendChatMessage(query, language, activeCaseContext, geminiApiKey || null);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        source: data.source || "gemini_live",
        text: data.reply,
        suggested: data.suggested_followups || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          source: "dermai_knowledge_base",
          text: "⚠️ Sorry, I could not connect to Gemini AI. Please ensure your DermAI backend is running."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        source: "gemini_live",
        text: "👋 Chat reset. Ask me about **any random skin condition, rash, diagnosis, or treatments**!",
        suggested: [
          "What is the best solution for severe acne?",
          "How do I soothe dry, itchy eczema?",
          "What cures a fungal ringworm infection?",
          "What should I do further for my case?"
        ]
      }
    ]);
  };

  // Format message text with markdown headers, bolding and bullet styling
  const renderFormattedText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Header handling ###
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-slate-900 mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-extrabold text-base text-slate-900 mt-2 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }

      // Bullet points
      const isBullet = line.trim().startsWith("• ") || line.trim().startsWith("- ");
      const content = isBullet ? line.trim().substring(2) : line;

      // Bold & italic handling
      const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <div key={idx} className={`${isBullet ? "flex items-start space-x-1.5 ml-1 my-0.5" : line.trim() === "" ? "h-2" : "leading-relaxed"}`}>
          {isBullet && <span className="text-[#4285F4] font-bold">•</span>}
          <div className="flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return <em key={pIdx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Slide-Up Chat Window (Controlled strictly from Navbar) */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in duration-300 ${
            isFullScreen
              ? "inset-2 sm:inset-6 w-auto h-auto max-h-none"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[480px] max-h-[680px] h-[88vh]"
          }`}
        >
          {/* Header Bar with DermAura AI Branding */}
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-sky-50 border border-indigo-100 flex items-center justify-center shadow-xs">
                <GeminiStar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
                    DermAura AI
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Clinical Copilot
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Clinical Dermatology AI</span>
                  <span>•</span>
                  <span className={geminiApiKey ? "text-emerald-600 font-bold" : "text-slate-500"}>
                    {geminiApiKey ? "Live Cloud Connected" : "Integrated Model"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Optional Cloud AI Key Config */}
              <button
                onClick={() => {
                  setTempKeyInput(geminiApiKey);
                  setShowKeyModal(!showKeyModal);
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  geminiApiKey ? "bg-amber-50 text-amber-600 border border-amber-200" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Connect Cloud AI Key"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors">
                <Globe className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                  title="Choose language"
                >
                  <option value="en">EN</option>
                  <option value="kn">ಕನ್ನಡ</option>
                  <option value="hi">हिन्दी</option>
                  <option value="te">తెలుగు</option>
                </select>
              </div>

              {/* Reset Chat */}
              <button
                onClick={handleClearChat}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="New Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Maximize / Minimize Window */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:block"
                title={isFullScreen ? "Collapse to Widget" : "Expand Fullscreen"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close DermAura"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cloud AI Key Config Drawer */}
          {showKeyModal && (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 border-b border-indigo-500/30 text-xs animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <Key className="w-4 h-4" />
                  <span>Google AI Studio Gemini API Key</span>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-300 hover:text-sky-200 text-[11px] font-semibold flex items-center space-x-1 underline"
                >
                  <span>Get Free Key at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-300 mb-2.5">
                Paste your personal Google Gemini API key to query Google's live <code>gemini-2.5-flash</code> cloud model with web-scale knowledge across all skin diseases. Leave empty to use the built-in clinical engine.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  placeholder="Paste AIzaSy... key"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-gradient-to-r from-[#4285F4] to-[#9B72CB] hover:opacity-90 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                >
                  Connect Key
                </button>
              </div>
            </div>
          )}

          {/* Toast on key save */}
          {keySavedToast && (
            <div className="bg-emerald-600 text-white text-[11px] font-bold py-1.5 px-3 text-center flex items-center justify-center space-x-1.5">
              <Check className="w-4 h-4" />
              <span>Google Gemini AI key successfully connected!</span>
            </div>
          )}

          {/* Active Case Context Pill */}
          {activeCaseContext?.class_name && (
            <div className="bg-sky-50/80 px-4 py-2 border-b border-sky-100 flex items-center justify-between text-[11px] text-sky-900 font-semibold shrink-0">
              <div className="truncate mr-2 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                <span className="text-slate-500 font-medium">Active Screening:</span>
                <span className="font-bold">{activeCaseContext.class_name} ({activeCaseContext.class_code})</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                activeCaseContext.risk_category === "High Risk" ? "bg-rose-100 text-rose-700" :
                activeCaseContext.risk_category === "Moderate Risk" ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                {activeCaseContext.risk_category}
              </span>
            </div>
          )}

          {/* Gemini Chat Scroll Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f8fafd] text-xs">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-4 shadow-2xs transition-all ${
                      isUser
                        ? "bg-[#4285F4] text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200/70 rounded-tl-sm shadow-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <GeminiStar className="w-4 h-4" />
                          <span className="font-extrabold text-[11px] tracking-tight bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
                            DermAura AI
                          </span>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border border-slate-200/60">
                          {m.source === "gemini_live" ? "Cloud Connected" : "Clinical Engine"}
                        </span>
                      </div>
                    )}

                    <div className="text-xs leading-relaxed space-y-1 font-sans">
                      {renderFormattedText(m.text)}
                    </div>

                    {/* Gemini Message Actions Toolbar (Copy, TTS, Thumbs) */}
                    {!isUser && (
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-slate-400">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m.text, m.id)}
                            className="p-1 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(m.text, m.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              speakingId === m.id ? "text-[#4285F4] bg-sky-50" : "hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title={speakingId === m.id ? "Stop voice readout" : "Listen to response with Voice AI"}
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${speakingId === m.id ? "animate-pulse" : ""}`} />
                          </button>
                        </div>

                        <div className="flex items-center space-x-1 text-slate-300">
                          <button
                            type="button"
                            onClick={() => alert("Thank you for your feedback!")}
                            className="p-1 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alert("Thank you for your feedback! We will refine the dermatological model.")}
                            className="p-1 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            title="Poor response"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gemini Prompt Suggestion Chips */}
                  {!isUser && m.suggested && m.suggested.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
                      {m.suggested.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(chip)}
                          className="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-[#4285F4] border border-slate-200 hover:border-sky-300 rounded-full text-[11px] font-medium shadow-2xs transition-all cursor-pointer text-left flex items-center space-x-1.5 group"
                        >
                          <Sparkles className="w-3 h-3 text-[#4285F4] opacity-70 group-hover:opacity-100 shrink-0" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* DermAura Thinking Animation */}
            {isLoading && (
              <div className="flex items-center space-x-2.5 p-3.5 bg-white rounded-2xl border border-slate-200/80 w-fit shadow-2xs animate-in fade-in">
                <GeminiStar className="w-5 h-5" animate={true} />
                <span className="text-xs font-semibold bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
                  DermAura is searching clinical literature and formulating solutions...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Telehealth Direct Booking Bar */}
          {onOpenTelehealth && (
            <div className="bg-indigo-50/90 px-4 py-2 border-t border-indigo-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-indigo-900 font-medium">Need direct clinical evaluation?</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenTelehealth();
                }}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-95 text-white text-[11px] font-bold rounded-full flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
              >
                <Stethoscope className="w-3 h-3" />
                <span>Book Telehealth Specialist</span>
              </button>
            </div>
          )}

          {/* Gemini Signature Pill Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white rounded-full pl-4 pr-1.5 py-1.5 border border-transparent focus-within:border-slate-300 transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? "Listening now... speak clearly..." :
                  language === "kn"
                    ? "ಯಾವುದೇ ಚರ್ಮದ ಕಾಯಿಲೆ/ಸಮಸ್ಯೆ ಕೇಳಿ..." :
                  language === "hi"
                    ? "त्वचा संबंधी कोई भी प्रश्न पूछें..." :
                  language === "te"
                    ? "ఏదైనా చర్మ సమస్య గురించి అడగండి..." :
                  "Ask DermAura about any skin disease, rash, solutions..."
                }
                className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none text-xs sm:text-sm font-medium pr-2"
              />

              <div className="flex items-center space-x-1 shrink-0">
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isListening ? "bg-rose-500 text-white animate-pulse" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  }`}
                  title={isListening ? "Stop listening" : "Speak your question (Voice Input)"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:opacity-40 text-white shadow-sm transition-all cursor-pointer shrink-0"
                  title="Send to DermAura"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Official Disclaimer */}
            <div className="mt-2 text-[10px] text-center text-slate-400 font-medium">
              ✦ DermAura AI provides educational clinical guidance. Always consult a certified dermatologist for formal medical diagnosis.
            </div>
          </div>

        </div>
      )}
    </>
  );
}
