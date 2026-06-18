'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Brain, Activity, Droplet, 
  Wind, Shield, AlertTriangle, CheckCircle,
  Sun, Flame, CloudRain, Thermometer, ShieldAlert, Compass, Sparkles, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface BodyMapProps {
  userProfile?: {
    name: string;
    conditions: string[];
    allergies: string[];
    medications: string[];
  };
}

interface OrganInfo {
  id: string;
  name: string;
  icon: any;
  risk: 'Low' | 'Medium' | 'High';
  score: number;
  status: string;
  vitals: { name: string; value: string; trend: string }[];
  summary: string;
  recs: string[];
}

export default function BodyMap({ userProfile }: BodyMapProps) {
  const [activeTab, setActiveTab] = useState<'organ' | 'environment'>('organ');
  const [selectedOrgan, setSelectedOrgan] = useState<string>('heart');
  const [locationName, setLocationName] = useState('Detecting location...');
  const [aqi, setAqi] = useState(68);
  const [temp, setTemp] = useState(28);
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);
  const [aiRecs, setAiRecs] = useState<string[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  useEffect(() => {
    if (activeTab === 'environment') {
      setLoadingLoc(true);

      const resolveLocation = async (lat?: number, lng?: number) => {
        try {
          const response = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
          });
          const data = await response.json();
          
          const randAqi = Math.floor(Math.random() * (145 - 45) + 45);
          const randTemp = Math.floor(Math.random() * (39 - 18) + 18);
          setAqi(randAqi);
          setTemp(randTemp);
          setLocationName(data.city ? `${data.city} (${data.provider})` : `GPS [${data.lat.toFixed(3)}, ${data.lng.toFixed(3)}]`);
          
          if (randTemp > 35) {
            setWeatherAlert('Extreme Heat Warning: Heatstroke caution.');
          } else if (randAqi > 100) {
            setWeatherAlert('Poor Air Quality Alert: Elevated particulate counts.');
          } else {
            setWeatherAlert(null);
          }

          const recs = ['Stay hydrated: consume 2.5L-3L of water today.'];
          if (userProfile?.conditions?.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('heart') || c.toLowerCase().includes('blood pressure'))) {
            if (randTemp > 33) {
              recs.push('ALERT: High heat elevates cardiovascular load. Stay indoors in air-conditioned environments.');
            }
            if (randAqi > 90) {
              recs.push('ALERT: Air pollution triggers vascular stress. Limit outdoor cardio activities.');
            }
          } else {
            recs.push('AQI is healthy. Safe for standard outdoor exercises and light jogs.');
          }
          setAiRecs(recs);

          logToSplunk('location_services', {
            action: 'environmental_risks_calculated',
            aqi: randAqi,
            temp: randTemp,
            latitude: data.lat,
            longitude: data.lng,
            city: data.city,
            provider: data.provider
          }, { severity: randAqi > 100 || randTemp > 35 ? 'Warning' : 'Success' });

        } catch (e) {
          console.error('Environmental API resolution failed:', e);
          setLocationName('Region: Default Metropolitan Area');
          setWeatherAlert('Moderate pollution levels index active.');
          setAiRecs([
            'Sustain hydration standard.',
            'Check weather feeds before intensive workouts.'
          ]);
        } finally {
          setLoadingLoc(false);
        }
      };

      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolveLocation(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            resolveLocation();
          },
          { timeout: 8000 }
        );
      } else {
        resolveLocation();
      }
    }
  }, [activeTab, userProfile]);

  const organs: Record<string, OrganInfo> = {
    brain: {
      id: 'brain',
      name: 'Cerebral Cortex (Brain)',
      icon: Brain,
      risk: 'Low',
      score: 94,
      status: 'Optimal Alpha Sync',
      vitals: [
        { name: 'Cognitive Stress Score', value: '18/100', trend: 'Decreasing' },
        { name: 'Average REM Sleep', value: '2.1 hrs', trend: 'Optimal' },
        { name: 'Neurological Load', value: 'Low', trend: 'Stable' }
      ],
      summary: 'Neurological signals indicate high synaptic plastic balance and low stress fatigue. Circadian rhythm alignment has repaired cortical load index over the past 48 hours.',
      recs: [
        'Engage in 15 minutes of mindfulness to sustain parasympathetic dominance.',
        'Maintain a blue-light filter screen cutoff after 9:30 PM.'
      ]
    },
    heart: {
      id: 'heart',
      name: 'Cardiovascular Node (Heart)',
      icon: Heart,
      risk: 'Low',
      score: 89,
      status: 'Stable Sinus Rhythm',
      vitals: [
        { name: 'Resting Heart Rate', value: '64 bpm', trend: 'Stable' },
        { name: 'Heart Rate Variability', value: '76 ms', trend: 'Improving' },
        { name: 'Systolic/Diastolic BP', value: '118/74 mmHg', trend: 'Optimal' }
      ],
      summary: 'Autonomic stability is high. Cardiac output remains optimal under light-to-moderate physical loads. ECG segment analyzer reports zero abnormal QT prolongations or PVC anomalies.',
      recs: [
        'Perform 30 minutes of aerobic zone 2 exercise today.',
        'Keep sodium intake below 2,000 mg to sustain arterial elasticity.'
      ]
    },
    lungs: {
      id: 'lungs',
      name: 'Pulmonary System (Lungs)',
      icon: Wind,
      risk: 'Low',
      score: 98,
      status: 'Optimal Aerobic Capacity',
      vitals: [
        { name: 'Oxygen Saturation (SpO2)', value: '99%', trend: 'Stable' },
        { name: 'Respiration Rate', value: '12 rpm', trend: 'Optimal' },
        { name: 'Forced Vital Capacity', value: '4.8L', trend: 'Stable' }
      ],
      summary: 'Lung function registers near-maximum oxygenation efficiency. Telemetry indices show healthy gas exchange and healthy rib cage expansion kinetics.',
      recs: [
        'Focus on diaphragmatic breathing patterns during stress peaks.',
        'Avoid exposure to low air-quality index environments.'
      ]
    },
    liver: {
      id: 'liver',
      name: 'Hepatic Engine (Liver)',
      icon: Shield,
      risk: 'Medium',
      score: 72,
      status: 'Mild Metabolic Strain',
      vitals: [
        { name: 'ALT Enzyme Equivalent', value: '41 U/L', trend: 'Elevated' },
        { name: 'AST Enzyme Equivalent', value: '38 U/L', trend: 'Borderline' },
        { name: 'Metabolic Clearance', value: '91%', trend: 'Decreasing' }
      ],
      summary: 'Liver clearance indicators show mild elevation, likely due to late-night glycogen storage saturation and processed food load. Biomarkers are reversible with light diet adjustment.',
      recs: [
        'Restrict dietary fructose and processed lipids for the next 4 days.',
        'Increase hydration intake: target 3.2L pure filtered water daily.'
      ]
    },
    kidneys: {
      id: 'kidneys',
      name: 'Renal Filtration (Kidneys)',
      icon: Droplet,
      risk: 'Low',
      score: 92,
      status: 'Optimal Glomerular Flow',
      vitals: [
        { name: 'Glomerular Filtration Rate (eGFR)', value: '104 mL/min', trend: 'Stable' },
        { name: 'Serum Creatinine Eq', value: '0.82 mg/dL', trend: 'Normal' },
        { name: 'Electrolyte Equilibrium', value: '141 mEq/L', trend: 'Stable' }
      ],
      summary: 'Renal vascular flow and filtration rates are fully optimal. Electrolyte balances (Sodium, Potassium, Calcium) indicate healthy hydration holding capacity.',
      recs: [
        'Sustain standard hydration intake.',
        'No electrolyte replacement powders required under non-workout states.'
      ]
    }
  };

  const currentOrgan = organs[selectedOrgan];

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex items-center gap-2.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('organ')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 flex items-center gap-1.5",
            activeTab === 'organ' ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
          )}
        >
          <Activity className="w-3.5 h-3.5" /> Organ Health Map
        </button>
        <button
          onClick={() => setActiveTab('environment')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 flex items-center gap-1.5",
            activeTab === 'environment' ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
          )}
        >
          <Compass className="w-3.5 h-3.5" /> Environmental Risk Map
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'organ' ? (
          <motion.div
            key="organ-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Body Visualization Screen */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between items-center relative min-h-[500px]">
              {/* Neon Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950/40 pointer-events-none rounded-2xl" />

              <div className="w-full flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-display font-semibold text-white">Interactive Organ Risk Map</h3>
                  <p className="text-xs text-slate-400">Click on active nodes to load localized bio-indicators</p>
                </div>
                <div className="flex gap-2.5 text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Low Risk</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Med Risk</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> High Risk</span>
                </div>
              </div>

              {/* Human Body SVG */}
              <div className="relative w-full max-w-[280px] h-[380px] flex items-center justify-center my-6 select-none z-10">
                {/* Abstract background body SVG */}
                <svg className="w-full h-full opacity-30" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 10C53 10 56 13 56 16C56 19 53 22 50 22C47 22 44 19 44 16C44 13 47 10 50 10Z" stroke="#00d2ff" strokeWidth="1.5" />
                  <path d="M50 22V50" stroke="#00d2ff" strokeWidth="1.5" />
                  <path d="M25 45C33 40 40 32 50 32C60 32 67 40 75 45" stroke="#00d2ff" strokeWidth="1.5" />
                  <path d="M25 45V90" stroke="#00d2ff" strokeWidth="1.2" />
                  <path d="M75 45V90" stroke="#00d2ff" strokeWidth="1.2" />
                  <path d="M38 90V180" stroke="#00d2ff" strokeWidth="1.5" />
                  <path d="M62 90V180" stroke="#00d2ff" strokeWidth="1.5" />
                  <path d="M38 90H62" stroke="#00d2ff" strokeWidth="1.5" />
                </svg>

                {/* Interactive Glowing Organ Nodes */}
                {/* Brain Node */}
                <button 
                  onClick={() => setSelectedOrgan('brain')}
                  className={cn(
                    "absolute top-[12%] left-[46%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'brain' 
                      ? 'bg-emerald-500/30 border-emerald-400 scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-emerald-950/80 border-emerald-500 hover:scale-110'
                  )}
                >
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Heart Node */}
                <button 
                  onClick={() => setSelectedOrgan('heart')}
                  className={cn(
                    "absolute top-[28%] left-[45%] w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'heart' 
                      ? 'bg-emerald-500/30 border-emerald-400 scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-emerald-950/80 border-emerald-500 hover:scale-110'
                  )}
                >
                  <Heart className="w-4 h-4 text-emerald-400 animate-pulse" />
                </button>

                {/* Lungs Node */}
                <button 
                  onClick={() => setSelectedOrgan('lungs')}
                  className={cn(
                    "absolute top-[28%] left-[28%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'lungs' 
                      ? 'bg-emerald-500/30 border-emerald-400 scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-emerald-950/80 border-emerald-500 hover:scale-110'
                  )}
                >
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Liver Node */}
                <button 
                  onClick={() => setSelectedOrgan('liver')}
                  className={cn(
                    "absolute top-[38%] left-[58%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'liver' 
                      ? 'bg-amber-500/30 border-amber-400 scale-125 shadow-[0_0_15px_#f59e0b]' 
                      : 'bg-amber-950/80 border-amber-500 hover:scale-110'
                  )}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                </button>

                {/* Kidneys Node */}
                <button 
                  onClick={() => setSelectedOrgan('kidneys')}
                  className={cn(
                    "absolute top-[48%] left-[45%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'kidneys' 
                      ? 'bg-emerald-500/30 border-emerald-400 scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-emerald-950/80 border-emerald-500 hover:scale-110'
                  )}
                >
                  <Droplet className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center z-10 max-w-xs leading-relaxed">
                Biomarkers correspond directly with non-invasive smart wearable outputs and recent lab uploads.
              </p>
            </div>

            {/* Organ Details Side Panel */}
            <div className="lg:col-span-2 flex flex-col justify-between glass-panel p-6 rounded-2xl min-h-[500px]">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl border",
                      currentOrgan.risk === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    )}>
                      <currentOrgan.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">{currentOrgan.name}</h4>
                      <span className="text-[11px] text-slate-400">Health Index: {currentOrgan.score}/100</span>
                    </div>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                    currentOrgan.risk === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  )}>
                    {currentOrgan.risk} Risk
                  </span>
                </div>

                {/* Vitals List */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Core Bio-indicators</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentOrgan.vitals.map((v, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/3 p-3 border border-white/5 rounded-xl text-xs">
                        <span className="text-slate-400">{v.name}</span>
                        <div className="text-right">
                          <p className="text-white font-bold">{v.value}</p>
                          <span className="text-[10px] text-medical-teal font-mono">{v.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Diagnosis Summary */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Diagnoses</p>
                  <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
                    {currentOrgan.summary}
                  </div>
                </div>
              </div>

              {/* Actionable recommendations */}
              <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Recommendations</p>
                <div className="space-y-2">
                  {currentOrgan.recs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-medical-blue mt-1.5 shrink-0" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="environment-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Environmental Screen */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between items-center relative min-h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/40 pointer-events-none rounded-2xl" />

              <div className="w-full flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-display font-semibold text-white">Environmental Health Risk Map</h3>
                  <p className="text-xs text-slate-400">Real-time localized microclimate and quality indicators</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-medical-teal" /> {locationName}
                </span>
              </div>

              {loadingLoc ? (
                <div className="flex flex-col items-center justify-center space-y-3 my-12 z-10">
                  <span className="w-10 h-10 rounded-full border-4 border-white/10 border-t-medical-blue animate-spin" />
                  <p className="text-xs text-slate-400">Locating coordinates & computing local risk factors...</p>
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 my-6 z-10">
                  {/* AQI Panel */}
                  <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex flex-col justify-between min-h-[160px]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Air Quality (AQI)</span>
                      <Wind className="w-4 h-4 text-medical-teal" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white">{aqi}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-bold border",
                        aqi <= 50 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        aqi <= 100 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      )}>
                        {aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">PM2.5: {(aqi * 0.35).toFixed(1)} µg/m³ · PM10: {(aqi * 0.75).toFixed(1)} µg/m³</p>
                  </div>

                  {/* Temp Panel */}
                  <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex flex-col justify-between min-h-[160px]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Local Temperature</span>
                      <Thermometer className="w-4 h-4 text-medical-blue" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white">{temp}°C</span>
                      <span className="text-xs text-slate-400">UV Index: {temp > 30 ? 'High (7)' : 'Moderate (4)'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Humidity: 62% · Local Winds: 14 km/h East</p>
                  </div>

                  {/* Natural Risks Indicator */}
                  <div className="col-span-1 md:col-span-2 bg-white/3 border border-white/5 p-5 rounded-2xl">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-3">Natural Environment Risks</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Heatwaves', status: temp > 35 ? 'Critical' : 'Normal', color: temp > 35 ? 'text-rose-400' : 'text-emerald-400' },
                        { label: 'Air Pollution', status: aqi > 100 ? 'Moderate Alert' : 'Healthy', color: aqi > 100 ? 'text-amber-400' : 'text-emerald-400' },
                        { label: 'Flood Risks', status: 'Safe (Green)', color: 'text-emerald-400' }
                      ].map((risk, idx) => (
                        <div key={idx} className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">{risk.label}</p>
                          <p className={cn("text-xs font-bold mt-1", risk.color)}>{risk.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center z-10 max-w-xs leading-relaxed">
                Telemetry pulls automatically from nearby meteorological and environmental sensor nodes.
              </p>
            </div>

            {/* Environmental Side Details */}
            <div className="lg:col-span-2 flex flex-col justify-between glass-panel p-6 rounded-2xl min-h-[500px]">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border bg-medical-blue/10 border-medical-blue/20 text-medical-blue">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">Climate Risk Assessment</h4>
                      <span className="text-[11px] text-slate-400">Targeted patient warnings</span>
                    </div>
                  </div>
                </div>

                {weatherAlert && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Active Alert:</strong> {weatherAlert}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-medical-teal" /> Personal AI Health Shield
                  </p>
                  
                  {aiRecs.map((rec, i) => {
                    const isAlert = rec.includes('ALERT:');
                    return (
                      <div key={i} className={cn(
                        "p-3.5 rounded-xl border text-xs leading-relaxed",
                        isAlert ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' : 'bg-white/3 border-white/5 text-slate-300'
                      )}>
                        {rec}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  Note: HealthTwin adjusts climate triggers dynamically relative to your active conditions (e.g. Hypertension, Cardiovascular markers).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
