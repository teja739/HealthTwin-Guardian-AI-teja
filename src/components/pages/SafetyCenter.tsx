'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Pill, ArrowRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SafetyCenter() {
  const [selectedDrug, setSelectedDrug] = useState<number>(0);

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
        <div className="flex items-center gap-3 z-10 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> No Duplicates
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> 2 Interactions
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Current Medications */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Active Medications ({medications.length})</h3>
          <div className="space-y-2.5">
            {medications.map((med, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDrug(idx)}
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

        {/* Drug Interactions Matrix */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl space-y-5">
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

          {/* Risk Warnings Summary */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Safety Summary</p>
            <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
              Your current 6-medication regimen is well-optimized. No duplicate active ingredients detected. Two known interactions exist, both pre-approved by your prescribing physician. Continue monitoring blood pressure for Lisinopril + Metoprolol combination therapy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
