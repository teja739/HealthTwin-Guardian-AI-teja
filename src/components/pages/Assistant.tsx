'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Mic, Volume2, Send, Bot, User, Sparkles, VolumeX, 
  Paperclip, Camera, MessageSquare, AlertCircle, RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lang?: string;
  translation?: string;
}

interface AssistantProps {
  userProfile?: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    onboardingComplete: boolean;
  };
  setActivePage?: (page: string) => void;
}

export default function Assistant({ userProfile, setActivePage }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');
  const [isTyping, setIsTyping] = useState(false);
  const [keypadMode, setKeypadMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const userName = userProfile?.name.split(' ')[0] || 'Amruth';

  const languages = [
    { name: 'English', code: 'en', flag: '🇺🇸' },
    { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
    { name: 'Telugu', code: 'te', flag: '🇮🇳' },
    { name: 'Tamil', code: 'ta', flag: '🇮🇳' },
    { name: 'Kannada', code: 'kn', flag: '🇮🇳' },
    { name: 'Marathi', code: 'mr', flag: '🇮🇳' },
    { name: 'Bengali', code: 'bn', flag: '🇮🇳' },
    { name: 'Spanish', code: 'es', flag: '🇪🇸' },
    { name: 'Arabic', code: 'ar', flag: '🇸🇦' }
  ];

  const suggestionChips = [
    { text: "I have chest pain and shortness of breath", type: "critical" },
    { text: "Explain what Lisinopril does", type: "general" },
    { text: "Suggest a diet for managing Type 2 Diabetes", type: "diet" },
    { text: "How can I reduce stress levels today?", type: "wellness" }
  ];

  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === 'undefined') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
        setIsTyping(true);

        try {
          const currentLang = languages.find(l => l.name === selectedLang);
          const langCode = currentLang ? currentLang.code : 'en';

          const formData = new FormData();
          formData.append('file', audioBlob, 'voice.webm');
          formData.append('language', langCode);

          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Transcription request failed');
          }

          const data = await response.json();
          if (data.text) {
            setInput(prev => prev + (prev ? ' ' : '') + data.text);
          }
        } catch (err) {
          console.error(err);
          alert('Could not transcribe audio. Using speech input fallback...');
        } finally {
          setIsTyping(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const speakMessage = async (msgId: string, text: string, langName: string) => {
    if (typeof window === 'undefined') return;

    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setSpeakingMsgId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setSpeakingMsgId(null);

    try {
      setIsTyping(true);
      const voice = langName === 'Arabic' ? 'alloy' : 'shimmer';

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error('OpenAI TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      activeAudioRef.current = audio;
      setSpeakingMsgId(msgId);
      
      audio.onended = () => {
        setSpeakingMsgId(null);
        activeAudioRef.current = null;
      };

      audio.onerror = () => {
        setSpeakingMsgId(null);
        activeAudioRef.current = null;
      };

      await audio.play();

    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to browser Web Speech API:', error);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const cleanText = text.replace(/[*#_\-`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const langMap: { [key: string]: string } = {
          'English': 'en-US',
          'Hindi': 'hi-IN',
          'Telugu': 'te-IN',
          'Tamil': 'ta-IN',
          'Kannada': 'kn-IN',
          'Marathi': 'mr-IN',
          'Bengali': 'bn-IN',
          'Spanish': 'es-ES',
          'Arabic': 'ar-SA'
        };
        utterance.lang = langMap[langName] || 'en-US';

        setSpeakingMsgId(msgId);
        
        utterance.onend = () => {
          setSpeakingMsgId(null);
          activeAudioRef.current = null;
        };
        utterance.onerror = () => {
          setSpeakingMsgId(null);
          activeAudioRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
        
        activeAudioRef.current = {
          pause: () => window.speechSynthesis.cancel()
        } as any;
      }
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (customText?: string) => {
    const queryText = customText || input;
    if (!queryText.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: queryText, lang: selectedLang };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    const startTime = Date.now();

    logToSplunk('chat_interaction', {
      action: 'user_message_sent',
      contentLength: queryText.length,
      language: selectedLang,
      conversationLength: updatedMessages.length
    }, { severity: 'Info' });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          language: selectedLang,
          userProfile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        lang: 'English',
        translation: selectedLang !== 'English' && data.translation ? data.translation : undefined
      };
      
      logToSplunk('chat_interaction', {
        action: 'assistant_response_received',
        latencyMs,
        language: selectedLang,
        hasTranslation: !!assistantMsg.translation,
        contentLength: data.content.length,
        status: 'success'
      }, { severity: 'Success' });

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const latencyMs = Date.now() - startTime;
      
      logToSplunk('chat_interaction', {
        action: 'assistant_response_received',
        latencyMs,
        language: selectedLang,
        status: 'error',
        error: error.message || String(error)
      }, { severity: 'High' });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not connect to the AI Assistant service. Please check your API key configuration in your environment variables.',
        lang: 'English'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Switch to simplified keypad mode for elderly/rural care
  if (keypadMode) {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6 min-h-[500px] h-[calc(100vh-140px)]">
        <div className="flex justify-between items-center border-b border-card-border pb-3">
          <div>
            <h3 className="text-lg font-display font-extrabold text-foreground flex items-center gap-1.5">
              🎙️ Rural Voice Shield / ग्रामीण सहायक
            </h3>
            <p className="text-xs text-slate-500 mt-1">Simplified, high-contrast vocal assistant for rural and elderly care.</p>
          </div>
          <button
            onClick={() => setKeypadMode(false)}
            className="px-4 py-2 bg-card-bg hover:bg-white/5 border border-card-border rounded-xl text-xs font-bold text-foreground transition"
          >
            Standard Chat
          </button>
        </div>

        <div className="flex-1 bg-slate-950/40 p-6 rounded-2xl border border-card-border space-y-5 overflow-y-auto">
          {lastUserMsg && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">You Said / మీరు అడిగారు:</span>
              <p className="text-base text-slate-300 font-bold">{lastUserMsg.content}</p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-card-border">
            <span className="text-[10px] text-medical-teal uppercase tracking-widest font-mono font-bold">AI Response / సమాధానం:</span>
            <p className="text-lg text-foreground font-extrabold leading-relaxed">
              {lastAssistantMsg ? (lastAssistantMsg.translation && selectedLang !== 'English' ? lastAssistantMsg.translation : lastAssistantMsg.content) : 'Awaiting speech input...'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-bold">Select Language / భాష:</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Telugu', label: 'Telugu / తెలుగు', flag: '🇮🇳' },
              { name: 'Hindi', label: 'Hindi / हिंदी', flag: '🇮🇳' },
              { name: 'English', label: 'English / US', flag: '🇺🇸' }
            ].map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => setSelectedLang(lang.name)}
                className={cn(
                  "py-4 rounded-xl border text-sm font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer",
                  selectedLang === lang.name 
                    ? 'border-medical-blue bg-medical-blue/10 text-foreground shadow-lg' 
                    : 'border-card-border bg-white/3 text-slate-400 hover:border-card-border/65'
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={toggleListening}
            className={cn(
              "flex-1 py-6 rounded-2xl border text-lg font-extrabold flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer",
              isListening
                ? 'bg-medical-red border-medical-red text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                : 'bg-card-bg border-card-border hover:bg-white/5 text-medical-blue shadow-lg'
            )}
          >
            <Mic className="w-6 h-6" />
            {isListening ? 'SPEAK NOW / మాట్లాడండి' : 'TAP TO SPEAK / మాట్లాడటానికి నొక్కండి'}
          </button>

          {lastAssistantMsg && (
            <button
              onClick={() => speakMessage(lastAssistantMsg.id, lastAssistantMsg.translation && selectedLang !== 'English' ? lastAssistantMsg.translation : lastAssistantMsg.content, selectedLang)}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                speakingMsgId === lastAssistantMsg.id
                  ? 'bg-medical-red/10 border-medical-red/20 text-medical-red'
                  : 'bg-card-bg border-card-border hover:bg-white/5 text-medical-teal'
              )}
            >
              {speakingMsgId === lastAssistantMsg.id ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* Language Selector Sidebar */}
      <div className="glass-panel p-6 rounded-2xl space-y-5 lg:col-span-1 hidden lg:block overflow-y-auto">
        <div>
          <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest">Preferred Language</h3>
          <p className="text-[10px] text-slate-500 mt-1">AI responses will translate automatically</p>
        </div>
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.name)}
              className={cn(
                "w-full text-left p-3 rounded-xl border flex items-center gap-3 text-xs font-semibold transition duration-200 cursor-pointer",
                selectedLang === lang.name ? 'border-medical-blue bg-medical-blue/10 text-foreground font-bold' : 'border-card-border hover:border-card-border/60 text-slate-400 hover:text-foreground'
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Gemini-Style Chat Interface */}
      <div className="glass-panel rounded-2xl lg:col-span-3 flex flex-col overflow-hidden h-full relative border border-card-border">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-slate-950/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-medical-blue/10 border border-medical-blue/20 flex items-center justify-center shadow-sm">
              <Bot className="w-4.5 h-4.5 text-medical-blue" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">AI Doctor Assistant</h4>
              <span className="text-[9px] text-medical-teal font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-teal animate-pulse" /> Gemini Pro · {selectedLang}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeypadMode(true)}
              className="px-3.5 py-1.5 rounded-xl border border-card-border bg-card-bg hover:border-medical-teal/30 text-[10px] font-bold text-slate-400 hover:text-foreground transition-all duration-300 cursor-pointer"
            >
              🎙️ Rural Mode
            </button>
          </div>
        </div>

        {/* Messaging Board / Suggestion Panel */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.length === 0 ? (
            /* Gemini Empty State Welcomer */
            <div className="h-full flex flex-col justify-center items-center max-w-lg mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-medical-blue via-medical-teal to-emerald-400 bg-clip-text text-transparent">
                  Hello, {userName} 👋
                </h1>
                <p className="text-sm text-slate-400 font-light">
                  I am your HealthTwin AI Doctor. Ask me anything about your symptoms, medications, or lab reports.
                </p>
              </motion.div>

              {/* Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-4">
                {suggestionChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(chip.text)}
                    className="p-4 rounded-2xl border border-card-border bg-white/3 hover:border-medical-blue/30 text-left text-xs text-slate-300 hover:text-foreground hover:bg-medical-blue/5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[100px]"
                  >
                    <span>{chip.text}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Try this</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Chat Messages */
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 items-start max-w-3xl", msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-medical-blue/10 border border-medical-blue/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-medical-blue" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-4 rounded-2xl text-xs leading-relaxed border relative group max-w-[85%]",
                    msg.role === 'user'
                      ? 'bg-medical-blue/10 border-medical-blue/20 text-foreground rounded-tr-none'
                      : 'bg-white/3 border-card-border text-slate-300 rounded-tl-none'
                  )}>
                    <div>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>

                    {msg.translation && msg.translation !== 'null' && msg.translation !== 'undefined' && selectedLang !== 'English' && (
                      <div className="mt-3 pt-3 border-t border-card-border text-slate-400">
                        <span className="text-[9.5px] text-medical-teal font-mono uppercase tracking-wider font-bold">Translation ({selectedLang})</span>
                        <p className="mt-1">{msg.translation}</p>
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button 
                          onClick={() => speakMessage(msg.id, msg.translation && selectedLang !== 'English' ? msg.translation : msg.content, selectedLang)}
                          className="p-1 rounded bg-white/5 border border-card-border hover:bg-white/10 text-medical-teal cursor-pointer"
                          title="Read Aloud"
                        >
                          {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-medical-red" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-card-border flex items-center justify-center shrink-0 text-[10px] font-bold text-white uppercase">
                      {userName.substring(0, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="flex gap-4 items-start max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-medical-blue/10 border border-medical-blue/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-medical-blue" />
              </div>
              <div className="bg-white/3 border border-card-border rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar Dock */}
        <div className="p-5 border-t border-card-border bg-slate-950/30 backdrop-blur-md">
          <div className="max-w-3xl mx-auto relative flex items-center bg-card-bg border border-card-border rounded-2xl px-4 py-2 hover:border-medical-blue/30 focus-within:border-medical-blue/50 transition duration-300">
            {/* Left Attachment Buttons */}
            <div className="flex items-center gap-2.5 mr-3">
              <button 
                onClick={() => setActivePage && setActivePage('reports')}
                className="p-2 rounded-xl text-slate-400 hover:text-medical-blue hover:bg-white/5 transition cursor-pointer"
                title="Upload Report"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => setActivePage && setActivePage('scanner')}
                className="p-2 rounded-xl text-slate-400 hover:text-medical-teal hover:bg-white/5 transition cursor-pointer"
                title="Scan Medicine"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Input Text Area */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question, upload reports, or scan medicine..."
              className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder-slate-500 py-2 w-full focus:ring-0 focus:outline-none"
            />

            {/* Right Voice and Send Buttons */}
            <div className="flex items-center gap-2.5 ml-3">
              <button 
                onClick={toggleListening}
                className={cn(
                  "p-2 rounded-xl border transition cursor-pointer",
                  isListening 
                    ? "bg-medical-red/20 border-medical-red/30 text-medical-red animate-pulse" 
                    : "bg-white/5 border-card-border hover:bg-white/10 text-medical-blue"
                )}
                title={isListening ? "Listening... Click to Stop" : "Voice Input"}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-medical-blue text-white hover:bg-medical-blue/90 disabled:opacity-30 disabled:hover:bg-medical-blue transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-center mt-2.5 text-[9.5px] text-slate-500 leading-snug max-w-md mx-auto font-light">
            AI Assistant responses are generated using Gemini Pro. Check active health alerts in the Dashboard.
          </div>
        </div>

      </div>
    </div>
  );
}
