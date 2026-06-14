'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, ArrowLeft, Check, Heart, Pill, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProps {
  onComplete: (profile: any) => void;
  userName: string;
  userEmail: string;
}

export default function Onboarding({ onComplete, userName, userEmail }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    age: '32',
    weight: '72',
    height: '175',
    bloodGroup: 'O+',
    goals: ['Heart Health', 'Longevity'],
    allergies: ['Penicillin'],
    medications: ['Lisinopril 10mg', 'Metoprolol 25mg', 'Atorvastatin 20mg', 'Metformin 500mg', 'Aspirin 81mg', 'Vitamin D3'],
    conditions: ['Mild Hypertension']
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const healthGoals = ['Heart Health', 'Longevity', 'Diabetes Prevention', 'Stress Reduction', 'Weight Management', 'Sleep Improvement', 'Mental Clarity', 'Athletic Performance'];

  const steps = [
    { title: 'Basic Profile', desc: 'Help your Health Twin understand your body' },
    { title: 'Health Goals', desc: 'Select what matters most to you' },
    { title: 'Medical History', desc: 'Critical data for accurate predictions' }
  ];

  const handleComplete = () => {
    onComplete({
      name: userName,
      email: userEmail,
      ...profile,
      onboardingComplete: true
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-medical-blue/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-medical-blue to-medical-teal flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-base text-white">HealthTwin Guardian AI</span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                i < step ? 'bg-medical-teal border-medical-teal text-white' :
                i === step ? 'bg-medical-blue/20 border-medical-blue text-medical-blue' :
                'bg-white/5 border-white/10 text-slate-500'
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-12 h-0.5 rounded", i < step ? 'bg-medical-teal' : 'bg-white/10')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-display font-bold text-white">{steps[step].title}</h2>
            <p className="text-xs text-slate-400">{steps[step].desc}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Age', val: profile.age, key: 'age', unit: 'years' },
                    { label: 'Weight', val: profile.weight, key: 'weight', unit: 'kg' },
                    { label: 'Height', val: profile.height, key: 'height', unit: 'cm' }
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{f.label}</label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          value={f.val}
                          onChange={(e) => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="glass-input w-full px-3 py-2.5 text-sm pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Blood Group</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {bloodGroups.map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setProfile(prev => ({ ...prev, bloodGroup: bg }))}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border transition duration-200",
                          profile.bloodGroup === bg
                            ? 'bg-medical-blue/20 border-medical-blue text-medical-blue'
                            : 'bg-white/3 border-white/10 text-slate-400 hover:border-white/20'
                        )}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Health Goals */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {healthGoals.map((goal) => {
                    const isSelected = profile.goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            goals: isSelected
                              ? prev.goals.filter(g => g !== goal)
                              : [...prev.goals, goal]
                          }));
                        }}
                        className={cn(
                          "p-3 rounded-xl text-xs font-semibold border transition duration-200 text-left",
                          isSelected
                            ? 'bg-medical-blue/15 border-medical-blue/40 text-medical-blue'
                            : 'bg-white/3 border-white/10 text-slate-400 hover:border-white/20'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {goal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Medical History */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Known Allergies
                  </label>
                  <input
                    type="text"
                    value={profile.allergies.join(', ')}
                    onChange={(e) => setProfile(prev => ({ ...prev, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    className="glass-input w-full px-3 py-2.5 text-xs mt-1.5"
                    placeholder="e.g., Penicillin, Sulfa"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Pill className="w-3 h-3" /> Current Medications
                  </label>
                  <textarea
                    value={profile.medications.join('\n')}
                    onChange={(e) => setProfile(prev => ({ ...prev, medications: e.target.value.split('\n').filter(Boolean) }))}
                    className="glass-input w-full px-3 py-2.5 text-xs mt-1.5 h-24 resize-none"
                    placeholder="One medication per line"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Heart className="w-3 h-3" /> Known Conditions
                  </label>
                  <input
                    type="text"
                    value={profile.conditions.join(', ')}
                    onChange={(e) => setProfile(prev => ({ ...prev, conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    className="glass-input w-full px-3 py-2.5 text-xs mt-1.5"
                    placeholder="e.g., Hypertension, Type 2 Diabetes"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <button
                onClick={() => setStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}

            {step < 2 ? (
              <button
                onClick={() => setStep(prev => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.2)] hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] transition-all duration-300"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.2)] hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] transition-all duration-300"
              >
                <Sparkles className="w-3.5 h-3.5" /> Launch Health Twin
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
