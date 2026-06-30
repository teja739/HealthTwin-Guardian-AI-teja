'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Activity, TrendingUp, Heart, Brain, 
  ShieldAlert, Moon, Droplet, Utensils, CheckCircle2, 
  Zap, Sparkles, RefreshCw, BarChart2, Calendar 
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
  const [exercise, setExercise] = useState(30); 
  const [water, setWater] = useState(2000); 
  const [junkFood, setJunkFood] = useState<'Never' | 'Weekly' | 'Daily'>('Weekly');
  const [medAdherence, setMedAdherence] = useState(100); 
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

  // GitHub-style contribution graph mock data (7 rows, 20 columns = 140 days)
  const [contributionData, setContributionData] = useState<any[]>([]);

  useEffect(() => {
    // Generate 140 days of historical health score colors
    const data = [];
    const baseScores = [75, 78, 80, 82, 84, 86, 88, 91, 92, 94];
    for (let i = 0; i < 140; i++) {
      // Create a progression from lower scores in the past to higher scores recently
      const progressFactor = i / 140;
      const noise = Math.floor(Math.random() * 8 - 4);
      const score = Math.max(Math.min(Math.round(76 + 18 * progressFactor + noise), 100), 40);
      
      let colorClass = "bg-slate-900"; // Empty/low
      if (score >= 90) colorClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
      else if (score >= 82) colorClass = "bg-emerald-600/70";
      else if (score >= 75) colorClass = "bg-emerald-700/40";
      else if (score >= 65) colorClass = "bg-amber-500/35";
      else colorClass = "bg-rose-500/40";

      data.push({ day: i, score, colorClass });
    }
    setContributionData(data);
  }, []);

  const runSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const months = simDuration === '1M' ? 1 : simDuration === '3M' ? 3 : 6;
      
      let scoreModifier = 0;
      let cardioMultiplier = 1.0;
      let diabetesMultiplier = 1.0;
      let stressModifier = 0;

      if (sleep < 6) {
        scoreModifier -= (6 - sleep) * 8 * months;
        cardioMultiplier += (6 - sleep) * 0.15 * months;
        stressModifier += (6 - sleep) * 12 * months;
      } else if (sleep >= 7 && sleep <= 9) {
        scoreModifier += 3 * months;
        stressModifier -= 4 * months;
      }

      if (exercise < 20) {
        scoreModifier -= (20 - exercise) * 0.4 * months;
        cardioMultiplier += 0.25 * months;
        diabetesMultiplier += 0.2 * months;
      } else {
        scoreModifier += Math.min((exercise - 20) * 0.15, 8) * months;
        cardioMultiplier -= Math.min((exercise - 20) * 0.005, 0.2) * months;
        diabetesMultiplier -= Math.min((exercise - 20) * 0.006, 0.25) * months;
      }

      if (water < 1500) {
        scoreModifier -= 4 * months;
        stressModifier += 5 * months;
      } else if (water >= 2500) {
        scoreModifier += 2 * months;
      }

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

      if (smoking) {
        scoreModifier -= 15 * months;
        cardioMultiplier += 0.8 * months;
        stressModifier += 10 * months;
      }

      const finalScore = Math.max(Math.min(Math.round(88 + scoreModifier), 100), 20);
      const finalCardio = Math.max(Math.min(parseFloat((3.2 * cardioMultiplier).toFixed(1)), 95.0), 1.0);
      const finalDiabetes = Math.max(Math.min(parseFloat((5.3 * diabetesMultiplier).toFixed(1)), 15.0), 3.5);
      const finalStress = Math.max(Math.min(Math.round(22 + stressModifier), 100), 5);

      setHealthScore(finalScore);
      setCardioRisk(finalCardio);
      setDiabetesRisk(finalDiabetes);
      setStressLevel(finalStress);

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

      let mainVerdict = 'Your Digital Twin predicts a highly resilient future path. Autonomic parameters remain stable.';
      if (finalScore < 70) {
        mainVerdict = `CRITICAL DEGRADATION: Lifestyle parameters for ${months} months will trigger significant biological stress.`;
      } else if (finalScore < 82) {
        mainVerdict = `CAUTION: Sub-optimal lifestyle choices over ${months} months show gradual health score decay.`;
      } else if (finalScore >= 92) {
        mainVerdict = `OPTIMAL EVOLUTION: Health score is projected to peak at ${finalScore}/100, expanding your cardiovascular recovery.`;
      }
      setTwinVerdict(mainVerdict);

      const verdicts: { agent: string; status: 'optimal' | 'warning' | 'critical'; text: string }[] = [];
      
      if (finalCardio > 8.0) {
        verdicts.push({ agent: 'Cardiac Agent', status: 'critical', text: `BP projection shows arterial walls hardening.` });
      } else if (finalCardio > 4.5) {
        verdicts.push({ agent: 'Cardiac Agent', status: 'warning', text: `Autonomic resting heart rate is expected to rise by 6bpm.` });
      } else {
        verdicts.push({ agent: 'Cardiac Agent', status: 'optimal', text: `Myocardial efficiency remains high. Rest HRV trends upward.` });
      }

      if (finalDiabetes > 6.4) {
        verdicts.push({ agent: 'Metabolic Agent', status: 'critical', text: `HbA1c projection is breaching pre-diabetic thresholds.` });
      } else if (finalDiabetes > 5.7) {
        verdicts.push({ agent: 'Metabolic Agent', status: 'warning', text: `Fasting blood glucose showing mild elevation.` });
      } else {
        verdicts.push({ agent: 'Metabolic Agent', status: 'optimal', text: `Fasting glucose curves show normal insulin sensitivity.` });
      }

      setAgentVerdicts(verdicts);
      setIsSimulating(false);

      logToSplunk('future_health_simulation', {
        action: 'future_simulation_completed',
        simulationMonths: months,
        outputs: { healthScore: finalScore }
      }, { severity: finalScore < 70 ? 'Critical' : 'Warning' });

    }, 1200);
  };

  useEffect(() => {
    runSimulation();
  }, [sleep, exercise, water, junkFood, medAdherence, smoking, simDuration]);

  return (
    <div className="space-y-6">
      
      {/* GitHub-style Health Timeline Grid */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-medical-teal/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div>
          <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-medical-teal" /> Health Contribution Timeline
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Daily health index tracking over the last 140 days (GitHub contribution style)</p>
        </div>

        {/* The Grid */}
        <div className="flex flex-col space-y-2 pt-2 overflow-x-auto">
          <div className="grid grid-flow-col gap-1.5 w-max">
            {Array.from({ length: 20 }).map((_, colIdx) => (
              <div key={colIdx} className="grid grid-rows-7 gap-1.5">
                {contributionData.slice(colIdx * 7, (colIdx + 1) * 7).map((day, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={cn("w-3 h-3 rounded-[3px] transition duration-200 cursor-pointer", day.colorClass)}
                    title={`Day ${day.day}: Health Score ${day.score}/100`}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-card-border max-w-lg">
            <span>140 Days Ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500/40" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500/35" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700/40" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/70" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>

        {/* Monthly Timeline Nodes */}
        <div className="pt-4 border-t border-card-border">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold pb-3">Monthly Progression</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { month: 'January', score: 78, trend: 'Initial Calibration', color: 'text-rose-400' },
              { month: 'February', score: 82, trend: '+4 Points (Active)', color: 'text-amber-400' },
              { month: 'March', score: 91, trend: '+9 Points (Coherence)', color: 'text-medical-teal' },
              { month: 'April', score: 94, trend: 'Optimal Regeneration', color: 'text-medical-green' }
            ].map((node, i) => (
              <div key={i} className="bg-white/3 border border-card-border p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">{node.month}</span>
                  <p className="text-xs font-extrabold text-foreground mt-0.5">{node.trend}</p>
                </div>
                <span className={cn("text-lg font-display font-extrabold", node.color)}>{node.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Simulation Controls */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-5 h-fit">
          <div>
            <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-medical-blue" /> Twin Time Simulator
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Adjust parameters to project future twin health trajectory</p>
          </div>

          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-card-border">
            {(['1M', '3M', '6M'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSimDuration(r)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer",
                  simDuration === r ? "bg-medical-blue/25 text-medical-blue border border-medical-blue/25" : "text-slate-400 hover:text-white"
                )}
              >
                {r === '1M' ? '1 Month' : r === '3M' ? '3 Months' : '6 Months'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration</span>
                <span className="text-foreground font-extrabold">{sleep} hrs/day</span>
              </div>
              <input type="range" min="4" max="9" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-blue" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><Activity className="w-4 h-4 text-medical-green" /> Exercise</span>
                <span className="text-foreground font-extrabold">{exercise} mins/day</span>
              </div>
              <input type="range" min="0" max="90" step="5" value={exercise} onChange={(e) => setExercise(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-green" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><Droplet className="w-4 h-4 text-medical-blue" /> Hydration</span>
                <span className="text-foreground font-extrabold">{water} ml/day</span>
              </div>
              <input type="range" min="500" max="4000" step="250" value={water} onChange={(e) => setWater(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-blue" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-medical-yellow" /> Junk Food</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Never', 'Weekly', 'Daily'] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setJunkFood(mode)} className={cn("py-2 rounded-xl border text-center text-xs font-semibold transition cursor-pointer", junkFood === mode ? 'border-medical-blue bg-medical-blue/15 text-white' : 'border-card-border bg-white/2 text-slate-400')}>{mode}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-medical-teal" /> Med Adherence</span>
                <span className="text-foreground font-extrabold">{medAdherence}%</span>
              </div>
              <input type="range" min="0" max="100" step="10" value={medAdherence} onChange={(e) => setMedAdherence(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-teal" />
            </div>
          </div>
        </div>

        {/* Right Side: Projections Output */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Projected Health Score', val: healthScore, unit: '/100', desc: 'Overall twin score', color: healthScore >= 85 ? 'text-medical-green' : healthScore >= 70 ? 'text-medical-yellow' : 'text-medical-red' },
              { title: 'Cardiovascular Risk', val: `${cardioRisk}%`, unit: '', desc: 'Arterial stiffening index', color: cardioRisk <= 4.0 ? 'text-medical-green' : 'text-medical-red' },
              { title: 'Diabetes HbA1c Est.', val: `${diabetesRisk}%`, unit: '', desc: 'Glycation load index', color: diabetesRisk <= 5.6 ? 'text-medical-green' : 'text-medical-red' },
              { title: 'Nocturnal Stress', val: stressLevel, unit: '/100', desc: 'Autonomic nervous stress', color: stressLevel <= 30 ? 'text-medical-green' : 'text-medical-red' }
            ].map((out, idx) => (
              <div key={idx} className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between h-28">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{out.title}</span>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn("text-2xl font-extrabold font-display", out.color)}>{out.val}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{out.unit}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">{out.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline Chart */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-medical-teal" /> Projected Health Trajectory</h3>
            <div className="h-36 pt-4 relative">
              <svg className="w-full h-full pb-5 overflow-visible" viewBox="0 0 300 100">
                <path
                  d={chartPoints.map((pt, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * 300;
                    const y = 100 - (pt.score / 100) * 100;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none" stroke={healthScore >= 85 ? '#10b981' : '#ef4444'} strokeWidth="3" strokeLinecap="round"
                />
                {chartPoints.map((pt, idx) => {
                  const x = (idx / (chartPoints.length - 1)) * 300;
                  const y = 100 - (pt.score / 100) * 100;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="3" fill="#0f172a" stroke={healthScore >= 85 ? '#10b981' : '#ef4444'} strokeWidth="2" />
                      <text x={x} y={y - 8} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="monospace">{pt.score}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
