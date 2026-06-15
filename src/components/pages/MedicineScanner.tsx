'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, Shield, AlertTriangle, CheckCircle, 
  Pill, Clock, Star, Upload, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface MedicineScannerProps {
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

export default function MedicineScanner({ userProfile }: MedicineScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMed, setScannedMed] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      form: 'Oral Tablet',
      profileConflicts: []
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
      form: 'Oral Tablet',
      profileConflicts: []
    }
  ];

  const triggerMockScan = (idx: number) => {
    setIsScanning(true);
    setScannedMed(null);
    setErrorMsg(null);
    setTimeout(() => {
      // Simulate checking conflicts based on current profile details
      const med = { ...sampleMeds[idx] };
      const conflicts: any[] = [];
      if (userProfile) {
        if (med.generic.toLowerCase() === 'lisinopril') {
          // If taking Metoprolol or other meds, check
          if (userProfile.medications.some(m => m.toLowerCase().includes('aspirin'))) {
            conflicts.push({
              severity: 'Medium',
              description: 'Aspirin may slightly decrease the blood pressure lowering effect of Lisinopril.'
            });
          }
        }
      }
      med.profileConflicts = conflicts as any;
      setScannedMed(med);
      setIsScanning(false);

      // Log mock scan to Splunk HEC
      const severity = conflicts.length > 0 ? (conflicts.some(c => c.severity === 'High') ? 'High' : 'Warning') : 'Success';
      logToSplunk('medicine_scan', {
        action: 'medicine_scanned',
        scanSource: 'demo_mock',
        medicineName: med.name,
        generic: med.generic,
        category: med.category,
        safetyScore: med.safetyScore,
        manufacturer: med.manufacturer,
        hasConflicts: conflicts.length > 0,
        conflictsCount: conflicts.length,
        conflictsDetails: conflicts
      }, { severity });
    }, 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScannedMed(null);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
            userProfile,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to scan medicine');
        }

        const data = await response.json();
        setScannedMed(data);
        setIsScanning(false);

        // Log live camera/upload scan to Splunk HEC
        const conflicts = data.profileConflicts || [];
        const severity = conflicts.length > 0 ? (conflicts.some((c: any) => c.severity === 'High') ? 'High' : 'Warning') : 'Success';
        logToSplunk('medicine_scan', {
          action: 'medicine_scanned',
          scanSource: 'camera_upload',
          medicineName: data.name,
          generic: data.generic,
          category: data.category,
          safetyScore: data.safetyScore,
          manufacturer: data.manufacturer,
          hasConflicts: conflicts.length > 0,
          conflictsCount: conflicts.length,
          conflictsDetails: conflicts
        }, { severity });
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };

      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while scanning the medicine package.');
      setIsScanning(false);

      // Log scan failure to Splunk HEC
      logToSplunk('medicine_scan', {
        action: 'medicine_scan_failed',
        scanSource: 'camera_upload',
        error: err.message || String(err)
      }, { severity: 'High' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Scanner Input */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h3 className="text-lg font-display font-semibold text-white">Medicine Image Scanner</h3>
          <p className="text-xs text-slate-400 mt-1">Upload or capture a medicine image for instant AI identification</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 border-2 border-dashed border-white/10 bg-white/2 rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer hover:border-medical-blue/30 transition duration-300"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <Camera className="w-10 h-10 text-medical-blue mb-3" />
            <p className="text-xs font-semibold text-white font-display">Tap to capture or upload image</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Supports JPG, PNG, HEIC</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h4 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest">Quick Demo Scans</h4>
          {sampleMeds.map((med, idx) => (
            <button
              key={idx}
              onClick={() => triggerMockScan(idx)}
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

        {errorMsg && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4 border-rose-500/25 bg-rose-950/5">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500"><AlertTriangle className="w-8 h-8" /></div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">Scan Failed</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!isScanning && !errorMsg && !scannedMed && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-slate-500"><Camera className="w-8 h-8" /></div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">No Medicine Scanned</h4>
              <p className="text-xs text-slate-400 mt-1">Upload or select a demo medicine to begin</p>
            </div>
          </div>
        )}

        {!isScanning && !errorMsg && scannedMed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 rounded-2xl space-y-5">
            {/* Critical Conflicts Banner */}
            {scannedMed.profileConflicts && scannedMed.profileConflicts.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-display tracking-wider uppercase">Critical Profile Conflict Detected</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {scannedMed.profileConflicts.map((conflict: any, i: number) => (
                    <p key={i} className="text-xs text-rose-300 leading-relaxed list-item">
                      <strong>[{conflict.severity} Risk]:</strong> {conflict.description}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">{scannedMed.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{scannedMed.generic} · {scannedMed.manufacturer}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-display font-extrabold",
                    scannedMed.safetyScore >= 80 ? "text-medical-teal" :
                    scannedMed.safetyScore >= 60 ? "text-amber-400" : "text-rose-500"
                  )}>{scannedMed.safetyScore}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Safety Score</div>
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
