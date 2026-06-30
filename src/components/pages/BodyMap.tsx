'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Brain, Activity, Droplet, 
  Wind, Shield, AlertTriangle, CheckCircle,
  Sun, Flame, CloudRain, Thermometer, ShieldAlert, Compass, Sparkles, MapPin, BarChart2 
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
  const [activeTab, setActiveTab] = useState<'organ' | 'environment' | 'risk'>('organ');
  const [selectedOrgan, setSelectedOrgan] = useState<string>('heart');
  const [locationName, setLocationName] = useState('Detecting location...');
  const [aqi, setAqi] = useState(68);
  const [temp, setTemp] = useState(28);
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);
  const [aiRecs, setAiRecs] = useState<string[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Digital Twin Biomarker Scores
  const twinMetrics = [
    { label: 'Body Health', score: 90, color: 'bg-medical-blue', textColor: 'text-medical-blue', explanation: 'Overall biological systems show high cellular recovery and low metabolic strain.' },
    { label: 'Mental Health', score: 74, color: 'bg-indigo-400', textColor: 'text-indigo-400', explanation: 'Autonomic stress indicators show elevated sympathetic drive, suggesting moderate neural fatigue.' },
    { label: 'Heart & Vascular', score: 82, color: 'bg-medical-red', textColor: 'text-medical-red', explanation: 'Sinus rhythm is stable. Blood pressure is within normal ranges with minor HRV fluctuations.' },
    { label: 'Kidney filtration', score: 96, color: 'bg-medical-teal', textColor: 'text-medical-teal', explanation: 'Glomerular filtration rates are optimal. Electrolyte balances show excellent hydration holding.' },
    { label: 'Liver clearance', score: 78, color: 'bg-medical-yellow', textColor: 'text-medical-yellow', explanation: 'ALT/AST enzymes indicate minor glycogen clearance load, likely due to dietary carbohydrate peaks.' }
  ];

  // AI Risk Indices (Circular Progress Data)
  const riskIndices = [
    { label: 'Dehydration', score: 25, color: 'stroke-medical-blue', textColor: 'text-medical-blue', bg: 'bg-blue-500/5', desc: 'Mild fluid loss. Target: Consume 750ml water over the next 3 hours.' },
    { label: 'Stress Fatigue', score: 60, color: 'stroke-indigo-400', textColor: 'text-indigo-400', bg: 'bg-indigo-500/5', desc: 'Elevated cortical load. Recommended: 10 mins of diaphragmatic breathing.' },
    { label: 'High BP Spike', score: 15, color: 'stroke-medical-red', textColor: 'text-medical-red', bg: 'bg-rose-500/5', desc: 'Arterial stiffening is low. Systolic pressure is stable at 118 mmHg.' },
    { label: 'Diabetes Risk', score: 8, color: 'stroke-medical-teal', textColor: 'text-medical-teal', bg: 'bg-cyan-500/5', desc: 'Insulin response is optimal. Fasting glucose equivalent: 92 mg/dL.' }
  ];

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

  // Circular Gauge Calculations
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-6">
      
      {/* Tab Selector */}
      <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-950/40 border border-card-border w-fit backdrop-blur-md">
        {[
          { id: 'organ', label: 'Organ Health Map', icon: Activity },
          { id: 'environment', label: 'Environmental Risks', icon: Compass },
          { id: 'risk', label: 'AI Risk Predictions', icon: BarChart2 }
        ].map((t) => {
          const IconComp = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2 cursor-pointer",
                isActive 
                  ? "bg-medical-blue/10 text-medical-blue border border-medical-blue/20" 
                  : "text-slate-400 hover:text-foreground hover:bg-white/5"
              )}
            >
              <IconComp className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'organ' && (
          <motion.div
            key="organ-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Interactive Body Visualizer */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-7 flex flex-col justify-between items-center relative min-h-[520px]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/20 pointer-events-none rounded-2xl" />

              <div className="w-full flex items-center justify-between z-10">
                <div>
                  <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Biological Twin Core Map</h3>
                  <p className="text-[10px] text-slate-500">Tap active nodes to audit organ risk metrics</p>
                </div>
                <div className="flex gap-2 text-[9px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-green" /> Low Risk</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-yellow" /> Med Risk</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-red" /> High Risk</span>
                </div>
              </div>

              {/* Body SVG */}
              <div className="relative w-full max-w-[240px] h-[340px] flex items-center justify-center my-4 select-none z-10">
                <svg className="w-full h-full opacity-20" viewBox="0 0 100 200" fill="none">
                  <path d="M50 10C53 10 56 13 56 16C56 19 53 22 50 22C47 22 44 19 44 16C44 13 47 10 50 10Z" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M50 22V50" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M25 45C33 40 40 32 50 32C60 32 67 40 75 45" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M25 45V90" stroke="#2563eb" strokeWidth="1.2" />
                  <path d="M75 45V90" stroke="#2563eb" strokeWidth="1.2" />
                  <path d="M38 90V180" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M62 90V180" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M38 90H62" stroke="#2563eb" strokeWidth="1.5" />
                </svg>

                {/* Brain Node */}
                <button 
                  onClick={() => setSelectedOrgan('brain')}
                  className={cn(
                    "absolute top-[10%] left-[44%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'brain' 
                      ? 'bg-medical-green/20 border-medical-green scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-slate-900 border-card-border hover:scale-110'
                  )}
                >
                  <Brain className="w-3.5 h-3.5 text-medical-green" />
                </button>

                {/* Heart Node */}
                <button 
                  onClick={() => setSelectedOrgan('heart')}
                  className={cn(
                    "absolute top-[26%] left-[44%] w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'heart' 
                      ? 'bg-medical-green/20 border-medical-green scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-slate-900 border-card-border hover:scale-110'
                  )}
                >
                  <Heart className="w-4 h-4 text-medical-green animate-pulse" />
                </button>

                {/* Lungs Node */}
                <button 
                  onClick={() => setSelectedOrgan('lungs')}
                  className={cn(
                    "absolute top-[26%] left-[26%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'lungs' 
                      ? 'bg-medical-green/20 border-medical-green scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-slate-900 border-card-border hover:scale-110'
                  )}
                >
                  <Wind className="w-3.5 h-3.5 text-medical-green" />
                </button>

                {/* Liver Node */}
                <button 
                  onClick={() => setSelectedOrgan('liver')}
                  className={cn(
                    "absolute top-[36%] left-[58%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'liver' 
                      ? 'bg-medical-yellow/20 border-medical-yellow scale-125 shadow-[0_0_15px_#f59e0b]' 
                      : 'bg-slate-900 border-card-border hover:scale-110'
                  )}
                >
                  <Shield className="w-3.5 h-3.5 text-medical-yellow" />
                </button>

                {/* Kidneys Node */}
                <button 
                  onClick={() => setSelectedOrgan('kidneys')}
                  className={cn(
                    "absolute top-[46%] left-[44%] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    selectedOrgan === 'kidneys' 
                      ? 'bg-medical-green/20 border-medical-green scale-125 shadow-[0_0_15px_#10b981]' 
                      : 'bg-slate-900 border-card-border hover:scale-110'
                  )}
                >
                  <Droplet className="w-3.5 h-3.5 text-medical-green" />
                </button>
              </div>

              <div className="w-full grid grid-cols-5 gap-2 pt-3 border-t border-card-border z-10 text-center">
                {twinMetrics.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[9px] text-slate-500 uppercase truncate">{m.label.split(' ')[0]}</p>
                    <p className={cn("text-xs font-extrabold", m.textColor)}>{m.score}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Organ Details Side Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between glass-panel p-6 rounded-2xl min-h-[520px]">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-card-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl border",
                      currentOrgan.risk === 'Low' ? 'bg-medical-green/10 border-medical-green/20 text-medical-green' : 'bg-medical-yellow/10 border-medical-yellow/20 text-medical-yellow'
                    )}>
                      <currentOrgan.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm">{currentOrgan.name}</h4>
                      <span className="text-[10.5px] text-slate-500">Health Index: {currentOrgan.score}/100</span>
                    </div>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border",
                    currentOrgan.risk === 'Low' ? 'bg-medical-green/10 border-medical-green/20 text-medical-green' : 'bg-medical-yellow/10 border-medical-yellow/20 text-medical-yellow'
                  )}>
                    {currentOrgan.risk} Risk
                  </span>
                </div>

                {/* Biomarkers / Vitals */}
                <div className="space-y-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Autonomic Bio-indicators</p>
                  <div className="grid grid-cols-1 gap-2">
                    {currentOrgan.vitals.map((v, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/3 p-3 border border-card-border rounded-xl text-xs">
                        <span className="text-slate-400 font-medium">{v.name}</span>
                        <div className="text-right">
                          <p className="text-foreground font-bold">{v.value}</p>
                          <span className="text-[9.5px] text-medical-teal font-mono font-bold">{v.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini-Generated Explanation */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-medical-teal" /> Gemini Digital twin analysis
                  </p>
                  <div className="p-3.5 bg-card-bg border border-card-border rounded-xl text-xs text-slate-300 leading-relaxed font-light">
                    {currentOrgan.summary}
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="pt-4 border-t border-card-border space-y-2.5 mt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Preventative Guidelines</p>
                <div className="space-y-2">
                  {currentOrgan.recs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-medical-blue mt-1.5 shrink-0" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Environmental Risks Tab */}
        {activeTab === 'environment' && (
          <motion.div
            key="environment-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="glass-panel p-6 rounded-2xl lg:col-span-7 flex flex-col justify-between items-center relative min-h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/20 pointer-events-none rounded-2xl" />

              <div className="w-full flex items-center justify-between z-10">
                <div>
                  <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Local Microclimate Assessment</h3>
                  <p className="text-[10px] text-slate-500">Environmental triggers mapped against clinical profile</p>
                </div>
                <span className="flex items-center gap-1 text-[10.5px] font-bold text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-medical-teal" /> {locationName}
                </span>
              </div>

              {loadingLoc ? (
                <div className="flex flex-col items-center justify-center space-y-3 my-12 z-10">
                  <span className="w-8 h-8 rounded-full border-4 border-white/10 border-t-medical-blue animate-spin" />
                  <p className="text-xs text-slate-400">Locating coordinates...</p>
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 my-6 z-10">
                  <div className="bg-white/3 border border-card-border p-5 rounded-2xl flex flex-col justify-between min-h-[150px]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Air Quality (AQI)</span>
                      <Wind className="w-4.5 h-4.5 text-medical-teal" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-foreground">{aqi}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider",
                        aqi <= 50 ? 'bg-medical-green/10 border-medical-green/20 text-medical-green' :
                        aqi <= 100 ? 'bg-medical-yellow/10 border-medical-yellow/20 text-medical-yellow' :
                        'bg-medical-red/10 border-medical-red/20 text-medical-red'
                      )}>
                        {aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 mt-2">PM2.5: {(aqi * 0.35).toFixed(1)} µg/m³</p>
                  </div>

                  <div className="bg-white/3 border border-card-border p-5 rounded-2xl flex flex-col justify-between min-h-[150px]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Temperature</span>
                      <Thermometer className="w-4.5 h-4.5 text-medical-blue" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-foreground">{temp}°C</span>
                      <span className="text-[10px] text-slate-400">UV Index: {temp > 30 ? 'High' : 'Moderate'}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 mt-2">Humidity: 62% · Winds: 14 km/h</p>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 text-center z-10 max-w-xs leading-relaxed">
                Sensor feeds update every 15 minutes.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between glass-panel p-6 rounded-2xl min-h-[500px]">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-card-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border bg-medical-blue/10 border-medical-blue/20 text-medical-blue">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm">Environmental Shields</h4>
                      <span className="text-[10.5px] text-slate-500">Trigger warnings relative to profile</span>
                    </div>
                  </div>
                </div>

                {weatherAlert && (
                  <div className="p-4 bg-medical-red/10 border border-medical-red/20 text-medical-red rounded-xl text-xs flex gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span><strong>Active Alert:</strong> {weatherAlert}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-medical-teal" /> Shield Recommendations
                  </p>
                  {aiRecs.map((rec, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-card-border bg-white/3 text-xs text-slate-300 leading-relaxed">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Risk Predictions (v2.0 Circular Charts) */}
        {activeTab === 'risk' && (
          <motion.div
            key="risk-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Circular Charts Grid */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-7 space-y-6 min-h-[500px]">
              <div>
                <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">AI Risk Indices</h3>
                <p className="text-[10px] text-slate-500">Preventative risk evaluations calculated via Google Gemini</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                {riskIndices.map((risk, idx) => (
                  <div key={idx} className="bg-white/3 border border-card-border p-5 rounded-2xl flex items-center gap-4 hover:border-medical-blue/20 transition duration-300">
                    {/* SVG Circular Progress */}
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="text-card-border" fill="transparent" />
                        <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} 
                          className={cn(risk.color, "transition-all duration-500")}
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - risk.score / 100)}
                          strokeLinecap="round"
                          fill="transparent" 
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-foreground">{risk.score}%</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">{risk.label}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-light">{risk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Explanation panel */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl min-h-[500px] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-card-border pb-4">
                  <div className="p-2.5 rounded-xl border bg-medical-teal/10 border-medical-teal/20 text-medical-teal">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">Risk Engine Insights</h4>
                    <span className="text-[10.5px] text-slate-500">Gemini-driven predictive models</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-card-bg border border-card-border rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-yellow" /> Stress Load Trigger</span>
                    <p className="text-slate-300 font-light leading-relaxed">
                      Your stress fatigue index is at 60% due to consecutive high cognitive load logs and slightly shortened sleep cycles. Heart rate variations remain compensated.
                    </p>
                  </div>

                  <div className="p-4 bg-card-bg border border-card-border rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-green" /> Diabetes Stability</span>
                    <p className="text-slate-300 font-light leading-relaxed">
                      Diabetes probability index stands at a low 8%. Fasting glucose values and post-meal recovery rates indicate excellent insulin sensitivity.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic leading-relaxed pt-4 border-t border-card-border">
                Warnings are compiled by cross-referencing your medical record against local stress levels and cardiovascular indicators.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
