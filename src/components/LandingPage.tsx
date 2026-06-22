'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Sparkles, Brain, Pill, Heart, 
  AlertTriangle, Globe, Users, Scan, ArrowRight,
  Activity, Zap, ChevronRight, Star, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    { icon: Brain, title: 'AI Health Twin', desc: 'A personalized digital replica of your biology that monitors, predicts, and protects.', color: 'text-medical-blue' },
    { icon: Scan, title: 'Medicine Scanner', desc: 'Photograph any medication for instant AI identification, dosage info, and safety alerts.', color: 'text-medical-teal' },
    { icon: Shield, title: 'Medication Safety', desc: 'Detect dangerous drug interactions, duplicates, and side effect risks automatically.', color: 'text-emerald-400' },
    { icon: AlertTriangle, title: 'Emergency Mode', desc: 'One-tap SOS that shares your critical medical data with first responders.', color: 'text-rose-500' },
    { icon: Users, title: 'Family Dashboard', desc: 'Monitor the health of your entire family from a single unified command center.', color: 'text-amber-400' },
    { icon: Globe, title: 'Multilingual AI', desc: 'Access medical guidance in English, Hindi, Telugu, Spanish, and Arabic.', color: 'text-medical-blue' }
  ];

  const testimonials = [
    { name: 'Dr. Ananya Sharma', role: 'Cardiologist, AIIMS', text: 'HealthTwin Guardian is the future of preventive healthcare. The risk prediction engine is remarkably accurate.', rating: 5 },
    { name: 'Marcus Chen', role: 'Patient, San Francisco', text: 'The emergency mode alone saved my father\'s life. First responders had his full medical history instantly.', rating: 5 },
    { name: 'Dr. Elena Voss', role: 'Family Medicine, Berlin', text: 'I recommend this to all my patients. The medication safety scanner has caught dangerous interactions twice.', rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      
      {/* Radial gradient background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-medical-blue/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-medical-teal/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="HealthTwin Logo" className="w-8 h-8 object-contain rounded-lg shrink-0" />
          <span className="font-display font-bold text-base text-white tracking-tight">HealthTwin</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-medical-blue/10 border border-medical-blue/20 text-medical-blue rounded-full font-semibold uppercase">Guardian AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#agents" className="hover:text-white transition">AI Agents</a>
          <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-white transition duration-200"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-medical-teal" />
            Powered by 7 specialized AI health agents
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Your AI</span>
            <br />
            <span className="bg-gradient-to-r from-medical-blue via-medical-teal to-medical-green bg-clip-text text-transparent">Health Twin</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
            Understand medical reports, scan medicines, predict risks, and stay prepared for emergencies — all powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-2xl text-sm font-bold text-white shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:shadow-[0_0_50px_rgba(0,210,255,0.5)] transition-all duration-300 hover:scale-[1.02]"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Floating Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 w-full max-w-4xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-20" />
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {/* Mock dashboard header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                healthtwin.ai/dashboard
              </div>
            </div>

            {/* Mock metrics */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Health Score', val: '88', color: 'text-medical-teal' },
                { label: 'Heart Rate', val: '64', color: 'text-rose-500' },
                { label: 'SpO2', val: '99%', color: 'text-medical-blue' },
                { label: 'Sleep', val: '8.4h', color: 'text-indigo-400' },
                { label: 'Meds', val: '6/6', color: 'text-emerald-400' },
                { label: 'Risk', val: 'Low', color: 'text-emerald-400' }
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white/3 border border-white/5 p-3 rounded-xl text-center"
                >
                  <p className="text-[9px] text-slate-500 uppercase">{m.label}</p>
                  <p className={cn("text-lg font-display font-extrabold mt-0.5", m.color)}>{m.val}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">Everything Your Health Needs</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">Six specialized AI-powered modules working together to form a comprehensive health protection system.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={idx}
                  className="glass-panel glass-panel-hover p-6 rounded-2xl cursor-pointer"
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  whileHover={{ y: -3 }}
                >
                  <div className={cn("p-2.5 rounded-xl bg-white/5 border border-white/5 inline-flex mb-3", feat.color)}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-display font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 md:px-12 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">Trusted by Doctors & Patients</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">Real experiences from healthcare professionals and users worldwide.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }, (_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-medical-blue">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 md:px-12 py-20 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">Ready to Meet Your Health Twin?</h2>
          <p className="text-sm text-slate-400">Join thousands of users who trust HealthTwin Guardian AI to protect their health and their families.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-medical-blue to-medical-teal rounded-2xl text-sm font-bold text-white shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:shadow-[0_0_50px_rgba(0,210,255,0.5)] transition-all duration-300 hover:scale-[1.02]"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HealthTwin Logo" className="w-3.5 h-3.5 object-contain rounded" />
            <span>HealthTwin Guardian AI · HIPAA Compliant · AES-256 Encrypted</span>
          </div>
          <span>© 2026 HealthTwin Technologies. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
