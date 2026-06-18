'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Brain, Moon, 
  TrendingUp, AlertCircle, ShieldCheck, 
  Clock, Flame, RefreshCw, ChevronRight,
  CheckCircle2, Sparkles, Calendar, User, MapPin, Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';
import { getAppointments, getMedicationLogs, saveMedicationLog } from '@/lib/supabase';

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

  const stats = [
    {
      id: 'score',
      title: 'AI Health Score',
      value: '88',
      unit: '/100',
      description: 'Optimal vital status',
      icon: ShieldCheck,
      color: 'text-medical-teal',
      bgGlow: 'rgba(13, 242, 201, 0.15)',
      trend: '+2.4% vs last week',
      details: 'All core biomarkers fall within normal guidelines. Cardiac efficiency improved.'
    },
    {
      id: 'cardiac',
      title: 'Cardiovascular Risk',
      value: 'Low',
      unit: 'Risk',
      description: 'Estimated 3.2% probability',
      icon: Heart,
      color: 'text-emerald-400',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      trend: 'HRV: 76ms (Stable)',
      details: 'Based on resting heart rate, ECG wave pattern logs, and blood pressure (118/74 mmHg).'
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
      value: '8.4',
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
      value: '22',
      unit: '/100',
      description: 'Parasympathetic dominant',
      icon: Flame,
      color: 'text-medical-blue',
      bgGlow: 'rgba(0, 210, 255, 0.15)',
      trend: 'Cortisol marker: Low',
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
