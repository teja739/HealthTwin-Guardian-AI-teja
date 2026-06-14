'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Mic, Volume2, Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lang?: string;
  translation?: string;
}

export default function Assistant() {
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
    { name: 'Spanish', code: 'es', flag: '🇪🇸' },
    { name: 'Arabic', code: 'ar', flag: '🇸🇦' }
  ];

  const aiResponses: Record<string, { content: string; translation?: string }> = {
    'health': {
      content: 'Based on your latest health data, your overall Health Score is 88/100. Your cardiovascular metrics are excellent with a resting heart rate of 64 bpm and HRV of 76ms. Your fasting glucose is slightly elevated at 104 mg/dL — I recommend focusing on post-meal walks.',
      translation: selectedLang === 'Hindi' ? 'आपके नवीनतम स्वास्थ्य डेटा के आधार पर, आपका समग्र स्वास्थ्य स्कोर 88/100 है।' :
                   selectedLang === 'Telugu' ? 'మీ తాజా ఆరోగ్య డేటా ఆధారంగా, మీ మొత్తం ఆరోగ్య స్కోరు 88/100.' :
                   selectedLang === 'Spanish' ? 'Según sus últimos datos de salud, su puntuación de salud general es 88/100.' :
                   selectedLang === 'Arabic' ? 'بناءً على أحدث بياناتك الصحية، فإن درجة صحتك العامة هي 88/100.' : undefined
    },
    'default': {
      content: 'I understand your question. Based on your health profile and the latest medical data from your HealthTwin, everything looks within normal parameters. Your AI agents are continuously monitoring your vitals, medications, and risk factors. Is there anything specific you\'d like me to explain in more detail?',
      translation: selectedLang === 'Hindi' ? 'मैं आपके प्रश्न को समझता हूँ। आपकी स्वास्थ्य प्रोफ़ाइल के आधार पर सब कुछ सामान्य सीमा में है।' :
                   selectedLang === 'Telugu' ? 'నేను మీ ప్రశ్నను అర్థం చేసుకున్నాను. మీ ఆరోగ్య ప్రొఫైల్ ఆధారంగా అంతా సాధారణ పరిధిలో ఉంది.' :
                   selectedLang === 'Spanish' ? 'Entiendo su pregunta. Según su perfil de salud, todo se encuentra dentro de los parámetros normales.' :
                   selectedLang === 'Arabic' ? 'أنا أفهم سؤالك. بناءً على ملفك الصحي، كل شيء ضمن المعايير الطبيعية.' : undefined
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, lang: selectedLang };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const key = input.toLowerCase().includes('health') || input.toLowerCase().includes('score') ? 'health' : 'default';
      const resp = aiResponses[key];
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resp.content,
        lang: 'English',
        translation: selectedLang !== 'English' ? resp.translation : undefined
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
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
                "max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed",
                msg.role === 'user'
                  ? 'bg-medical-blue/20 border border-medical-blue/30 text-white rounded-br-sm'
                  : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-sm'
              )}>
                <p>{msg.content}</p>
                {msg.translation && (
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
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-medical-blue">
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
