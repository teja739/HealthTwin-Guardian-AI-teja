'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, Pill, 
  ArrowRight, Search, MapPin, Store, Building2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SafetyCenter() {
  const [activeTab, setActiveTab] = useState<'interactions' | 'availability'>('interactions');
  const [selectedDrug, setSelectedDrug] = useState<number>(0);
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [searchedPharmacies, setSearchedPharmacies] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const medications = [
    { name: 'Lisinopril', dose: '10mg', freq: 'Once daily', category: 'ACE Inhibitor', active: true },
    { name: 'Metoprolol', dose: '25mg', freq: 'Twice daily', category: 'Beta Blocker', active: true },
    { name: 'Atorvastatin', dose: '20mg', freq: 'Once daily', category: 'Statin', active: true },
    { name: 'Metformin', dose: '500mg', freq: 'Twice daily', category: 'Biguanide', active: true },
    { name: 'Aspirin', dose: '81mg', freq: 'Once daily', category: 'Antiplatelet', active: true },
    { name: 'Vitamin D3', dose: '2000 IU', freq: 'Once daily', category: 'Supplement', active: true },
  ];

  const interactions = [
    {
      drugs: ['Lisinopril', 'Metoprolol'],
      severity: 'Moderate',
      description: 'Both lower blood pressure. Monitor for hypotension symptoms (dizziness, fainting).',
      action: 'Monitor BP twice daily. Approved by physician for combo therapy.'
    },
    {
      drugs: ['Aspirin', 'Lisinopril'],
      severity: 'Mild',
      description: 'NSAIDs may slightly reduce the antihypertensive effect of ACE inhibitors.',
      action: 'Low-dose aspirin (81mg) has minimal impact. No dose adjustment needed.'
    },
    {
      drugs: ['Metformin', 'Atorvastatin'],
      severity: 'Low',
      description: 'No clinically significant pharmacokinetic interaction detected.',
      action: 'Safe combination. Continue as prescribed.'
    }
  ];

  const genericAlternatives: Record<string, string[]> = {
    lisinopril: ['Enalapril 10mg', 'Losartan 50mg', 'Ramipril 5mg'],
    metoprolol: ['Atenolol 50mg', 'Carvedilol 6.25mg', 'Propranolol 40mg'],
    atorvastatin: ['Rosuvastatin 10mg', 'Simvastatin 20mg', 'Pravastatin 40mg'],
    metformin: ['Glipizide 5mg', 'Glimepiride 2mg', 'Pioglitazone 15mg'],
    aspirin: ['Clopidogrel 75mg', 'Ibuprofen 200mg (consult physician)']
  };

  const handleMedsAvailabilitySearch = (drugName: string) => {
    setIsSearching(true);
    setAvailabilitySearch(drugName);
    
    setTimeout(() => {
      const name = drugName.toLowerCase();
      // Generate randomized stock results
      const results = [
        { name: 'Apollo Pharmacy', distance: '0.8 km', stock: name.includes('atorvastatin') ? 'Out of Stock' : 'In Stock', phone: '+91 80 2210 1120' },
        { name: 'MedPlus Wellness', distance: '1.4 km', stock: name.includes('lisinopril') ? 'Low Stock' : 'In Stock', phone: '+91 80 2341 5567' },
        { name: 'CVS Care Pharmacy', distance: '2.5 km', stock: name.includes('metoprolol') ? 'Out of Stock' : name.includes('lisinopril') ? 'Out of Stock' : 'In Stock', phone: '+1 (555) 0122' },
        { name: 'Walgreens Pharmacy', distance: '3.1 km', stock: 'In Stock', phone: '+1 (555) 0199' }
      ];

      setSearchedPharmacies(results);
      
      const matchedKey = Object.keys(genericAlternatives).find(k => name.includes(k));
      if (matchedKey) {
        setAlternatives(genericAlternatives[matchedKey]);
      } else {
        setAlternatives(['Generic alternative consultation recommended at pharmacy.']);
      }
      setIsSearching(false);
    }, 800);
  };

  const safetyScore = 87;

  return (
    <div className="space-y-6">
      
      {/* Safety Score Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-medical-teal/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-5 z-10">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#0df2c9" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${safetyScore * 2.64} 264`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-display font-extrabold text-white">{safetyScore}</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Medication Safety Score</h2>
            <p className="text-xs text-slate-400 mt-0.5">Overall drug regimen safety based on interactions, duplicates, and contraindications</p>
          </div>
        </div>
        
        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 z-10">
          <button
            onClick={() => setActiveTab('interactions')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition",
              activeTab === 'interactions' ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
            )}
          >
            Interactions
          </button>
          <button
            onClick={() => {
              setActiveTab('availability');
              handleMedsAvailabilitySearch(medications[selectedDrug].name);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition",
              activeTab === 'availability' ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
            )}
          >
            Availability Finder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Medications List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Active Medications ({medications.length})</h3>
          <div className="space-y-2.5">
            {medications.map((med, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDrug(idx);
                  if (activeTab === 'availability') {
                    handleMedsAvailabilitySearch(med.name);
                  }
                }}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border flex items-center justify-between text-xs transition duration-200",
                  selectedDrug === idx ? 'border-medical-blue bg-white/5' : 'border-white/5 hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-medical-blue">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{med.name} {med.dose}</h4>
                    <span className="text-[10px] text-slate-500">{med.category} · {med.freq}</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Tab Content Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* Interactions Analysis Tab */}
            {activeTab === 'interactions' && (
              <motion.div
                key="interactions-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-6 rounded-2xl space-y-5"
              >
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Interaction Analysis</h3>
                
                <div className="space-y-3">
                  {interactions.map((inter, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border space-y-2.5",
                      inter.severity === 'Moderate' ? 'bg-amber-500/5 border-amber-500/15' :
                      inter.severity === 'Mild' ? 'bg-sky-500/5 border-sky-500/15' :
                      'bg-emerald-500/5 border-emerald-500/15'
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-white">{inter.drugs[0]}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-white">{inter.drugs[1]}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                          inter.severity === 'Moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          inter.severity === 'Mild' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        )}>
                          {inter.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{inter.description}</p>
                      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-white/3 p-2.5 rounded-lg border border-white/5">
                        <Shield className="w-3.5 h-3.5 text-medical-teal shrink-0 mt-0.5" />
                        <span><strong className="text-slate-200">Action:</strong> {inter.action}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Safety Summary</p>
                  <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
                    Your current 6-medication regimen is well-optimized. No duplicate active ingredients detected. Two known interactions exist, both pre-approved by your prescribing physician. Continue monitoring blood pressure for Lisinopril + Metoprolol combination therapy.
                  </div>
                </div>
              </motion.div>
            )}

            {/* Availability Finder Tab */}
            {activeTab === 'availability' && (
              <motion.div
                key="availability-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-6 rounded-2xl space-y-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Store className="w-4 h-4 text-medical-teal" /> Nearby Medicine stock Finder
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={availabilitySearch}
                      onChange={(e) => setAvailabilitySearch(e.target.value)}
                      placeholder="Search other medicine..."
                      className="glass-input px-3 py-1.5 text-xs w-40"
                    />
                    <button 
                      onClick={() => handleMedsAvailabilitySearch(availabilitySearch)}
                      className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-medical-teal animate-spin" />
                    Checking local pharmacy stock databases...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pharmacy stock list */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-medical-blue" /> Stock status for: <span className="text-white font-sans font-bold normal-case">{availabilitySearch}</span>
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {searchedPharmacies.map((p, idx) => (
                          <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl flex flex-col justify-between gap-2 text-xs">
                            <div>
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-white flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {p.name}
                                </h4>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                  p.stock === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  p.stock === 'Low Stock' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                )}>
                                  {p.stock}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Distance: {p.distance}</p>
                            </div>
                            <a 
                              href={`tel:${p.phone}`} 
                              className="text-[10px] text-medical-blue font-bold hover:underline"
                            >
                              Call Pharmacy: {p.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Generic Alternatives */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Recommended Alternatives</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        If {availabilitySearch} is low in stock or unavailable, consider these therapeutic equivalents:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {alternatives.map((alt, i) => (
                          <span key={i} className="px-3 py-1.5 bg-medical-blue/10 border border-medical-blue/20 text-medical-blue rounded-lg text-xs font-semibold">
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic bg-amber-500/5 p-3 border border-amber-500/10 rounded-xl leading-relaxed mt-4">
                      ⚠️ <strong>Pharmacist Disclaimer:</strong> Therapeutic substitution must be verified and authorized by a registered pharmacist or doctor. Do not adjust prescription doses independently.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
