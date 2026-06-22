'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Activity, TrendingUp, Heart, Brain, 
  ShieldAlert, Moon, Droplet, Utensils, CheckCircle2, 
  Zap, Sparkles, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface TimeMachineProps {
  userProfile: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

export default function TimeMachine({ userProfile }: TimeMachineProps) {
  // Input parameters for simulation
  const [sleep, setSleep] = useState(7.5);
  const [exercise, setExercise] = useState(30); // minutes/day
  const [water, setWater] = useState(2000); // ml/day
  const [junkFood, setJunkFood] = useState<'Never' | 'Weekly' | 'Daily'>('Weekly');
  const [medAdherence, setMedAdherence] = useState(100); // percentage
  const [smoking, setSmoking] = useState(false);
  
  const [simDuration, setSimDuration] = useState<'1M' | '3M' | '6M'>('3M');
  const [isSimulating, setIsSimulating] = useState(false);

  // Projections state
  const [healthScore, setHealthScore] = useState(88);
  const [cardioRisk, setCardioRisk] = useState(3.2);
  const [diabetesRisk, setDiabetesRisk] = useState(5.3);
  const [stressLevel, setStressLevel] = useState(22);
  const [twinVerdict, setTwinVerdict] = useState('');
  const [agentVerdicts, setAgentVerdicts] = useState<{ agent: string; status: 'optimal' | 'warning' | 'critical'; text: string }[]>([]);

  // Historical / projection chart points
  const [chartPoints, setChartPoints] = useState<{ label: string; score: number }[]>([]);

  const runSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      // Calculate outputs based on inputs and duration modifier
      const months = simDuration === '1M' ? 1 : simDuration === '3M' ? 3 : 6;
      
      // Calculate base penalties/bonuses
      let scoreModifier = 0;
      let cardioMultiplier = 1.0;
      let diabetesMultiplier = 1.0;
      let stressModifier = 0;

      // Sleep effect
      if (sleep < 6) {
        scoreModifier -= (6 - sleep) * 8 * months;
        cardioMultiplier += (6 - sleep) * 0.15 * months;
        stressModifier += (6 - sleep) * 12 * months;
      } else if (sleep >= 7 && sleep <= 9) {
        scoreModifier += 3 * months;
        stressModifier -= 4 * months;
      }

      // Exercise effect
      if (exercise < 20) {
        scoreModifier -= (20 - exercise) * 0.4 * months;
        cardioMultiplier += 0.25 * months;
        diabetesMultiplier += 0.2 * months;
      } else {
        scoreModifier += Math.min((exercise - 20) * 0.15, 8) * months;
        cardioMultiplier -= Math.min((exercise - 20) * 0.005, 0.2) * months;
        diabetesMultiplier -= Math.min((exercise - 20) * 0.006, 0.25) * months;
      }

      // Water effect
      if (water < 1500) {
        scoreModifier -= 4 * months;
        stressModifier += 5 * months;
      } else if (water >= 2500) {
        scoreModifier += 2 * months;
      }

      // Junk food effect
      if (junkFood === 'Daily') {
        scoreModifier -= 12 * months;
        cardioMultiplier += 0.4 * months;
        diabetesMultiplier += 0.5 * months;
      } else if (junkFood === 'Weekly') {
        scoreModifier -= 2 * months;
      } else {
        scoreModifier += 5 * months;
        cardioMultiplier -= 0.1 * months;
        diabetesMultiplier -= 0.15 * months;
      }

      // Medication compliance (crucial for chronic conditions)
      const hasHypertension = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'));
      const hasDiabetes = userProfile.conditions.some(c => c.toLowerCase().includes('diabetes'));
      
      const adherenceFraction = medAdherence / 100;
      if (adherenceFraction < 0.9) {
        const missedAdherence = (1 - adherenceFraction);
        scoreModifier -= missedAdherence * 20 * months;
        
        if (hasHypertension) {
          cardioMultiplier += missedAdherence * 1.5 * months;
        }
        if (hasDiabetes) {
          diabetesMultiplier += missedAdherence * 1.8 * months;
        }
      }

      // Smoking effect
      if (smoking) {
        scoreModifier -= 15 * months;
        cardioMultiplier += 0.8 * months;
        stressModifier += 10 * months;
      }

      // Clamp outputs
      const finalScore = Math.max(Math.min(Math.round(88 + scoreModifier), 100), 20);
      const finalCardio = Math.max(Math.min(parseFloat((3.2 * cardioMultiplier).toFixed(1)), 95.0), 1.0);
      const finalDiabetes = Math.max(Math.min(parseFloat((5.3 * diabetesMultiplier).toFixed(1)), 15.0), 3.5);
      const finalStress = Math.max(Math.min(Math.round(22 + stressModifier), 100), 5);

      setHealthScore(finalScore);
      setCardioRisk(finalCardio);
      setDiabetesRisk(finalDiabetes);
      setStressLevel(finalStress);

      // Generate visual chart trajectory
      const trajPoints = [];
      const baseScore = 88;
      for (let i = 0; i <= months; i++) {
        const tFraction = i / months;
        const projectedVal = Math.round(baseScore + scoreModifier * tFraction);
        trajPoints.push({
          label: i === 0 ? 'Now' : `${i}M`,
          score: Math.max(Math.min(projectedVal, 100), 20)
        });
      }
      setChartPoints(trajPoints);

      // Verdict messages
      let mainVerdict = 'Your Digital Twin predicts a highly resilient future path. Autonomic parameters remain stable.';
      if (finalScore < 70) {
        mainVerdict = `CRITICAL DEGRADATION WARNING: Continuing this lifestyle for ${months} months will trigger significant biological stress. Your cardiovascular and metabolic reserves will be critically depleted.`;
      } else if (finalScore < 82) {
        mainVerdict = `CAUTION ADVISED: Sub-optimal lifestyle choices over ${months} months show gradual health score decay. Early stress and fatigue patterns are emerging.`;
      } else if (finalScore >= 92) {
        mainVerdict = `OPTIMAL EVOLUTION: Your health score is projected to peak at ${finalScore}/100. This course will significantly expand your healthy lifespan, sleep coherence, and cardiovascular recovery.`;
      }
      setTwinVerdict(mainVerdict);

      // Agent Verifications
      const verdicts: { agent: string; status: 'optimal' | 'warning' | 'critical'; text: string }[] = [];
      
      // Cardiac Agent
      if (finalCardio > 8.0) {
        verdicts.push({
          agent: 'Cardiac Guard Agent',
          status: 'critical',
          text: `Atherosclerotic plaque accumulation risks rising. BP projection shows arterial walls hardening.`
        });
      } else if (finalCardio > 4.5) {
        verdicts.push({
          agent: 'Cardiac Guard Agent',
          status: 'warning',
          text: `Autonomic resting heart rate is expected to rise by 6bpm. HRV recovery shows standard stress decay.`
        });
      } else {
        verdicts.push({
          agent: 'Cardiac Guard Agent',
          status: 'optimal',
          text: `Myocardial efficiency remains high. Rest HRV trends upward, maintaining cardiac reserve.`
        });
      }

      // Metabolic Agent
      if (finalDiabetes > 6.4) {
        verdicts.push({
          agent: 'Metabolic Guard Agent',
          status: 'critical',
          text: `Insulin resistance index is breaching pre-diabetic thresholds. HbA1c projection: ${finalDiabetes}%.`
        });
      } else if (finalDiabetes > 5.7) {
        verdicts.push({
          agent: 'Metabolic Guard Agent',
          status: 'warning',
          text: `Fasting blood glucose showing mild elevation. Pancreatic beta-cell load is rising.`
        });
      } else {
        verdicts.push({
          agent: 'Metabolic Guard Agent',
          status: 'optimal',
          text: `Fasting glucose curves show normal circadian insulin sensitivity. Low glycation risk.`
        });
      }

      // Sleep & Stress Agent
      if (finalStress > 50) {
        verdicts.push({
          agent: 'Circadian Swarm Agent',
          status: 'critical',
          text: `Nocturnal cortisol levels are elevated. Delta deep sleep duration decreases by 40%.`
        });
      } else if (finalStress > 30) {
        verdicts.push({
          agent: 'Circadian Swarm Agent',
          status: 'warning',
          text: `Nocturnal sleep architecture shifting. Risk of morning fatigue and brain fog increases.`
        });
      } else {
        verdicts.push({
          agent: 'Circadian Swarm Agent',
          status: 'optimal',
          text: `Sleep regeneration efficiency is stabilized. Deep sleep cycle duration is protected.`
        });
      }

      setAgentVerdicts(verdicts);
      setIsSimulating(false);

      logToSplunk('future_health_simulation', {
        action: 'future_simulation_completed',
        simulationMonths: months,
        inputs: { sleep, exercise, water, junkFood, medAdherence, smoking },
        outputs: { healthScore: finalScore, cardioRisk: finalCardio, diabetesRisk: finalDiabetes, stressLevel: finalStress }
      }, { severity: finalScore < 70 ? 'Critical' : finalScore < 82 ? 'Warning' : 'Success' });

    }, 1200);
  };

  // Run simulation on mount and when parameters change
  useEffect(() => {
    runSimulation();
  }, [sleep, exercise, water, junkFood, medAdherence, smoking, simDuration]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10 space-y-1">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-medical-blue animate-pulse" />
            Health Time Machine (Digital Twin Simulation)
          </h2>
          <p className="text-xs text-slate-400">
            Simulate how your current lifestyle choices will shape your biological twin over 1, 3, or 6 months.
          </p>
        </div>
        
        <div className="z-10 flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {(['1M', '3M', '6M'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSimDuration(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition duration-200",
                simDuration === r ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
              )}
            >
              {r === '1M' ? '1 Month' : r === '3M' ? '3 Months' : '6 Months'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Simulation Controls */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-5 h-fit">
          <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-medical-teal" /> Adjust Lifestyle Parameters
          </h3>

          {/* Sleep hours */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration
              </span>
              <span className="text-white font-bold">{sleep} hrs / day</span>
            </div>
            <input
              type="range"
              min="4"
              max="9"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-blue"
            />
          </div>

          {/* Exercise Minutes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> Daily Exercise
              </span>
              <span className="text-white font-bold">{exercise} mins / day</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={exercise}
              onChange={(e) => setExercise(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-teal"
            />
          </div>

          {/* Hydration */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-medical-blue" /> Daily Hydration
              </span>
              <span className="text-white font-bold">{water} ml / day</span>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="250"
              value={water}
              onChange={(e) => setWater(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-blue"
            />
          </div>

          {/* Junk Food */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-500" /> Junk Food Frequency
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {(['Never', 'Weekly', 'Daily'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setJunkFood(mode)}
                  className={cn(
                    "py-1.5 rounded-lg border text-center text-xs font-semibold transition",
                    junkFood === mode 
                      ? 'border-medical-blue bg-medical-blue/15 text-white' 
                      : 'border-white/5 bg-white/2 text-slate-400 hover:border-white/10'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Med Adherence */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-medical-teal" /> Medicine Adherence
              </span>
              <span className="text-white font-bold">{medAdherence}% adherence</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={medAdherence}
              onChange={(e) => setMedAdherence(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-teal"
            />
          </div>

          {/* Smoking Switch */}
          <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-200 font-bold">Nicotine/Smoking Habits</span>
              <p className="text-[9px] text-slate-500">Accelerates cellular age and arterial stiffness</p>
            </div>
            <button
              onClick={() => setSmoking(!smoking)}
              className={cn(
                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                smoking ? "bg-rose-600" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  smoking ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Manual Run trigger */}
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isSimulating && "animate-spin")} />
            {isSimulating ? 'Computing Digital Twin...' : 'Recalculate Projections'}
          </button>
        </div>

        {/* Right Side: Projections Output */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Simulation Output Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                title: 'Projected Health Score',
                val: healthScore,
                unit: '/100',
                desc: 'Overall twin status',
                color: healthScore >= 85 ? 'text-emerald-400' : healthScore >= 70 ? 'text-amber-400' : 'text-rose-500'
              },
              {
                title: 'Cardiovascular Risk',
                val: `${cardioRisk}%`,
                unit: '',
                desc: 'Cardiac stress projection',
                color: cardioRisk <= 4.0 ? 'text-emerald-400' : cardioRisk <= 8.0 ? 'text-amber-400' : 'text-rose-500'
              },
              {
                title: 'Diabetes HbA1c Est.',
                val: `${diabetesRisk}%`,
                unit: '',
                desc: 'Glycation load forecast',
                color: diabetesRisk <= 5.6 ? 'text-emerald-400' : diabetesRisk <= 6.4 ? 'text-amber-400' : 'text-rose-500'
              },
              {
                title: 'Nocturnal Stress Index',
                val: stressLevel,
                unit: '/100',
                desc: 'Autonomic stress level',
                color: stressLevel <= 30 ? 'text-emerald-400' : stressLevel <= 55 ? 'text-amber-400' : 'text-rose-500'
              }
            ].map((out, idx) => (
              <div key={idx} className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{out.title}</span>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn("text-2xl font-extrabold font-display", out.color)}>{out.val}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{out.unit}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 block leading-tight">{out.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Future Projection Graph */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-medical-teal" /> Projected Health Score Trajectory
              </h3>
              <span className="text-[10px] text-slate-400">Current Health: 88</span>
            </div>

            {chartPoints.length > 0 ? (
              <div className="h-44 relative pt-4">
                <svg className="w-full h-full pb-6 overflow-visible" viewBox="0 0 300 100">
                  <defs>
                    <linearGradient id="simGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={healthScore >= 85 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#f43f5e'} stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="300" y2="0" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />

                  {/* Area Path */}
                  <path
                    d={`M 0 100 L 0 ${100 - (chartPoints[0].score / 100) * 100} ${chartPoints.map((pt, idx) => {
                      const x = (idx / (chartPoints.length - 1)) * 300;
                      const y = 100 - (pt.score / 100) * 100;
                      return `L ${x} ${y}`;
                    }).join(' ')} L 300 100 Z`}
                    fill="url(#simGlow)"
                  />

                  {/* Stroke Line */}
                  <path
                    d={chartPoints.map((pt, idx) => {
                      const x = (idx / (chartPoints.length - 1)) * 300;
                      const y = 100 - (pt.score / 100) * 100;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={healthScore >= 85 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#f43f5e'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Nodes */}
                  {chartPoints.map((pt, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * 300;
                    const y = 100 - (pt.score / 100) * 100;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="3" fill="#02040a" stroke={healthScore >= 85 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#f43f5e'} strokeWidth="2" />
                        <text x={x} y={y - 8} textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                          {pt.score}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X Axis Labels */}
                <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[9px] text-slate-500 font-mono mt-1 pr-1">
                  {chartPoints.map((pt, idx) => (
                    <span key={idx}>{pt.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                Initializing simulation graph...
              </div>
            )}
          </div>

          {/* AI Guardian Swarm Projections */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex gap-3">
              <ShieldAlert className={cn(
                "w-5 h-5 shrink-0 mt-0.5",
                healthScore >= 85 ? 'text-emerald-400' : healthScore >= 70 ? 'text-amber-400' : 'text-rose-400 animate-bounce'
              )} />
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">Digital Twin Verdict</p>
                <p className="text-xs text-white leading-relaxed font-semibold">{twinVerdict}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Agent Observers</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {agentVerdicts.map((item, i) => (
                  <div key={i} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-2 flex flex-col justify-between text-[11px] leading-relaxed">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="font-bold text-slate-200">{item.agent}</span>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === 'optimal' ? 'bg-emerald-400' : item.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400 animate-ping'
                      )} />
                    </div>
                    <p className="text-slate-400 mt-1 font-mono text-[10px]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
