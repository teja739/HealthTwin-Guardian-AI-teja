'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, Shield, AlertTriangle, CheckCircle, 
  Pill, Clock, Star, Upload, Loader2, Calendar, Sun, Moon, CheckCircle2 
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

  // Calendar Reminders State
  const [reminders, setReminders] = useState([
    { id: 'rem1', time: 'Morning', title: 'Vitamin D3', dose: '1 Capsule (5000 IU)', taken: true, icon: Sun, color: 'text-amber-400' },
    { id: 'rem2', time: 'Afternoon', title: 'BP Tablet (Lisinopril)', dose: '1 Tablet (10mg)', taken: false, icon: Sun, color: 'text-medical-blue' },
    { id: 'rem3', time: 'Night', title: 'Antibiotic (Amoxicillin)', dose: '1 Capsule (500mg)', taken: false, icon: Moon, color: 'text-indigo-400' }
  ]);

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
      const med = { ...sampleMeds[idx] };
      const conflicts: any[] = [];
      if (userProfile) {
        if (med.generic.toLowerCase() === 'lisinopril') {
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

      logToSplunk('medicine_scan', {
        action: 'medicine_scanned',
        scanSource: 'demo_mock',
        medicineName: med.name
      }, { severity: conflicts.length > 0 ? 'Warning' : 'Success' });
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
        try {
          const base64 = reader.result as string;
          const response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

          logToSplunk('medicine_scan', {
            action: 'medicine_scanned',
            scanSource: 'camera_upload',
            medicineName: data.name
          }, { severity: 'Success' });
        } catch (err: any) {
          setErrorMsg(err.message || 'An error occurred while scanning the medicine package.');
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setIsScanning(false);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, taken: !r.taken } : r));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Image Scanner & Prescriptions */}
      <div className="lg:col-span-7 space-y-6">
        {/* Scanner Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Medicine Image Scanner</h3>
          <p className="text-[10px] text-slate-500 mt-1">Upload or capture a medicine package for instant AI drug analysis</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 border-2 border-dashed border-card-border bg-white/3 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-medical-blue/30 transition duration-300"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <Camera className="w-8 h-8 text-medical-blue mb-3" />
            <p className="text-xs font-bold text-foreground">Tap to capture or upload image</p>
            <p className="text-[9px] text-slate-500 mt-1 font-mono">Supports JPG, PNG, HEIC</p>
          </div>
        </div>

        {/* Prescription Reminders Calendar */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-card-border pb-3">
            <div>
              <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-medical-teal" /> Prescription Calendar
              </h3>
              <p className="text-[10px] text-slate-500">Track daily medication schedules</p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="space-y-3">
            {reminders.map((rem) => {
              const IconComp = rem.icon;
              return (
                <button
                  key={rem.id}
                  onClick={() => toggleReminder(rem.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border text-xs text-left transition duration-200 cursor-pointer",
                    rem.taken 
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                      : 'border-card-border bg-white/2 hover:border-medical-blue/20 text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={cn("p-2 rounded-lg bg-white/5 border border-card-border", rem.color)}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">{rem.time}</span>
                      <h4 className="font-bold text-foreground mt-0.5">{rem.title}</h4>
                      <p className="text-[10px] text-slate-500">{rem.dose}</p>
                    </div>
                  </div>
                  <CheckCircle2 className={cn("w-5 h-5", rem.taken ? 'text-emerald-400' : 'text-slate-600')} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Section */}
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <h4 className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest">Quick Demo Prescriptions</h4>
          <div className="grid grid-cols-2 gap-3">
            {sampleMeds.map((med, idx) => (
              <button
                key={idx}
                onClick={() => triggerMockScan(idx)}
                disabled={isScanning}
                className="text-left p-3.5 rounded-xl border border-card-border bg-white/3 flex items-center gap-3 text-xs transition duration-200 hover:border-medical-teal/20 cursor-pointer"
              >
                <div className="p-2 bg-medical-teal/10 border border-medical-teal/20 rounded-lg text-medical-teal">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{med.name}</h4>
                  <span className="text-[9px] text-slate-500">{med.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Scan Results */}
      <div className="lg:col-span-5 min-h-[450px]">
        {isScanning && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-8 h-8 text-medical-blue animate-spin" />
            <div>
              <h4 className="font-display font-bold text-foreground text-sm">Analyzing Medicine Label</h4>
              <p className="text-[10px] text-slate-500 mt-1">Extracting active compounds & evaluating profile safety...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4 border-medical-red/20 bg-medical-red/5">
            <div className="p-3.5 bg-medical-red/10 border border-medical-red/20 rounded-2xl text-medical-red">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground text-sm">Scan Failed</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="px-4 py-2 bg-white/5 border border-card-border rounded-xl text-xs font-bold text-foreground hover:bg-white/10 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {!isScanning && !errorMsg && !scannedMed && (
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-white/3 border border-card-border rounded-2xl text-slate-500">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground text-sm">No Medicine Scanned</h4>
              <p className="text-xs text-slate-500 mt-1">Upload a photo or select a demo prescription to begin.</p>
            </div>
          </div>
        )}

        {!isScanning && !errorMsg && scannedMed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 rounded-2xl space-y-5">
            
            {/* Profile Conflicts Alert */}
            {scannedMed.profileConflicts && scannedMed.profileConflicts.length > 0 && (
              <div className="bg-medical-red/10 border border-medical-red/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-medical-red font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-display tracking-wider uppercase">Critical Profile Conflict</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {scannedMed.profileConflicts.map((conflict: any, i: number) => (
                    <p key={i} className="text-xs text-red-300 leading-relaxed list-item font-light">
                      <strong>[{conflict.severity} Risk]:</strong> {conflict.description}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-base">{scannedMed.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{scannedMed.generic} · {scannedMed.manufacturer}</p>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-display font-extrabold",
                  scannedMed.safetyScore >= 80 ? "text-medical-green" : "text-medical-yellow"
                )}>{scannedMed.safetyScore}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Safety Score</div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', val: scannedMed.category },
                { label: 'Form', val: scannedMed.form },
                { label: 'Dosage', val: scannedMed.dosage.split(',')[0] },
                { label: 'Rx Required', val: scannedMed.prescriptionRequired ? 'Yes' : 'No' }
              ].map((item, i) => (
                <div key={i} className="bg-white/3 border border-card-border p-3 rounded-xl">
                  <p className="text-[9px] text-slate-500 font-mono">{item.label}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Purpose</p>
              <p className="p-3 bg-white/3 border border-card-border rounded-xl text-xs text-slate-300 leading-relaxed font-light">{scannedMed.purpose}</p>
            </div>

            {/* Side Effects */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Common Side Effects</p>
              <div className="flex flex-wrap gap-2">
                {scannedMed.sideEffects.map((se: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-medical-yellow/10 border border-medical-yellow/20 text-medical-yellow rounded-lg text-[9.5px] font-semibold">{se}</span>
                ))}
              </div>
            </div>

            {/* Interactions */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Drug Interactions</p>
              {scannedMed.interactions.map((inter: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                  <AlertTriangle className="w-3.5 h-3.5 text-medical-yellow mt-0.5 shrink-0" />
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
