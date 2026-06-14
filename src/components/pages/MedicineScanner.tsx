'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, Shield, AlertTriangle, CheckCircle, 
  Pill, Clock, Star, Upload, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MedicineScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMed, setScannedMed] = useState<any>(null);

  const sampleMeds = [
    {
      name: 'Lisinopril 10mg',
      generic: 'Lisinopril',
      category: 'ACE Inhibitor',
      purpose: 'Treats high blood pressure and heart failure by relaxing blood vessels.',
      dosage: '10mg once daily, morning',
      sideEffects: ['Dizziness', 'Dry cough', 'Hyperkalemia', 'Fatigue'],
      interactions: ['NSAIDs may reduce efficacy', 'Potassium supplements increase hyperkalemia risk'],
      prescriptionRequired: true,
      safetyScore: 92,
      manufacturer: 'Merck & Co.',
      form: 'Oral Tablet'
    },
    {
      name: 'Metformin 500mg',
      generic: 'Metformin Hydrochloride',
      category: 'Biguanide (Antidiabetic)',
      purpose: 'Controls blood sugar levels in type 2 diabetes by improving insulin sensitivity.',
      dosage: '500mg twice daily with meals',
      sideEffects: ['Nausea', 'Diarrhea', 'Abdominal discomfort', 'Lactic acidosis (rare)'],
      interactions: ['Contrast dye procedures require temporary discontinuation', 'Alcohol increases lactic acidosis risk'],
      prescriptionRequired: true,
      safetyScore: 88,
      manufacturer: 'Bristol-Myers Squibb',
      form: 'Oral Tablet'
    }
  ];

  const triggerScan = (idx: number) => {
    setIsScanning(true);
    setScannedMed(null);
    setTimeout(() => {
      setScannedMed(sampleMeds[idx]);
      setIsScanning(false);
    }, 2200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Scanner Input */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h3 className="text-lg font-display font-semibold text-white">Medicine Image Scanner</h3>
          <p className="text-xs text-slate-400 mt-1">Upload or capture a medicine image for instant AI identification</p>

          <div
            onClick={() => triggerScan(0)}
            className="mt-5 border-2 border-dashed border-white/10 bg-white/2 rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer hover:border-medical-blue/30 transition duration-300"
          >
            <Camera className="w-10 h-10 text-medical-blue mb-3" />
            <p className="text-xs font-semibold text-white">Tap to capture or upload image</p>
            <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, HEIC</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h4 className="text-sm font-display font-bold text-slate-300 uppercase tracking-wider">Quick Demo Scans</h4>
          {sampleMeds.map((med, idx) => (
            <button
              key={idx}
              onClick={() => triggerScan(idx)}
              disabled={isScanning}
              className="w-full text-left p-3.5 rounded-xl border border-white/5 flex items-center gap-3 text-xs transition duration-200 glass-panel-hover"
            >
              <div className="p-2 bg-medical-teal/10 border border-medical-teal/20 rounded-lg text-medical-teal">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{med.name}</h4>
                <span className="text-[10px] text-slate-500">{med.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      <div className="lg:col-span-3 min-h-[500px]">
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-medical-blue animate-spin" />
            <div>
              <h4 className="font-display font-bold text-white text-sm">Analyzing Medicine Image</h4>
              <p className="text-xs text-slate-400 mt-1">Running Google Vision OCR & AI drug database lookup...</p>
            </div>
          </motion.div>
        )}

        {!isScanning && !scannedMed && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-slate-500"><Camera className="w-8 h-8" /></div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">No Medicine Scanned</h4>
              <p className="text-xs text-slate-400 mt-1">Upload or select a demo medicine to begin</p>
            </div>
          </div>
        )}

        {!isScanning && scannedMed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 rounded-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">{scannedMed.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{scannedMed.generic} · {scannedMed.manufacturer}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className="text-2xl font-display font-extrabold text-medical-teal">{scannedMed.safetyScore}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Safety</div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Category', val: scannedMed.category },
                { label: 'Form', val: scannedMed.form },
                { label: 'Dosage', val: scannedMed.dosage.split(',')[0] },
                { label: 'Rx Required', val: scannedMed.prescriptionRequired ? 'Yes' : 'No' }
              ].map((item, i) => (
                <div key={i} className="bg-white/3 border border-white/5 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-mono">{item.label}</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Purpose</p>
              <p className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed">{scannedMed.purpose}</p>
            </div>

            {/* Side Effects */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Side Effects</p>
              <div className="flex flex-wrap gap-2">
                {scannedMed.sideEffects.map((se: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-semibold">{se}</span>
                ))}
              </div>
            </div>

            {/* Interactions */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Drug Interactions</p>
              {scannedMed.interactions.map((inter: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p>{inter}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
