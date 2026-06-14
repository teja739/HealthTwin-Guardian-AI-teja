'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Mic, Volume2, Send, Bot, User, Sparkles, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function Assistant({ userProfile }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your HealthTwin AI Assistant. I can help you understand your health data, translate medical terms, and answer health questions in multiple languages. How can I help you today?',
      lang: 'English'
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        
        // Stop all microphone tracks to release the hardware indicator
        stream.getTracks().forEach(track => track.stop());

        setIsListening(false);
        setIsTyping(true); // Show typing animation while transcribing via Groq Whisper

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
          alert('Could not transcribe audio. Please check your Groq API key configuration.');
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

    // If already speaking this message, pause and clear it
    if (speakingMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setSpeakingMsgId(null);
      return;
    }

    // Stop any active audio playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setSpeakingMsgId(null);

    try {
      setIsTyping(true); // Show typing animation while fetching premium audio

      // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
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
      console.error('TTS playback error:', error);
      alert('Failed to synthesize speech. Please check your OpenAI API key configuration.');
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, lang: selectedLang };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

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
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        lang: 'English',
        translation: selectedLang !== 'English' && data.translation ? data.translation : undefined
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Language Selector Sidebar */}
      <div className="glass-panel p-6 rounded-2xl space-y-5 lg:col-span-1">
        <div>
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Language</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Select your preferred language</p>
        </div>
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.name)}
              className={cn(
                "w-full text-left p-3 rounded-xl border flex items-center gap-3 text-sm transition duration-200",
                selectedLang === lang.name ? 'border-medical-blue bg-white/5' : 'border-white/5 hover:border-white/10'
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-xs font-semibold text-white">{lang.name}</span>
            </button>
          ))}
        </div>
        <div className="pt-4 border-t border-white/5 space-y-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Features</p>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <p className="flex items-center gap-1.5"><Mic className="w-3 h-3 text-medical-blue" /> Voice Input</p>
            <p className="flex items-center gap-1.5"><Volume2 className="w-3 h-3 text-medical-teal" /> Voice Output</p>
            <p className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-medical-blue" /> Real-time Translation</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="glass-panel rounded-2xl lg:col-span-3 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-medical-blue/20 border border-medical-blue/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-medical-blue" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">HealthTwin Assistant</h4>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online · {selectedLang}
              </span>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-medical-teal" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed relative group",
                msg.role === 'user'
                  ? 'bg-medical-blue/20 border border-medical-blue/30 text-white rounded-br-sm'
                  : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-sm'
              )}>
                <div className={cn(msg.role === 'assistant' && "pr-6")}>
                  <p>{msg.content}</p>
                </div>
                
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => speakMessage(msg.id, msg.translation && selectedLang !== 'English' ? msg.translation : msg.content, selectedLang)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition text-medical-teal opacity-40 hover:opacity-100 group-hover:opacity-100"
                    title={speakingMsgId === msg.id ? "Stop Speaking" : "Read Aloud"}
                  >
                    {speakingMsgId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {msg.translation && msg.translation !== 'null' && msg.translation !== 'undefined' && selectedLang !== 'English' && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/10">
                    <span className="text-[9px] text-medical-teal font-mono uppercase tracking-wider">Translation ({selectedLang})</span>
                    <p className="text-slate-400 mt-1">{msg.translation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm p-3.5 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={toggleListening}
              className={cn(
                "p-2.5 rounded-xl border transition",
                isListening 
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse" 
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-medical-blue"
              )}
              title={isListening ? "Listening... Click to Stop" : "Speak to Input"}
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your health, medications, or translate..."
              className="glass-input flex-1 px-4 py-2.5 text-xs"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-medical-blue/20 border border-medical-blue/30 hover:bg-medical-blue/30 transition text-medical-blue disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
