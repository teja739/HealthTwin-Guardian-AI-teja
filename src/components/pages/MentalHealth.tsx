'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Heart, Brain, Sparkles, Mic, Activity, 
  Play, Pause, RefreshCw, Send, AlertTriangle, 
  Volume2, VolumeX, ShieldAlert, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface MentalHealthProps {
  userProfile: {
    name: string;
    email: string;
  };
}

export default function MentalHealth({ userProfile }: MentalHealthProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'journal' | 'breathing' | 'meditation'>('journal');

  // Journal Analytics State
  const [journalText, setJournalText] = useState('');
  const [typingStats, setTypingStats] = useState({ speed: 0, pauses: 0, stressIndex: 10 });
  const [sentiment, setSentiment] = useState<{ mood: string; score: number; stress: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastKeyPressRef = useRef<number>(0);
  const keyIntervalsRef = useRef<number[]>([]);

  // Breathing Coach State
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [breathingActive, setBreathingActive] = useState(false);
  const [completedBreaths, setCompletedBreaths] = useState(0);

  // Meditation State
  const [meditationTime, setMeditationTime] = useState(300); // 5 mins in seconds
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTheme, setMeditationTheme] = useState<'Zen Temple' | 'Rain Forest' | 'Deep Space'>('Zen Temple');
  const [playingAudio, setPlayingAudio] = useState(false);

  // Voice note tone analysis simulator
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<{ pitch: string; stress: string; status: string } | null>(null);

  // Handle Typing Analysis
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJournalText(val);

    const now = Date.now();
    if (lastKeyPressRef.current > 0) {
      const interval = now - lastKeyPressRef.current;
      // Record interval between keystrokes (typing cadence)
      if (interval < 3000) {
        keyIntervalsRef.current.push(interval);
      }
      
      // If interval is long, count it as a pause (indicates hesitation or cognitive load)
      if (interval > 1200 && interval < 4000) {
        setTypingStats(prev => ({ ...prev, pauses: prev.pauses + 1 }));
      }
    }
    lastKeyPressRef.current = now;

    // Calculate typing speed (chars per min estimation)
    if (keyIntervalsRef.current.length > 5) {
      const avgInterval = keyIntervalsRef.current.reduce((a, b) => a + b, 0) / keyIntervalsRef.current.length;
      const speed = Math.round(60000 / avgInterval);
      
      // Typing speed fluctuations can indicate stress levels
      let stressIndex = 15;
      const deviation = keyIntervalsRef.current.map(x => Math.abs(x - avgInterval));
      const jitter = deviation.reduce((a, b) => a + b, 0) / deviation.length;
      
      if (jitter > 150) {
        stressIndex = 58; // High variation/erratic typing -> High stress
      } else if (jitter > 70) {
        stressIndex = 32; // Mild tension
      }

      setTypingStats(prev => ({ ...prev, speed, stressIndex }));
    }
  };

  const analyzeJournal = () => {
    if (!journalText.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      // Simple client-side semantic parser (in production, feeds into Gemini/LLM)
      const lowercase = journalText.toLowerCase();
      let mood = 'Calm';
      let score = 80;
      let stress = 'Low';

      const negativeKeywords = ['sad', 'tired', 'exhausted', 'burnout', 'stressed', 'angry', 'depressed', 'anxious', 'fear', 'scared', 'fail', 'bad', 'hard', 'hopeless', 'worry', 'worried'];
      const positiveKeywords = ['happy', 'glad', 'excited', 'good', 'great', 'peaceful', 'relaxed', 'accomplished', 'fine', 'better', 'love', 'nice'];

      let negCount = 0;
      let posCount = 0;

      negativeKeywords.forEach(word => {
        if (lowercase.includes(word)) negCount++;
      });
      positiveKeywords.forEach(word => {
        if (lowercase.includes(word)) posCount++;
      });

      if (negCount > posCount) {
        mood = negCount > 3 ? 'Anxious/Burned Out' : 'Stressed';
        score = Math.max(80 - negCount * 12 - typingStats.stressIndex * 0.3, 25);
        stress = negCount > 3 ? 'High' : 'Moderate';
      } else if (posCount > negCount) {
        mood = 'Happy & Balanced';
        score = Math.min(85 + posCount * 5, 100);
        stress = 'Very Low';
      } else {
        mood = 'Neutral/Calm';
        score = 75;
        stress = 'Low';
      }

      setSentiment({ mood, score: Math.round(score), stress });
      setIsAnalyzing(false);

      logToSplunk('mental_health_twin', {
        action: 'journal_sentiment_analyzed',
        characterCount: journalText.length,
        detectedMood: mood,
        stressScore: Math.round(score),
        typingStressIndex: typingStats.stressIndex
      }, { severity: stress === 'High' ? 'Warning' : 'Success' });

    }, 1000);
  };

  // Breathing Coach Timer Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (breathingActive) {
      timer = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Cycle phases: Inhale (4s) -> Hold (4s) -> Exhale (4s)
            if (breathingPhase === 'Inhale') {
              setBreathingPhase('Hold');
              return 4;
            } else if (breathingPhase === 'Hold') {
              setBreathingPhase('Exhale');
              return 4;
            } else {
              setBreathingPhase('Inhale');
              setCompletedBreaths(c => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingActive, breathingPhase]);

  // Meditation Timer Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (meditationActive && meditationTime > 0) {
      timer = setInterval(() => {
        setMeditationTime(prev => {
          if (prev <= 1) {
            setMeditationActive(false);
            setPlayingAudio(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [meditationActive, meditationTime]);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and analyze simulated tone
      setIsRecording(false);
      const stressIndex = typingStats.stressIndex;
      let pitch = 'Consistent, Mid-range';
      let stress = 'Low';
      let status = 'Parasympathetic dominant. Speech rate is slow and relaxed.';

      if (stressIndex > 45) {
        pitch = 'Slightly Erratic, Higher Frequency';
        stress = 'Moderate';
        status = 'Mild vocal strain detected. Tremor analysis indicates rising cortisol.';
      }

      setVoiceAnalysis({ pitch, stress, status });
      logToSplunk('mental_health_twin', {
        action: 'voice_tone_analyzed',
        pitchPattern: pitch,
        stressResult: stress
      }, { severity: 'Info' });
    } else {
      setVoiceAnalysis(null);
      setIsRecording(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-medical-teal" />
            Emotion & Mental Health Twin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze emotional biomarkers through voice tone, journal entries, and typing patterns, or utilize calming therapies.
          </p>
        </div>
        
        {/* Navigation Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {[
            { id: 'journal', label: 'Journal & Emotion AI' },
            { id: 'breathing', label: 'Breathing Exercises' },
            { id: 'meditation', label: 'Zen Meditation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition duration-200",
                activeTab === tab.id ? "bg-medical-teal/20 text-medical-teal border border-medical-teal/30" : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Hand: Tab Panel Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'journal' && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl space-y-5"
              >
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Daily Emotional Diary</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pour your thoughts here. The AI will analyze typing cadences and linguistic semantics.</p>
                </div>

                <textarea
                  value={journalText}
                  onChange={handleTyping}
                  placeholder="How are you feeling today? Talk about your sleep, workload, challenges, or highlights..."
                  className="glass-input w-full h-48 px-4 py-3 text-xs bg-slate-950/80 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={toggleRecording}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition",
                        isRecording 
                          ? "bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                      )}
                    >
                      <Mic className="w-4 h-4" />
                      {isRecording ? 'Listening Tone...' : 'Record Voice Entry'}
                    </button>
                  </div>

                  <button
                    onClick={analyzeJournal}
                    disabled={!journalText.trim() || isAnalyzing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] disabled:opacity-50"
                  >
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Analyze Emotional State
                  </button>
                </div>

                {/* Voice Tone Analysis Result Card */}
                {voiceAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="font-bold text-indigo-400 flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> Voice Tone Acoustics</span>
                      <span className="font-mono text-[9px] uppercase">Stress Index: {voiceAnalysis.stress}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-1.5 text-slate-400">
                      <div>
                        <p className="text-[9px] text-slate-500">Pitch Variation</p>
                        <p className="font-semibold text-slate-300">{voiceAnalysis.pitch}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500">Autonomic Verdict</p>
                        <p className="font-semibold text-slate-300">{voiceAnalysis.status}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'breathing' && (
              <motion.div
                key="breathing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col items-center justify-center text-center min-h-[350px]"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Parasympathetic Breathing Coach</h3>
                  <p className="text-[10px] text-slate-500">Regulate heart rate and lower stress hormones using Box Breathing (4s - 4s - 4s).</p>
                </div>

                {/* Animated Breathing Circle */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <AnimatePresence>
                    {breathingActive && (
                      <motion.div 
                        className="absolute rounded-full bg-medical-teal/10 border border-medical-teal/30 pointer-events-none"
                        animate={{
                          width: breathingPhase === 'Inhale' ? ['80px', '160px'] : breathingPhase === 'Hold' ? '160px' : ['160px', '80px'],
                          height: breathingPhase === 'Inhale' ? ['80px', '160px'] : breathingPhase === 'Hold' ? '160px' : ['160px', '80px']
                        }}
                        transition={{
                          duration: 4,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                    <div className="text-center space-y-1">
                      <span className="text-xs font-bold text-white tracking-widest uppercase block">{breathingPhase}</span>
                      <span className="text-2xl font-extrabold font-display text-medical-teal block">{breathingTimer}s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 w-full max-w-xs">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Cycles Completed</span>
                    <span className="font-bold text-white">{completedBreaths}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setBreathingActive(!breathingActive); setBreathingTimer(4); setBreathingPhase('Inhale'); }}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5",
                        breathingActive 
                          ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30' 
                          : 'bg-gradient-to-r from-medical-blue to-medical-teal text-white shadow-md'
                      )}
                    >
                      {breathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {breathingActive ? 'Pause Exercise' : 'Start Coach'}
                    </button>
                    <button
                      onClick={() => { setBreathingActive(false); setBreathingTimer(4); setBreathingPhase('Inhale'); setCompletedBreaths(0); }}
                      className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                      title="Reset Timer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'meditation' && (
              <motion.div
                key="meditation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col items-center justify-center text-center min-h-[350px]"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Zen Mind Meditation Room</h3>
                  <p className="text-[10px] text-slate-500">Unwind your thoughts with sound frequencies. Select a ambient theme and sound timer.</p>
                </div>

                <div className="text-5xl font-display font-extrabold text-white tracking-widest">
                  {formatTime(meditationTime)}
                </div>

                {/* Theme Selector */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                  {(['Zen Temple', 'Rain Forest', 'Deep Space'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setMeditationTheme(theme)}
                      className={cn(
                        "py-2 rounded-xl border text-center text-xs font-semibold transition",
                        meditationTheme === theme 
                          ? 'border-medical-teal bg-medical-teal/15 text-white' 
                          : 'border-white/5 bg-white/2 text-slate-400 hover:border-white/10'
                      )}
                    >
                      {theme}
                    </button>
                  ))}
                </div>

                {/* Sound control button */}
                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={() => {
                      setMeditationActive(!meditationActive);
                      setPlayingAudio(!meditationActive);
                    }}
                    className={cn(
                      "flex-1 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2",
                      meditationActive && "opacity-80"
                    )}
                  >
                    {meditationActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {meditationActive ? 'Pause Meditation' : 'Begin Ambient Session'}
                  </button>

                  <select
                    value={meditationTime}
                    onChange={(e) => setMeditationTime(parseInt(e.target.value))}
                    className="glass-input px-3 text-xs w-28 bg-slate-950"
                  >
                    <option value="60">1 Min</option>
                    <option value="180">3 Mins</option>
                    <option value="300">5 Mins</option>
                    <option value="600">10 Mins</option>
                  </select>
                </div>

                {/* Ambient audio visualization simulation */}
                {playingAudio && (
                  <div className="flex gap-1 items-center justify-center h-5 mt-2">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <motion.span
                        key={idx}
                        className="w-1 bg-medical-teal rounded-full"
                        animate={{
                          height: [4, Math.floor(Math.random() * 16) + 6, 4]
                        }}
                        transition={{
                          duration: 0.8 + idx * 0.05,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Hand: Emotional Health Metrics & Warnings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mental Health Indicators Summary */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Activity className="w-4 h-4 text-medical-teal" /> Emotion Twin Analysis
            </h3>

            <div className="space-y-3.5">
              {[
                { label: 'Typing Jitter', val: typingStats.speed > 0 ? `${typingStats.speed} cpm` : 'Standby', status: typingStats.stressIndex > 40 ? 'Irregular Cadence' : 'Normal Cadence', color: typingStats.stressIndex > 40 ? 'text-amber-400' : 'text-emerald-400' },
                { label: 'Hesitation Index', val: `${typingStats.pauses} pauses`, status: typingStats.pauses > 5 ? 'High Cog. Load' : 'Fluid Thoughts', color: typingStats.pauses > 5 ? 'text-amber-400' : 'text-emerald-400' },
                { label: 'Current Mental State', val: sentiment ? sentiment.mood : 'Not Analyzed', status: sentiment ? `Stress: ${sentiment.stress}` : 'Awaiting input', color: sentiment?.stress === 'High' ? 'text-rose-500' : sentiment?.stress === 'Moderate' ? 'text-amber-400' : 'text-emerald-400' }
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/3 border border-white/5 rounded-xl text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold">{metric.label}</p>
                    <p className="font-bold text-white mt-0.5">{metric.val}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold font-mono", metric.color)}>{metric.status}</span>
                </div>
              ))}
            </div>

            {sentiment && (
              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-semibold">Resilience Score</span>
                  <span className="font-bold text-medical-teal">{sentiment.score}/100</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-medical-blue to-medical-teal h-full rounded-full transition-all duration-500" 
                    style={{ width: `${sentiment.score}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Motivational Support & Breathing indicators */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Sparkles className="w-4 h-4 text-medical-teal" /> AI Cognitive Support
            </h3>

            <div className="p-3.5 bg-white/3 border border-white/5 rounded-xl space-y-2">
              <p className="text-[9px] text-medical-blue font-bold uppercase tracking-widest font-mono">Therapeutic Prompt</p>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                {sentiment?.stress === 'High' 
                  ? `"You seem under stress. Remember, you don't have to carry it all. Pause for 2 minutes and utilize our Box Breathing coach to soothe your nervous system."`
                  : `"Mindfulness isn't about clearing your mind completely. It's about recognizing what passes through it without judgment. Take a deep breath."`
                }
              </p>
            </div>
            
            <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldAlert className="w-4.5 h-4.5 text-medical-teal shrink-0 mt-0.5" />
              <p className="leading-snug">
                The Emotion Twin monitors keystroke cadences local to this sandbox only. Document audits are protected under client-side encryption.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
