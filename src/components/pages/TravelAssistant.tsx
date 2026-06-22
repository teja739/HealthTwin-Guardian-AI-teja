'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, MapPin, Sun, ShieldCheck, 
  AlertTriangle, Phone, Search, Loader2, 
  Activity, Sparkles, Navigation, Compass 
} from 'lucide-react';

interface TravelReport {
  destination: string;
  climate: string;
  aqiAdvice: string;
  vaccines: string[];
  precautions: string[];
  hospitals: Array<{
    name: string;
    address: string;
    phone: string;
  }>;
  customTips: string[];
}

interface TravelAssistantProps {
  userProfile?: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    onboardingComplete: boolean;
  };
}

export default function TravelAssistant({ userProfile }: TravelAssistantProps) {
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TravelReport | null>(null);

  const presets = ['Tokyo, Japan', 'London, UK', 'New York, USA', 'Bangalore, India', 'Cairo, Egypt'];

  const handleSearch = async (targetDest?: string) => {
    const dest = targetDest || destination;
    if (!dest.trim() || loading) return;
    
    setLoading(true);
    setReport(null);
    setDestination(dest);

    try {
      const response = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: dest, userProfile })
      });

      if (!response.ok) throw new Error('Failed to fetch travel health advice');
      const data = await response.json();
      
      setReport(data);

      logToSplunk('travel_assistant', {
        action: 'travel_advisory_generated',
        destination: dest,
        vaccinesRecommended: data.vaccines.length,
        hasCustomTips: data.customTips.length > 0
      }, { severity: 'Success' });

    } catch (err) {
      console.error(err);
      // Fallback
      setReport({
        destination: dest,
        climate: 'Typical seasonal variation. Check active meteorological feeds before departure.',
        aqiAdvice: 'Ensure standard respiratory awareness. Keep necessary prescriptions packed.',
        vaccines: ['Hepatitis A & B', 'Typhoid (standard)'],
        precautions: ['Consume bottled water only.', 'Protect against local mosquito vectors.'],
        hospitals: [
          { name: 'Central Emergency Hospital', address: 'Downtown Medical Plaza', phone: '112 / 911' }
        ],
        customTips: ['Keep your active medications list handy during custom border clearance.']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-medical-blue/10 rounded-full blur-[80px] pointer-events-none" />
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-medical-blue" />
            Travel Health Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify your destination and receive localized health risks, climate considerations, mandatory vaccinations, and AI-tailored precautions.
          </p>
        </div>
        
        {/* Destination Search Form */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 z-10">
          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan"
              className="glass-input w-full sm:w-64 px-4 py-2.5 text-xs pr-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <button 
            onClick={() => handleSearch()}
            disabled={!destination.trim() || loading}
            className="px-5 py-2.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Analyze Travel
          </button>
        </div>
      </div>

      {/* Preset Suggestions */}
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-slate-500 font-medium mr-1">Popular:</span>
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => handleSearch(p)}
            className="px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Results Block */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="w-10 h-10 text-medical-blue animate-spin" />
              <Plane className="w-4 h-4 text-medical-teal absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">Consulting Travel Health Archives</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Checking climate indexes, vaccine advisories, and cross-referencing your Health Twin parameters...
              </p>
            </div>
          </motion.div>
        )}

        {!loading && !report && (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-slate-500">
              <Compass className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">No Travel History Active</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Type your vacation or business destination above or select a preset to generate a customized travel health passport.
              </p>
            </div>
          </motion.div>
        )}

        {!loading && report && (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Main Advisory Cards */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Climate and AQI Panel */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                  Destination Climate & Air Index
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-medical-blue">
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold text-slate-200">Local Weather & Climate</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">{report.climate}</p>
                  </div>
                  
                  <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-medical-teal">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-bold text-slate-200">Air Quality Advice</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">{report.aqiAdvice}</p>
                  </div>
                </div>
              </div>

              {/* Vaccines & Precautions */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                  Medical Requirements & Precautions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Recommended Immunizations */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-medical-teal" /> Recommended Vaccines
                    </h4>
                    <div className="space-y-2">
                      {report.vaccines.map((v: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-white/3 px-3 py-2 border border-white/5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-medical-teal" />
                          <span>{v}</span>
                        </div>
                      ))}
                      {report.vaccines.length === 0 && (
                        <p className="text-xs text-slate-500">No specific immunization protocols found.</p>
                      )}
                    </div>
                  </div>

                  {/* Traveler General Precautions */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Travel Safety Precautions
                    </h4>
                    <div className="space-y-2">
                      {report.precautions.map((p: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-white/3 px-3 py-2 border border-white/5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* AI Custom Tips & Medical Contacts Panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI Tailored Health Shield */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-medical-teal" /> AI Custom Health Shield
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Personal tips tailored specifically for your conditions ({userProfile?.conditions?.join(', ') || 'None reported'}):
                </p>
                <div className="space-y-2.5">
                  {report.customTips.map((tip: string, idx: number) => (
                    <div key={idx} className="p-3 bg-medical-blue/10 border border-medical-blue/20 rounded-xl text-xs text-medical-blue leading-relaxed font-mono">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Medical Resources Directory */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-rose-500/10">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-rose-500" /> Emergency Medical Facilities
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Key local clinics/hospitals indexed in emergency database:
                </p>
                <div className="space-y-3">
                  {report.hospitals.map((h: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-2 text-xs">
                      <div>
                        <h4 className="font-bold text-white">{h.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{h.address}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1.5">
                        <a 
                          href={`tel:${h.phone}`}
                          className="flex items-center gap-1 text-[10px] text-rose-400 font-bold"
                        >
                          <Phone className="w-3 h-3" /> Call: {h.phone}
                        </a>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-medical-blue font-bold"
                        >
                          <Navigation className="w-3 h-3" /> Directions
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
