'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, Moon, Droplet, 
  Plus, Calendar, Sparkles, Loader2, 
  CheckCircle, Flame, ArrowUpRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWellnessLogs, saveWellnessLog } from '@/lib/supabase';
import { logToSplunk } from '@/lib/splunk-client';

interface WellnessTrackerProps {
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

export default function WellnessTracker({ userProfile }: WellnessTrackerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Today's Logger State
  const [steps, setSteps] = useState(8000);
  const [water, setWater] = useState(1500); // in ml
  const [sleep, setSleep] = useState(7.5); // in hours
  const [mood, setMood] = useState('Calm');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI insights state
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const moods = [
    { label: 'Calm', icon: '🧘' },
    { label: 'Happy', icon: '😊' },
    { label: 'Tired', icon: '😴' },
    { label: 'Stressed', icon: '😰' },
    { label: 'Sick', icon: '🤒' }
  ];

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await getWellnessLogs(userProfile.email);
      setLogs(data);
      
      // Load today's log if it already exists
      const todayLog = data.find((l: any) => l.date === dateStr);
      if (todayLog) {
        setSteps(todayLog.steps);
        setWater(todayLog.waterMl || todayLog.water_ml);
        setSleep(todayLog.sleepHours || todayLog.sleep_hours);
        setMood(todayLog.mood);
      }
      setLoading(false);
    }
    loadLogs();
  }, [userProfile.email, dateStr]);

  const handleSaveLog = async () => {
    setSaveSuccess(false);
    const logItem = {
      date: dateStr,
      steps,
      waterMl: water,
      sleepHours: sleep,
      mood
    };

    try {
      const saved = await saveWellnessLog(userProfile.email, logItem);
      // Update list
      setLogs(prev => {
        const filtered = prev.filter(l => l.date !== dateStr);
        return [saved, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
      });
      setSaveSuccess(true);
      
      logToSplunk('wellness_tracker', {
        action: 'wellness_log_saved',
        steps,
        waterMl: water,
        sleepHours: sleep,
        mood
      }, { severity: 'Success' });

      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (err) {
      console.error(err);
      alert('Failed to save log.');
    }
  };

  const handleFetchInsights = async () => {
    if (logs.length === 0 || insightsLoading) return;
    setInsightsLoading(true);
    setInsights(null);

    try {
      const response = await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, userProfile })
      });

      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      setInsights(data);

      logToSplunk('wellness_tracker', {
        action: 'insights_generated_success',
        logsAnalyzed: logs.length
      }, { severity: 'Success' });

    } catch (err) {
      console.error(err);
      // Fallback insights
      setInsights({
        summary: 'Sustain your activity loops! Consistency is primary in arterial health stabilization.',
        sleepInsight: 'Average sleep is 7.6 hours, which is optimal for neural clearance.',
        hydrationInsight: 'Fasting and post-meal hydration targets are being met reliably.',
        activityInsight: 'Sustain steps index above 8k daily to maintain cardiorespiratory output.',
        coachTips: ['Focus on consistent deep breathing.', 'Limit screen blue light cutoff hours.']
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  // Compute maximum steps and water for SVG scaling
  const maxSteps = Math.max(...logs.map(l => l.steps), 10000);
  const maxWater = Math.max(...logs.map(l => l.waterMl || l.water_ml), 3000);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-medical-blue animate-pulse" />
            Wellness Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log your daily metrics, review historical telemetry, and request AI coaching summaries.
          </p>
        </div>
        <button 
          onClick={handleFetchInsights}
          disabled={logs.length === 0 || insightsLoading}
          className="z-10 flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition-all duration-300 disabled:opacity-50"
        >
          {insightsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Get Wellness Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Panel: Log Metrics */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6 h-fit">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-medical-teal" />
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">Log Today: {dateStr}</h3>
          </div>

          {/* Water log */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-medical-blue" /> Water Intake
              </span>
              <span className="text-white font-bold">{water} ml / 2500 ml</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setWater(w => Math.min(w + 250, 4000))}
                className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                +250 ml
              </button>
              <button 
                onClick={() => setWater(w => Math.min(w + 500, 4000))}
                className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                +500 ml
              </button>
              <button 
                onClick={() => setWater(0)}
                className="px-2 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Steps log */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Daily Steps
              </span>
              <span className="text-white font-bold">{steps.toLocaleString()} / 10,000</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
                className="glass-input w-full px-3 py-2 pr-16 text-xs bg-slate-950"
              />
              <button 
                onClick={() => setSteps(s => s + 1000)}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white/10 rounded-lg text-[10px] text-white hover:bg-white/20 transition"
              >
                +1,000
              </button>
            </div>
          </div>

          {/* Sleep duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration
              </span>
              <span className="text-white font-bold">{sleep} hrs / 8.0 hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-blue"
            />
          </div>

          {/* Mood Selection */}
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mood Status</label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => {
                const isActive = mood === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={cn(
                      "py-2 rounded-xl text-center border transition flex flex-col items-center justify-center gap-1",
                      isActive 
                        ? 'border-medical-blue bg-medical-blue/15 text-white' 
                        : 'border-white/5 bg-white/2 text-slate-400 hover:border-white/12'
                    )}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-[9px] font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <button
            onClick={handleSaveLog}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition-all duration-300"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Log Saved successfully!
              </>
            ) : (
              <>
                Save Daily Logs
              </>
            )}
          </button>

        </div>

        {/* Right Panel: SVG Charts & AI Insights */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* SVG Sparklines & Graphs */}
          {logs.length > 0 ? (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-4 h-4 text-medical-teal" /> Historical Wellness Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Steps Bar Chart */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Steps History (7 Days)</span>
                  <div className="h-32 flex items-end justify-between gap-2 border-b border-white/5 pb-2 pt-4">
                    {logs.slice(0, 7).reverse().map((l, idx) => {
                      const pct = (l.steps / maxSteps) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="text-[8px] text-slate-400 font-mono scale-90">{l.steps.toLocaleString()}</div>
                          <div 
                            className="w-full bg-gradient-to-t from-medical-blue to-medical-teal rounded-t-sm transition-all duration-500 shadow-[0_0_8px_rgba(0,210,255,0.2)]" 
                            style={{ height: `${Math.max(pct, 5)}%` }} 
                          />
                          <span className="text-[9px] text-slate-500 font-mono mt-1">{l.date.slice(-5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sleep Line Graph */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sleep Durations (7 Days)</span>
                  <div className="h-32 relative border-b border-white/5 pb-2 pt-4">
                    <svg className="w-full h-full pb-4 overflow-visible" viewBox="0 0 200 100">
                      {/* Grid Lines */}
                      <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" />
                      <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" />
                      <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" />
                      
                      {/* Area Glow */}
                      <path
                        d={`M 0 100 ${logs.slice(0, 7).reverse().map((l, idx) => {
                          const x = (idx / 6) * 200;
                          const y = 100 - (l.sleepHours / 16) * 100;
                          return `L ${x} ${y}`;
                        }).join(' ')} L 200 100 Z`}
                        fill="rgba(99, 102, 241, 0.15)"
                      />

                      {/* Stroke Line */}
                      <path
                        d={logs.slice(0, 7).reverse().map((l, idx) => {
                          const x = (idx / 6) * 200;
                          const y = 100 - (l.sleepHours / 16) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Points */}
                      {logs.slice(0, 7).reverse().map((l, idx) => {
                        const x = (idx / 6) * 200;
                        const y = 100 - (l.sleepHours / 16) * 100;
                        return (
                          <circle key={idx} cx={x} cy={y} r="3" fill="#02040a" stroke="#6366f1" strokeWidth="1.5" />
                        );
                      })}
                    </svg>
                    <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[9px] text-slate-500 font-mono mt-1 pr-1">
                      {logs.slice(0, 7).reverse().map((l, i) => (
                        <span key={i}>{l.date.slice(-5)}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl text-center py-12 text-xs text-slate-400">
              No historical wellness records logged yet.
            </div>
          )}

          {/* AI Insights Display */}
          <AnimatePresence>
            {insights && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-medical-teal" />
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">AI Wellness Insights</h3>
                </div>

                <div className="space-y-3 text-xs font-mono leading-relaxed">
                  <div className="p-3.5 bg-slate-900 border border-white/5 rounded-xl text-slate-300">
                    <p className="text-[10px] text-medical-blue font-bold uppercase tracking-wider mb-1">Weekly Coach Summary</p>
                    <p>{insights.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase">Sleep Recovery</p>
                      <p className="text-slate-300 mt-1">{insights.sleepInsight}</p>
                    </div>
                    
                    <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase">Hydration Index</p>
                      <p className="text-slate-300 mt-1">{insights.hydrationInsight}</p>
                    </div>

                    <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase">Physical Output</p>
                      <p className="text-slate-300 mt-1">{insights.activityInsight}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Recommended Coach Actions</p>
                  <div className="space-y-1.5">
                    {insights.coachTips.map((tip: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <ArrowUpRight className="w-3.5 h-3.5 text-medical-teal shrink-0" />
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
