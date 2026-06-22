'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Brain, Moon, 
  TrendingUp, AlertCircle, ShieldCheck, 
  Clock, Flame, RefreshCw, ChevronRight,
  CheckCircle2, Sparkles, Calendar, User, MapPin, Sun,
  Droplet, Award, Zap
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
}

export default function Home({ userProfile }: HomeProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '12M'>('7D');
  const [isSyncing, setIsSyncing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medLogs, setMedLogs] = useState<any[]>([]);
  const [copilotSummary, setCopilotSummary] = useState('');

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
    maxXP: 500,
    waterQuestClaimed: false,
    stepsQuestClaimed: false
  });

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadDashboardData() {
      // 1. Fetch appointments
      const appts = await getAppointments(userProfile.email);
      setAppointments(appts.slice(0, 3)); // show top 3 upcoming

      // 2. Fetch medication logs
      const logs = await getMedicationLogs(userProfile.email, dateStr);
      setMedLogs(logs);

      // 3. Generate customized copilot greeting summary
      const hasHypertension = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'));
      let greeting = `Your health profile is fully calibrated. All core biomarkers show parasympathetic dominance.`;
      if (hasHypertension) {
        greeting += ` ALERT: High temperatures are forecast today (33°C). Due to your Hypertension risk, restrict outdoor cardiovascular activities and keep sodium intake below 2,000mg.`;
      }
      setCopilotSummary(greeting);
    }
    loadDashboardData();
  }, [userProfile.email, userProfile.conditions, dateStr]);

  const handleToggleMed = async (medName: string, timeOfDay: string, currentTaken: boolean) => {
    const nextTaken = !currentTaken;
    try {
      await saveMedicationLog(userProfile.email, dateStr, medName, timeOfDay, nextTaken);
      
      // Update local state
      setMedLogs(prev => {
        const filtered = prev.filter(l => !(l.medicineName === medName && l.timeOfDay === timeOfDay));
        return [...filtered, { medicineName: medName, timeOfDay, taken: nextTaken, takenTime: nextTaken ? new Date().toISOString() : null }];
      });

      // Award XP for meds adherence
      if (nextTaken) {
        setLiveVitals(prev => {
          let xp = prev.xp + 50;
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

  const handleSyncVitals = async () => {
    setIsSyncing(true);
    
    // Generate simulated biometric telemetry
    const heartRate = Math.floor(Math.random() * (78 - 60) + 60);
    const systolic = Math.floor(Math.random() * (124 - 115) + 115);
    const diastolic = Math.floor(Math.random() * (80 - 70) + 70);
    const glucose = Math.floor(Math.random() * (98 - 85) + 85);
    const sleepEfficiency = Math.floor(Math.random() * (96 - 88) + 88);
    const stressLevel = Math.floor(Math.random() * (35 - 15) + 15);
    
    setLiveVitals(prev => ({
      ...prev,
      heartRate,
      stressLevel,
      bloodPressure: `${systolic}/${diastolic}`
    }));

    // Log vitals telemetry to Splunk
    await logToSplunk('biometric_telemetry', {
      action: 'vitals_synchronized',
      heartRate,
      bloodPressure: `${systolic}/${diastolic}`,
      systolic,
      diastolic,
      glucose,
      sleepEfficiency,
      stressLevel,
      healthScore: 88
    }, { severity: 'Success' });

    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const addWater = (amount: number) => {
    setLiveVitals(prev => {
      const nextWater = Math.min(prev.waterMl + amount, 4000);
      let xp = prev.xp;
      let level = prev.level;
      let maxXP = prev.maxXP;
      let waterQuestClaimed = prev.waterQuestClaimed;
      
      if (nextWater >= 2500 && !prev.waterQuestClaimed) {
        waterQuestClaimed = true;
        xp += 80;
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } });
        if (xp >= maxXP) {
          level += 1;
          xp -= maxXP;
          maxXP += 100;
        }
      }
      return { ...prev, waterMl: nextWater, xp, level, maxXP, waterQuestClaimed };
    });
  };

  const addSteps = (amount: number) => {
    setLiveVitals(prev => {
      const nextSteps = Math.min(prev.stepsCount + amount, 15000);
      let xp = prev.xp;
      let level = prev.level;
      let maxXP = prev.maxXP;
      let stepsQuestClaimed = prev.stepsQuestClaimed;
      
      if (nextSteps >= 10000 && !prev.stepsQuestClaimed) {
        stepsQuestClaimed = true;
        xp += 120;
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
        if (xp >= maxXP) {
          level += 1;
          xp -= maxXP;
          maxXP += 100;
        }
      }
      return { ...prev, stepsCount: nextSteps, xp, level, maxXP, stepsQuestClaimed };
    });
  };

  // Compute live health score
  const computedScore = Math.max(
    Math.min(
      Math.round(
        92 - (liveVitals.stressLevel * 0.25) - (liveVitals.heartRate > 75 ? (liveVitals.heartRate - 75) * 0.3 : 0) + (liveVitals.stepsCount >= 10000 ? 4 : 0) + (liveVitals.waterMl >= 2500 ? 3 : 0)
      ), 
      100
    ), 
    10
  );

  const stats = [
    {
      id: 'score',
      title: 'AI Health Score',
      value: computedScore.toString(),
      unit: '/100',
      description: computedScore >= 85 ? 'Optimal vital status' : 'Biomarkers fluctuate',
      icon: ShieldCheck,
      color: computedScore >= 85 ? 'text-medical-teal' : 'text-amber-400',
      bgGlow: 'rgba(13, 242, 201, 0.15)',
      trend: `${computedScore >= 85 ? '+' : ''}${(computedScore - 85).toFixed(1)}% vs base`,
      details: 'All core biomarkers fall within normal guidelines. Biological twin status is synchronized.'
    },
    {
      id: 'cardiac',
      title: 'Cardiovascular Risk',
      value: liveVitals.heartRate > 75 ? 'Moderate' : 'Low',
      unit: 'Risk',
      description: `Estimated ${(3.2 * (liveVitals.heartRate / 72)).toFixed(1)}% probability`,
      icon: Heart,
      color: liveVitals.heartRate > 75 ? 'text-amber-400' : 'text-emerald-400',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      trend: `HR: ${liveVitals.heartRate} bpm`,
      details: `Based on resting heart rate telemetry, arterial stiffening indicators, and blood pressure (${liveVitals.bloodPressure} mmHg).`
    },
    {
      id: 'diabetes',
      title: 'Diabetes Risk Index',
      value: 'Low',
      unit: 'Risk',
      description: 'HbA1c equivalent: 5.3%',
      icon: Activity,
      color: 'text-emerald-400',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      trend: 'Glucose: 92 mg/dL',
      details: 'Fasting glucose telemetry shows stable insulin responses post-meals.'
    },
    {
      id: 'sleep',
      title: 'Sleep Regeneration',
      value: liveVitals.sleepHours.toString(),
      unit: 'hrs',
      description: '38% Deep & REM sleep',
      icon: Moon,
      color: 'text-medical-blue',
      bgGlow: 'rgba(0, 210, 255, 0.15)',
      trend: '92% Efficiency Score',
      details: 'High sleep quality with low nocturnal awakenings. Ready for peak physical performance.'
    },
    {
      id: 'compliance',
      title: 'Meds Compliance',
      value: '100',
      unit: '%',
      description: '6/6 active prescriptions',
      icon: Clock,
      color: 'text-medical-teal',
      bgGlow: 'rgba(13, 242, 201, 0.15)',
      trend: '0 missed doses',
      details: 'All scheduled morning and evening medications accounted for.'
    },
    {
      id: 'stress',
      title: 'Stress Telemetry',
      value: liveVitals.stressLevel.toString(),
      unit: '/100',
      description: liveVitals.stressLevel <= 30 ? 'Parasympathetic dominant' : 'Sympathetic dominant',
      icon: Flame,
      color: liveVitals.stressLevel <= 30 ? 'text-medical-blue' : 'text-amber-400',
      bgGlow: 'rgba(0, 210, 255, 0.15)',
      trend: `Stress index: ${liveVitals.stressLevel}`,
      details: 'Heart Rate Variability indicates a healthy, rested autonomic nervous system.'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'info',
      title: 'Lisinopril Intake Registered',
      time: '10 mins ago',
      desc: 'Blood pressure medication successfully logged via Smart Bottle.'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Slight Sleep Cycle Shift',
      time: '5 hrs ago',
      desc: 'Your deep sleep window shifted by 45 minutes later than your set circadian target.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        {/* Glow behind banner */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-medical-blue/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome back, {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1.5 text-xs md:text-sm flex items-start gap-1.5 max-w-3xl leading-relaxed">
            <Sparkles className="w-4 h-4 text-medical-teal shrink-0 mt-0.5" />
            <span><strong>Health Copilot:</strong> {copilotSummary}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Guard: Active
          </div>
          <button 
            onClick={handleSyncVitals}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs transition duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Vitals'}
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const IconComp = stat.icon;
          return (
            <motion.div
              key={stat.id}
              className={cn(
                "glass-panel p-5 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300",
                hoveredMetric === stat.id ? "border-medical-blue/30 shadow-[0_0_25px_-5px_rgba(0,210,255,0.15)]" : ""
              )}
              onMouseEnter={() => setHoveredMetric(stat.id)}
              onMouseLeave={() => setHoveredMetric(null)}
              whileHover={{ y: -2 }}
            >
              {/* Background gradient indicator */}
              <div 
                className="absolute -right-10 -top-10 w-24 h-24 rounded-full blur-[40px] pointer-events-none transition-opacity duration-300"
                style={{ backgroundColor: stat.color.includes('teal') ? 'rgba(13, 242, 201, 0.2)' : stat.color.includes('emerald') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 210, 255, 0.2)' }}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10", stat.color)}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-display text-white">{stat.value}</span>
                <span className="text-sm font-medium text-slate-400">{stat.unit}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">{stat.description}</span>
                <span className={cn("font-medium", stat.color)}>{stat.trend}</span>
              </div>

              {/* Expandable info tray */}
              <motion.div 
                className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-400 leading-relaxed"
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: hoveredMetric === stat.id ? 'auto' : 0,
                  opacity: hoveredMetric === stat.id ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                {stat.details}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Health Twin Avatar & Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Health Avatar Card */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4.5 h-4.5 text-medical-teal animate-pulse" /> Digital Twin Live Avatar
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Biometric organ mapping synced with active vitals</p>
            </div>
            
            <div className="flex gap-2">
              <div className="text-[9px] text-slate-400 font-mono flex flex-col items-end">
                <span>Twin Level</span>
                <span className="text-xs font-bold text-medical-teal font-sans">Lvl {liveVitals.level}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* The SVG Human Outline & Organs */}
            <div className="flex justify-center py-4 bg-slate-950/40 rounded-xl border border-white/5 relative h-72">
              {/* Dynamic Aura background */}
              <div 
                className="absolute inset-0 w-32 h-64 rounded-full blur-[45px] pointer-events-none mx-auto my-auto transition-colors duration-1000 opacity-20"
                style={{
                  backgroundColor: computedScore >= 85 ? '#0df2c9' : computedScore >= 70 ? '#f59e0b' : '#f43f5e'
                }}
              />
              
              <svg viewBox="0 0 100 200" className="h-full overflow-visible z-10">
                {/* Body outline */}
                <path 
                  d="M50,15 C44,15 40,19 40,25 C40,31 44,35 50,35 C56,35 60,31 60,25 C60,19 56,15 50,15 Z M42,37 C30,39 25,48 25,60 C25,75 29,95 29,110 C29,112 31,114 33,114 C35,114 36,112 36,110 C36,98 38,78 38,62 C39,59 40,58 42,58 C44,58 45,61 45,64 L45,115 C45,150 42,165 42,192 C42,196 45,198 47,198 C49,198 51,196 51,192 L51,135 C51,132 52,130 54,130 C56,130 57,132 57,135 L57,192 C57,196 59,198 61,198 C63,198 66,196 66,192 C66,165 63,150 63,115 L63,64 C63,61 64,58 66,58 C68,58 69,59 70,62 C70,78 72,98 72,110 C72,112 73,114 75,114 C77,114 79,112 79,110 C79,95 83,75 83,60 C83,48 78,39 66,37 Z" 
                  fill="rgba(255, 255, 255, 0.08)"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Organ: Brain (glowing representing stress) */}
                <circle 
                  cx="50" 
                  cy="25" 
                  r="5" 
                  fill={liveVitals.stressLevel <= 30 ? '#00d2ff' : liveVitals.stressLevel <= 55 ? '#f59e0b' : '#f43f5e'}
                  className={cn(liveVitals.stressLevel > 30 ? "animate-pulse" : "")}
                  style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                />

                {/* Organ: Lungs (glowing opacity based on SpO2) */}
                <g opacity={liveVitals.oxygenLevel / 100}>
                  {/* Left Lung */}
                  <path d="M44,48 C41,48 40,52 42,56 C44,60 48,59 48,55 C48,51 46,48 44,48 Z" fill="#0df2c9" style={{ filter: 'drop-shadow(0 0 2px #0df2c9)' }} />
                  {/* Right Lung */}
                  <path d="M56,48 C59,48 60,52 58,56 C56,60 52,59 52,55 C52,51 54,48 56,48 Z" fill="#0df2c9" style={{ filter: 'drop-shadow(0 0 2px #0df2c9)' }} />
                </g>

                {/* Organ: Heart (pulsing at HR rate) */}
                <motion.path 
                  d="M50,54 C49.5,53 48,53 48,54 C48,55 50,57 50,57.5 C50,57.5 52,55 52,54 C52,53 50.5,53 50,54 Z" 
                  fill="#f43f5e" 
                  style={{ 
                    filter: 'drop-shadow(0 0 3px #f43f5e)',
                    transformOrigin: '50px 55px' 
                  }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{
                    duration: 60 / liveVitals.heartRate,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />

                {/* Organ: Stomach / Hydration Glow */}
                <path 
                  d="M47,65 C45,65 45,72 48,74 C51,75 53,73 53,70 C53,67 49,65 47,65 Z" 
                  fill="#00d2ff" 
                  opacity={Math.min(liveVitals.waterMl / 2500, 1)}
                  style={{ filter: 'drop-shadow(0 0 2px #00d2ff)' }}
                />
              </svg>
            </div>

            {/* Live twin sliders to modify values in real-time */}
            <div className="space-y-3.5 text-xs">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold pb-1 border-b border-white/5">Adjust Avatar Telemetry</p>
              
              {/* Sliders */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Heart Rate</span>
                  <span className="font-bold text-white">{liveVitals.heartRate} bpm</span>
                </div>
                <input 
                  type="range" min="50" max="120" value={liveVitals.heartRate}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, heartRate: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Stress Level</span>
                  <span className="font-bold text-white">{liveVitals.stressLevel}/100</span>
                </div>
                <input 
                  type="range" min="5" max="95" value={liveVitals.stressLevel}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Oxygen Level (SpO2)</span>
                  <span className="font-bold text-white">{liveVitals.oxygenLevel}%</span>
                </div>
                <input 
                  type="range" min="88" max="100" value={liveVitals.oxygenLevel}
                  onChange={(e) => setLiveVitals(prev => ({ ...prev, oxygenLevel: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-[10.5px] text-slate-400 leading-snug">
                Organ glow indices update dynamically to reflect autonomic and physical stress variations.
              </div>
            </div>
          </div>
        </div>

        {/* Health Copilot Quests & Gamification Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Award className="w-4.5 h-4.5 text-medical-teal" /> Daily Health Quests
            </h3>

            {/* Experience points progression bar */}
            <div className="space-y-2 p-3 bg-white/3 border border-white/5 rounded-xl text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Level {liveVitals.level} Twin</span>
                <span className="text-medical-teal">{liveVitals.xp} / {liveVitals.maxXP} XP</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-medical-blue to-medical-teal h-full rounded-full transition-all duration-300"
                  style={{ width: `${(liveVitals.xp / liveVitals.maxXP) * 100}%` }}
                />
              </div>
            </div>

            {/* Active quests list */}
            <div className="space-y-2.5">
              {/* Water target quest */}
              <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <span className={cn("font-bold text-slate-200", liveVitals.waterMl >= 2500 && "line-through text-slate-500")}>Hydration Goal (2.5L)</span>
                  <p className="text-[10px] text-slate-500">{liveVitals.waterMl}ml logged / 2500ml</p>
                </div>
                {liveVitals.waterMl >= 2500 ? (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Completed</span>
                ) : (
                  <button 
                    onClick={() => addWater(500)}
                    className="px-2.5 py-1 bg-medical-blue/20 border border-medical-blue/30 rounded text-[10px] text-white hover:bg-medical-blue/30 font-semibold"
                  >
                    +500ml
                  </button>
                )}
              </div>

              {/* Steps target quest */}
              <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <span className={cn("font-bold text-slate-200", liveVitals.stepsCount >= 10000 && "line-through text-slate-500")}>Walk 10,000 Steps</span>
                  <p className="text-[10px] text-slate-500">{liveVitals.stepsCount.toLocaleString()} / 10,000 steps</p>
                </div>
                {liveVitals.stepsCount >= 10000 ? (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Completed</span>
                ) : (
                  <button 
                    onClick={() => addSteps(2000)}
                    className="px-2.5 py-1 bg-medical-teal/20 border border-medical-teal/30 rounded text-[10px] text-white hover:bg-medical-teal/30 font-semibold"
                  >
                    +2,000 steps
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Earn XP by logging medications, steps, water, or sleep daily!</span>
          </div>
        </div>
      </div>

      {/* Adherence & Appointments Triage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Morning Adherence */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" /> Morning Medications
            </h3>
            <span className="text-[10px] text-slate-500">Adherence</span>
          </div>
          <div className="space-y-2.5">
            {userProfile.medications.slice(0, 3).map((med) => {
              const isTaken = medLogs.some(l => l.medicineName === med && l.timeOfDay === 'morning' && l.taken);
              return (
                <button
                  key={med}
                  onClick={() => handleToggleMed(med, 'morning', isTaken)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs transition",
                    isTaken ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-white/5 bg-white/2 text-slate-400 hover:border-white/10'
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

        {/* Night Adherence */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" /> Evening Medications
            </h3>
            <span className="text-[10px] text-slate-500">Adherence</span>
          </div>
          <div className="space-y-2.5">
            {userProfile.medications.slice(3, 6).map((med) => {
              const isTaken = medLogs.some(l => l.medicineName === med && l.timeOfDay === 'night' && l.taken);
              return (
                <button
                  key={med}
                  onClick={() => handleToggleMed(med, 'night', isTaken)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs transition",
                    isTaken ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-white/5 bg-white/2 text-slate-400 hover:border-white/10'
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

        {/* Scheduled Appointments */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-medical-teal" /> Upcoming Consultations
            </h3>
            <span className="text-[10px] text-slate-500">Booked</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
            {appointments.map((appt, idx) => (
              <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-start gap-1">
                  <h4 className="font-bold text-white leading-tight">{appt.doctorName || appt.doctor_name}</h4>
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

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Area Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-semibold text-white">Health Twin Index</h3>
              <p className="text-xs text-slate-400">Biological resilience scores over time</p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10">
              {(['7D', '30D', '12M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition duration-200",
                    timeRange === r ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Sparkline */}
          <div className="w-full h-60 relative mt-4">
            {/* Y Axis Labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
            </div>

            {/* SVG Path */}
            <svg className="w-full h-full pl-8 pb-6 overflow-visible" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="0" x2="500" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="0" y1="66" x2="500" y2="66" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="0" y1="133" x2="500" y2="133" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />

              {/* Area path */}
              <path
                d="M 0 50 Q 80 40 160 80 T 320 30 T 500 45 L 500 200 L 0 200 Z"
                fill="url(#chartGlow)"
              />

              {/* Stroke line */}
              <path
                d="M 0 50 Q 80 40 160 80 T 320 30 T 500 45"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Node highlights */}
              <circle cx="160" cy="80" r="5" fill="#02040a" stroke="#00d2ff" strokeWidth="3" />
              <circle cx="320" cy="30" r="5" fill="#02040a" stroke="#00d2ff" strokeWidth="3" />
              <circle cx="500" cy="45" r="5" fill="#02040a" stroke="#0df2c9" strokeWidth="3" />
            </svg>

            {/* X Axis labels */}
            <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-slate-400 pr-1 select-none">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 bg-white/5 border border-white/10 p-3 rounded-xl">
            <TrendingUp className="w-4 h-4 text-medical-teal shrink-0" />
            <span>
              <strong>Forecast:</strong> Heart rate variability shows recovery levels are high. Recommended workouts: Cardio or light runs.
            </span>
          </div>
        </div>

        {/* Alerts & Quick Summary Side Panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-white">Live Guardians</h3>
              <span className="w-2 h-2 rounded-full bg-medical-blue animate-pulse" />
            </div>

            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "p-3.5 rounded-xl border text-xs space-y-1 relative overflow-hidden transition-all duration-300",
                    alert.type === 'warning' 
                      ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/25'
                      : 'bg-white/3 border-white/5 hover:border-white/12'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-semibold flex items-center gap-1.5",
                      alert.type === 'warning' ? 'text-amber-400' : 'text-slate-200'
                    )}>
                      {alert.type === 'warning' && <AlertCircle className="w-3.5 h-3.5" />}
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-slate-500">{alert.time}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{alert.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Health Completion Metric */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Guardian Twin Setup</span>
              <span className="font-semibold text-medical-teal">100% complete</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-medical-blue to-medical-teal h-full rounded-full w-full" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your biometric twin, emergency profiles, medical reports, and drug lists are fully calibrated.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
