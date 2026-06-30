'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Heart, Brain, Moon, 
  TrendingUp, AlertCircle, ShieldCheck, 
  Clock, Flame, RefreshCw, ChevronRight,
  CheckCircle2, Sparkles, Calendar, User, MapPin, Sun,
  Droplet, Award, Zap, Camera, FileText, AlertTriangle, PhoneCall
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';
import { getAppointments, getMedicationLogs, saveMedicationLog } from '@/lib/supabase';
import confetti from 'canvas-confetti';

interface HomeProps {
  userProfile: {
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

export default function Home({ userProfile, setActivePage }: HomeProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medLogs, setMedLogs] = useState<any[]>([]);
  const [copilotSummary, setCopilotSummary] = useState('');
  
  // Daily Health Mission checklist
  const [missions, setMissions] = useState([
    { id: 'water', text: 'Drink 2 liters of water today', xp: 40, done: false },
    { id: 'steps', text: 'Walk 7,000 steps', xp: 60, done: false },
    { id: 'sleep', text: 'Sleep before 11 PM', xp: 50, done: false },
    { id: 'breath', text: 'Practice 10 minutes of breathing exercises', xp: 30, done: false },
    { id: 'checkup', text: 'Schedule your annual health check-up', xp: 100, done: false }
  ]);

  // Live Vitals State for Health Avatar and Gamification
  const [liveVitals, setLiveVitals] = useState({
    heartRate: 72,
    oxygenLevel: 98,
    bloodPressure: '118/74',
    stressLevel: 22,
    sleepHours: 8.4,
    waterMl: 1500,
    stepsCount: 8200,
    level: 3,
    xp: 320,
    maxXP: 500
  });

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadDashboardData() {
      const appts = await getAppointments(userProfile.email);
      setAppointments(appts.slice(0, 3));

      const logs = await getMedicationLogs(userProfile.email, dateStr);
      setMedLogs(logs);

      const hasHypertension = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'));
      let greeting = `Your digital twin is fully synchronized. All core biomarkers show optimal autonomic balance.`;
      if (hasHypertension) {
        greeting += ` Due to your Hypertension risk, keep daily sodium below 2,000mg and restrict heavy outdoor activity today.`;
      }
      setCopilotSummary(greeting);
    }
    loadDashboardData();
  }, [userProfile.email, userProfile.conditions, dateStr]);

  const handleToggleMed = async (medName: string, timeOfDay: string, currentTaken: boolean) => {
    const nextTaken = !currentTaken;
    try {
      await saveMedicationLog(userProfile.email, dateStr, medName, timeOfDay, nextTaken);
      
      setMedLogs(prev => {
        const filtered = prev.filter(l => !(l.medicineName === medName && l.timeOfDay === timeOfDay));
        return [...filtered, { medicineName: medName, timeOfDay, taken: nextTaken, takenTime: nextTaken ? new Date().toISOString() : null }];
      });

      if (nextTaken) {
        awardXP(50);
      }

      logToSplunk('medication_adherence', {
        action: 'medication_adherence_toggled',
        medicineName: medName,
        timeOfDay,
        taken: nextTaken
      }, { severity: nextTaken ? 'Success' : 'Warning' });

    } catch (err) {
      console.error('Adherence logging failed:', err);
    }
  };

  const awardXP = (amount: number) => {
    setLiveVitals(prev => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let maxXP = prev.maxXP;
      if (xp >= maxXP) {
        level += 1;
        xp -= maxXP;
        maxXP += 100;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
      return { ...prev, xp, level, maxXP };
    });
  };

  const toggleMission = (id: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        const nextDone = !m.done;
        if (nextDone) {
          awardXP(m.xp);
          logToSplunk('health_mission', { action: 'mission_completed', missionId: id, xpEarned: m.xp });
        }
        return { ...m, done: nextDone };
      }
      return m;
    }));
  };

  const handleSyncVitals = async () => {
    setIsSyncing(true);
    const heartRate = Math.floor(Math.random() * (78 - 62) + 62);
    const systolic = Math.floor(Math.random() * (122 - 115) + 115);
    const diastolic = Math.floor(Math.random() * (80 - 70) + 70);
    
    setLiveVitals(prev => ({
      ...prev,
      heartRate,
      bloodPressure: `${systolic}/${diastolic}`
    }));

    await logToSplunk('biometric_telemetry', {
      action: 'vitals_synchronized',
      heartRate,
      bloodPressure: `${systolic}/${diastolic}`,
      healthScore: 92
    }, { severity: 'Success' });

    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  // Compute live health score
  const computedScore = Math.max(
    Math.min(
      Math.round(
        92 - (liveVitals.stressLevel * 0.2) - (liveVitals.heartRate > 75 ? (liveVitals.heartRate - 75) * 0.25 : 0) + (missions.filter(m => m.done).length * 2)
      ), 
      100
    ), 
    10
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-medical-blue/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-slate-500 bg-clip-text text-transparent">
            Good Morning, {userProfile.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-2 text-xs md:text-sm flex items-start gap-2 max-w-3xl leading-relaxed">
            <Sparkles className="w-4 h-4 text-medical-teal shrink-0 mt-0.5" />
            <span><strong>Health Copilot:</strong> {copilotSummary}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI Shield Active
          </div>
          <button 
            onClick={handleSyncVitals}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-card-bg border border-card-border hover:border-medical-blue/30 text-xs font-semibold transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Vitals'}
          </button>
        </div>
      </div>

      {/* Main Grid: Score, Vitals, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Health Score Card */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[340px]">
          <div className="absolute inset-0 bg-gradient-to-b from-medical-blue/5 to-transparent pointer-events-none" />
          
          <div className="w-full flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
            <ShieldCheck className="w-5 h-5 text-medical-teal" />
          </div>

          <div className="relative my-6 flex items-center justify-center">
            {/* Outer Progress Ring */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" className="text-card-border" fill="transparent" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" 
                className="text-medical-blue transition-all duration-500" 
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - computedScore / 100)}
                strokeLinecap="round"
                fill="transparent" 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold font-display text-foreground">{computedScore}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Optimal</span>
            </div>
          </div>

          <div className="w-full text-xs text-slate-400 leading-relaxed pt-3 border-t border-card-border">
            Your biomarkers are synchronized. Cardiovascular, Sleep, and Stress indexes show stable parameters.
          </div>
        </div>

        {/* Middle Column: Vitals Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {[
            { id: 'hr', title: 'Heart Rate', val: `${liveVitals.heartRate}`, unit: 'BPM', desc: 'Optimal resting zone', icon: Heart, color: 'text-medical-red', bg: 'bg-rose-500/10 border-rose-500/25' },
            { id: 'bp', title: 'Blood Pressure', val: liveVitals.bloodPressure, unit: 'mmHg', desc: 'Normal parameters', icon: Activity, color: 'text-medical-blue', bg: 'bg-blue-500/10 border-blue-500/25' },
            { id: 'sleep', title: 'Sleep Cycle', val: `${liveVitals.sleepHours}`, unit: 'Hrs', desc: '38% REM & Deep Sleep', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/25' },
            { id: 'activity', title: 'Activity', val: `${liveVitals.stepsCount.toLocaleString()}`, unit: 'Steps', desc: 'Goal: 10,000 steps', icon: TrendingUp, color: 'text-medical-teal', bg: 'bg-cyan-500/10 border-cyan-500/25' }
          ].map((v) => {
            const IconComp = v.icon;
            return (
              <div key={v.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{v.title}</span>
                  <div className={cn("p-2 rounded-xl border", v.bg, v.color)}>
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">{v.val}</span>
                    <span className="text-xs text-slate-400">{v.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-card-border pb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Scan Report', icon: FileText, tab: 'reports', color: 'text-medical-blue', bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/25' },
                { label: 'Talk to AI', icon: Brain, tab: 'assistant', color: 'text-medical-teal', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/25' },
                { label: 'Emergency', icon: AlertTriangle, tab: 'emergency', color: 'text-medical-red', bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25' },
                { label: 'Medicine', icon: Camera, tab: 'scanner', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25' }
              ].map((act, idx) => {
                const IconComp = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActivePage && setActivePage(act.tab)}
                    className={cn("p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2.5 transition duration-200 cursor-pointer", act.bg)}
                  >
                    <IconComp className={cn("w-5 h-5", act.color)} />
                    <span className="text-[10px] font-bold text-foreground">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-medical-red/10 border border-medical-red/20 rounded-xl flex items-center justify-between text-xs text-medical-red">
            <span className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Medical SOS</span>
            <button 
              onClick={() => setActivePage && setActivePage('emergency')} 
              className="px-2.5 py-1 bg-medical-red text-white text-[10px] font-bold rounded-lg cursor-pointer"
            >
              Trigger
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Avatar Map & AI Health Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Digital Twin Live Avatar Map */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[450px]">
          <div className="flex justify-between items-start border-b border-card-border pb-3">
            <div>
              <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4.5 h-4.5 text-medical-teal animate-pulse" /> Digital Twin Live Avatar
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Biometric organ mapping synced with active vitals</p>
            </div>
            
            <div className="text-[9px] text-slate-400 font-mono flex flex-col items-end">
              <span>Twin Level</span>
              <span className="text-xs font-bold text-medical-teal font-sans">Lvl {liveVitals.level}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* The SVG Human Outline & Organs */}
            <div className="flex justify-center py-4 bg-slate-950/40 rounded-xl border border-card-border relative h-72">
              <div 
                className="absolute inset-0 w-32 h-64 rounded-full blur-[45px] pointer-events-none mx-auto my-auto transition-colors duration-1000 opacity-20"
                style={{
                  backgroundColor: computedScore >= 85 ? '#10b981' : computedScore >= 70 ? '#f59e0b' : '#ef4444'
                }}
              />
              
              <svg viewBox="0 0 100 200" className="h-full overflow-visible z-10">
                <path 
                  d="M50,15 C44,15 40,19 40,25 C40,31 44,35 50,35 C56,35 60,31 60,25 C60,19 56,15 50,15 Z M42,37 C30,39 25,48 25,60 C25,75 29,95 29,110 C29,112 31,114 33,114 C35,114 36,112 36,110 C36,98 38,78 38,62 C39,59 40,58 42,58 C44,58 45,61 45,64 L45,115 C45,150 42,165 42,192 C42,196 45,198 47,198 C49,198 51,196 51,192 L51,135 C51,132 52,130 54,130 C56,130 57,132 57,135 L57,192 C57,196 59,198 61,198 C63,198 66,196 66,192 C66,165 63,150 63,115 L63,64 C63,61 64,58 66,58 C68,58 69,59 70,62 C70,78 72,98 72,110 C72,112 73,114 75,114 C77,114 79,112 79,110 C79,95 83,75 83,60 C83,48 78,39 66,37 Z" 
                  fill="rgba(255, 255, 255, 0.08)"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Organ: Brain */}
                <circle 
                  cx="50" cy="25" r="5" 
                  fill={liveVitals.stressLevel <= 30 ? '#2563eb' : liveVitals.stressLevel <= 55 ? '#f59e0b' : '#ef4444'}
                  className={cn(liveVitals.stressLevel > 30 ? "animate-pulse" : "")}
                />

                {/* Organ: Lungs */}
                <g opacity={liveVitals.oxygenLevel / 100}>
                  <path d="M44,48 C41,48 40,52 42,56 C44,60 48,59 48,55 C48,51 46,48 44,48 Z" fill="#06b6d4" />
                  <path d="M56,48 C59,48 60,52 58,56 C56,60 52,59 52,55 C52,51 54,48 56,48 Z" fill="#06b6d4" />
                </g>

                {/* Organ: Heart */}
                <motion.path 
                  d="M50,54 C49.5,53 48,53 48,54 C48,55 50,57 50,57.5 C50,57.5 52,55 52,54 C52,53 50.5,53 50,54 Z" 
                  fill="#ef4444" 
                  style={{ transformOrigin: '50px 55px' }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 60 / liveVitals.heartRate, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Organ: Stomach */}
                <path 
                  d="M47,65 C45,65 45,72 48,74 C51,75 53,73 53,70 C53,67 49,65 47,65 Z" 
                  fill="#2563eb" opacity={Math.min(liveVitals.waterMl / 2500, 1)}
                />
              </svg>
            </div>

            {/* Live Sliders */}
            <div className="space-y-4 text-xs">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold pb-1 border-b border-card-border">Adjust Telemetry</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Heart Rate</span>
                  <span className="font-bold text-foreground">{liveVitals.heartRate} bpm</span>
                </div>
                <input 
                  type="range" min="50" max="120" value={liveVitals.heartRate}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, heartRate: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-red"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Stress Level</span>
                  <span className="font-bold text-foreground">{liveVitals.stressLevel}/100</span>
                </div>
                <input 
                  type="range" min="5" max="95" value={liveVitals.stressLevel}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-yellow"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Oxygen (SpO2)</span>
                  <span className="font-bold text-foreground">{liveVitals.oxygenLevel}%</span>
                </div>
                <input 
                  type="range" min="88" max="100" value={liveVitals.oxygenLevel}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, oxygenLevel: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-green"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Health Mission & Gamification */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[450px]">
          <div className="space-y-4">
            <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-card-border">
              <Award className="w-4.5 h-4.5 text-medical-teal" /> AI Health Mission
            </h3>

            {/* Level & XP */}
            <div className="space-y-2 p-3.5 bg-card-bg border border-card-border rounded-xl text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Level {liveVitals.level} Twin</span>
                <span className="text-medical-teal">{liveVitals.xp} / {liveVitals.maxXP} XP</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-card-border">
                <div 
                  className="bg-gradient-to-r from-medical-blue to-medical-teal h-full rounded-full transition-all duration-300"
                  style={{ width: `${(liveVitals.xp / liveVitals.maxXP) * 100}%` }}
                />
              </div>
            </div>

            {/* Mission Checklist */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {missions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMission(m.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-xs text-left transition",
                    m.done 
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                      : 'border-card-border bg-white/3 text-slate-300 hover:border-medical-blue/20'
                  )}
                >
                  <span className={cn(m.done && "line-through text-slate-500")}>{m.text}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold font-mono", m.done ? "text-emerald-400" : "text-medical-teal")}>+{m.xp} XP</span>
                    <CheckCircle2 className={cn("w-4.5 h-4.5", m.done ? 'text-emerald-400' : 'text-slate-600')} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>Complete missions daily to level up your biological digital twin!</span>
          </div>
        </div>

      </div>

      {/* Bottom Row: Medications & Consultations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Morning Meds */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-card-border pb-2">
            <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" /> Morning Reminders
            </h3>
            <span className="text-[10px] text-slate-500">Active</span>
          </div>
          <div className="space-y-2.5">
            {userProfile.medications.slice(0, 3).map((med) => {
              const isTaken = medLogs.some(l => l.medicineName === med && l.timeOfDay === 'morning' && l.taken);
              return (
                <button
                  key={med}
                  onClick={() => handleToggleMed(med, 'morning', isTaken)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-xs transition cursor-pointer",
                    isTaken ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-card-border bg-white/2 text-slate-400 hover:border-card-border/60'
                  )}
                >
                  <span>{med}</span>
                  <CheckCircle2 className={cn("w-4 h-4", isTaken ? 'text-emerald-400' : 'text-slate-600')} />
                </button>
              );
            })}
            {userProfile.medications.length === 0 && (
              <p className="text-xs text-slate-500 italic">No medications listed.</p>
            )}
          </div>
        </div>

        {/* Evening Meds */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-card-border pb-2">
            <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" /> Evening Reminders
            </h3>
            <span className="text-[10px] text-slate-500">Active</span>
          </div>
          <div className="space-y-2.5">
            {userProfile.medications.slice(3, 6).map((med) => {
              const isTaken = medLogs.some(l => l.medicineName === med && l.timeOfDay === 'night' && l.taken);
              return (
                <button
                  key={med}
                  onClick={() => handleToggleMed(med, 'night', isTaken)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-xs transition cursor-pointer",
                    isTaken ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-card-border bg-white/2 text-slate-400 hover:border-card-border/60'
                  )}
                >
                  <span>{med}</span>
                  <CheckCircle2 className={cn("w-4 h-4", isTaken ? 'text-emerald-400' : 'text-slate-600')} />
                </button>
              );
            })}
            {userProfile.medications.length <= 3 && (
              <p className="text-xs text-slate-500 italic">No evening medications.</p>
            )}
          </div>
        </div>

        {/* Upcoming Consultations */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-card-border pb-2">
            <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-medical-teal" /> Consultations
            </h3>
            <span className="text-[10px] text-slate-500">Scheduled</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
            {appointments.map((appt, idx) => (
              <div key={idx} className="p-3.5 bg-white/3 border border-card-border rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-start gap-1">
                  <h4 className="font-bold text-foreground leading-tight">{appt.doctorName || appt.doctor_name}</h4>
                  <span className="text-[9px] text-medical-blue font-mono shrink-0">
                    {appt.appointmentTime ? appt.appointmentTime.replace('T', ' ').slice(5, 16) : appt.appointment_time}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{appt.specialty} · {appt.hospitalName || appt.hospital_name}</p>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-6 text-[11px] text-slate-500 italic">
                No upcoming appointments.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
