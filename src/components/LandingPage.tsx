'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Shield, Sparkles, Brain, Pill, Heart, 
  AlertTriangle, Globe, Users, Scan, ArrowRight,
  Activity, Star, Play, CheckCircle, Zap, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.25], [1, 0.95]);

  // Particle Background Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(37, 99, 235, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > width) p.speedX *= -1;
        if (p.y < 0 || p.y > height) p.speedY *= -1;
      });
      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const features = [
    { icon: Brain, title: 'AI Health Twin', desc: 'A personalized digital replica of your biology that monitors, predicts, and protects.', color: 'text-medical-blue', bg: 'bg-blue-500/10 border-blue-500/20' },
    { icon: Scan, title: 'Medicine Scanner', desc: 'Photograph any medication for instant AI identification, dosage info, and safety alerts.', color: 'text-medical-teal', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { icon: Shield, title: 'Medication Safety', desc: 'Detect dangerous drug interactions, duplicates, and side effect risks automatically.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: AlertTriangle, title: 'Emergency Mode', desc: 'One-tap SOS that shares your critical medical data with first responders.', color: 'text-medical-red', bg: 'bg-rose-500/10 border-rose-500/20' },
    { icon: Users, title: 'Family Dashboard', desc: 'Monitor the health of your entire family from a single unified command center.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: Globe, title: 'Multilingual AI', desc: 'Access medical guidance in English, Hindi, Telugu, Spanish, and Arabic.', color: 'text-medical-blue', bg: 'bg-blue-500/10 border-blue-500/20' }
  ];

  const testimonials = [
    { name: 'Dr. Ananya Sharma', role: 'Cardiologist, AIIMS', text: 'HealthTwin Guardian is the future of preventive healthcare. The risk prediction engine is remarkably accurate.', rating: 5 },
    { name: 'Marcus Chen', role: 'Patient, San Francisco', text: "The emergency mode alone saved my father's life. First responders had his full medical history instantly.", rating: 5 },
    { name: 'Dr. Elena Voss', role: 'Family Medicine, Berlin', text: 'I recommend this to all my patients. The medication safety scanner has caught dangerous interactions twice.', rating: 5 }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden text-foreground">
      {/* Dynamic Interactive Canvas Particles */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      
      {/* Ambient Premium Gradient Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-medical-blue/10 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-medical-teal/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-medical-red/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />

      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-card-border bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="HealthTwin Logo" className="w-8 h-8 object-contain rounded-xl shrink-0 shadow-lg shadow-medical-blue/20" />
          <span className="font-display font-bold text-base tracking-tight text-foreground">HealthTwin</span>
          <span className="text-[9px] px-2 py-0.5 bg-medical-blue/10 border border-medical-blue/20 text-medical-blue rounded-full font-bold uppercase tracking-wider">Guardian AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs text-slate-400 font-semibold">
          <a href="#features" className="hover:text-medical-blue transition-colors duration-200">Features</a>
          <a href="#testimonials" className="hover:text-medical-blue transition-colors duration-200">Testimonials</a>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2.5 bg-card-bg border border-card-border hover:border-medical-blue/30 hover:text-medical-blue rounded-xl text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 md:px-12 pt-16 pb-28 md:pt-24 md:pb-36 max-w-7xl mx-auto items-center">
        <motion.div
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="lg:col-span-7 space-y-8 text-left"
        >
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-medical-blue/5 border border-medical-blue/10 rounded-full text-xs text-medical-blue font-bold tracking-wide shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-medical-teal animate-pulse" />
            HealthTwin Guardian AI v2.0 is Live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.05]"
          >
            Your Personal <br />
            <span className="bg-gradient-to-r from-medical-blue via-medical-teal to-emerald-400 bg-clip-text text-transparent">
              AI Health Companion
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed font-normal"
          >
            Predict. Prevent. Protect. An advanced digital twin of your unique biology that acts as your proactive health shield.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-medical-blue to-medical-teal rounded-2xl text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-7 py-4 bg-card-bg border border-card-border hover:border-medical-teal/30 hover:text-medical-teal rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Demo
            </button>
          </motion.div>

          {/* Value Highlights */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-card-border"
          >
            {[
              { label: "AI Predictions", desc: "Real-time risk scoring" },
              { label: "Secure Data", desc: "AES-256 encrypted" },
              { label: "Doctor Approved", desc: "Used by clinical guides" }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-xs font-bold text-foreground">{item.label}</p>
                <p className="text-[10.5px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Interactive 3D Visualizer Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[400px]"
        >
          {/* 3D Pulsing Wireframe Heart */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Spinning orbital glow */}
            <div className="absolute w-80 h-80 rounded-full border border-dashed border-medical-blue/20 animate-[spin_40s_linear_infinite]" />
            <div className="absolute w-60 h-60 rounded-full border border-dashed border-medical-teal/10 animate-[spin_20s_linear_infinite_reverse]" />

            <div className="heart3d scale-[1.3]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rib"
                  style={{
                    transform: `rotateY(${i * 15}deg)`,
                    borderColor: i % 2 === 0 ? '#2563eb' : '#06b6d4',
                    boxShadow: '0 0 10px rgba(37, 99, 235, 0.1)'
                  }}
                />
              ))}
            </div>

            {/* Orbiting Floating Cards */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10px] left-[-20px] glass-panel p-3.5 rounded-xl border border-card-border flex items-center gap-2.5 shadow-xl"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-mono">Heart Rate</p>
                <p className="text-xs font-extrabold text-foreground">72 BPM</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[-10px] right-[-30px] glass-panel p-3.5 rounded-xl border border-card-border flex items-center gap-2.5 shadow-xl"
            >
              <div className="p-2 bg-medical-blue/10 rounded-lg text-medical-blue">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-mono">Health Score</p>
                <p className="text-xs font-extrabold text-foreground">92/100</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ x: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-[-40px] top-[40px] glass-panel p-3.5 rounded-xl border border-card-border flex items-center gap-2.5 shadow-xl"
            >
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-mono">Risk Status</p>
                <p className="text-xs font-extrabold text-foreground">Optimal</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 border-t border-card-border bg-background/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">Everything Your Health Needs</h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Six specialized AI-powered modules working together to form a comprehensive health protection ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={idx}
                  className="glass-panel glass-panel-hover p-7 rounded-2xl cursor-pointer flex flex-col justify-between min-h-[200px]"
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div>
                    <div className={cn("p-3 rounded-xl border inline-flex mb-4 transition-colors duration-300", feat.bg, feat.color)}>
                      <IconComp className="w-5.5 h-5.5" />
                    </div>
                    <h3 className="text-sm font-display font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 md:px-12 py-24 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">Trusted by Doctors & Patients</h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Real experiences from healthcare professionals and users worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="glass-panel p-7 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating }, (_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="flex items-center gap-3.5 border-t border-card-border pt-4">
                  <div className="w-9 h-9 rounded-full bg-medical-blue/10 border border-medical-blue/20 flex items-center justify-center text-xs font-extrabold text-medical-blue shadow-sm">
                    {t.name.charAt(4)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 md:px-12 py-24 border-t border-card-border bg-background/40">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground leading-tight">
            Ready to Meet Your Health Twin?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Join thousands of users who trust HealthTwin Guardian AI to protect their health and their families.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-9 py-4.5 bg-gradient-to-r from-medical-blue to-medical-teal rounded-2xl text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          >
            Get Started — It's Free
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-card-border px-6 md:px-12 py-10 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="HealthTwin Logo" className="w-5 h-5 object-contain rounded-lg" />
            <span>HealthTwin Guardian AI · HIPAA Compliant · AES-256 Encrypted</span>
          </div>
          <span>© 2026 HealthTwin Technologies. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
