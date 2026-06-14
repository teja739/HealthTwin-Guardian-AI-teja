'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Phone, Download, Share2, QrCode, 
  Heart, Pill, ShieldAlert, User, Clock, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyProps {
  userProfile: {
    name: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

export default function EmergencyMode({ userProfile }: EmergencyProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [smsSent, setSmsSent] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const emergencyContacts = [
    { name: 'Dr. Sarah Mitchell', role: 'Primary Physician', phone: '+1 (555) 0142' },
    { name: 'Priya (Spouse)', role: 'Emergency Contact', phone: '+1 (555) 0198' },
    { name: 'City Hospital ER', role: 'Nearest Hospital', phone: '911' }
  ];

  useEffect(() => {
    if (isActivated && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isActivated && countdown === 0 && !smsSent) {
      setSmsSent(true);
    }
  }, [isActivated, countdown, smsSent]);

  useEffect(() => {
    if (!isActivated) return;
    const interval = setInterval(() => {
      setPulseIntensity(prev => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, [isActivated]);

  const handleActivate = () => {
    setIsActivated(true);
    setCountdown(5);
    setSmsSent(false);
  };

  const handleDeactivate = () => {
    setIsActivated(false);
    setCountdown(5);
    setSmsSent(false);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!isActivated ? (
          <motion.div
            key="standby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Activation Panel */}
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-extrabold text-white">Emergency Mode</h2>
                  <p className="text-sm text-slate-400 max-w-md">
                    Activating emergency mode will generate your critical health card, alert emergency contacts, and prepare your medical data for first responders.
                  </p>
                </div>

                <button
                  onClick={handleActivate}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-[-8px] rounded-full bg-rose-500/10 animate-pulse" />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-600 to-rose-700 border-4 border-rose-500/50 flex items-center justify-center shadow-[0_0_60px_rgba(244,63,94,0.4)] group-hover:shadow-[0_0_80px_rgba(244,63,94,0.6)] transition-all duration-300 group-hover:scale-105 cursor-pointer">
                    <div className="text-center">
                      <ShieldAlert className="w-10 h-10 text-white mx-auto mb-1" />
                      <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">SOS</span>
                    </div>
                  </div>
                </button>

                <p className="text-[11px] text-slate-500 max-w-xs">
                  Press the SOS button to activate. A 5-second countdown will begin before emergency alerts are sent.
                </p>
              </div>
            </div>

            {/* Emergency Contacts Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{contact.name}</h4>
                    <p className="text-[10px] text-slate-500">{contact.role} · {contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pre-configured Health Card Preview */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Emergency Health Card Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: User, label: 'Patient', val: userProfile.name },
                  { icon: Heart, label: 'Blood Group', val: userProfile.bloodGroup },
                  { icon: AlertTriangle, label: 'Allergies', val: userProfile.allergies.join(', ') || 'None' },
                  { icon: Pill, label: 'Medications', val: `${userProfile.medications.length} active` }
                ].map((item, i) => (
                  <div key={i} className="bg-white/3 border border-white/5 p-3 rounded-xl">
                    <item.icon className="w-4 h-4 text-rose-500 mb-1" />
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* ACTIVATED: Red Alert Banner */}
            <div className={cn(
              "p-6 rounded-2xl border-2 text-center relative overflow-hidden transition-all duration-500",
              "bg-rose-950/40 border-rose-500/50"
            )}>
              {/* Pulsing red overlay */}
              <div className={cn(
                "absolute inset-0 bg-rose-500/10 transition-opacity duration-500",
                pulseIntensity === 0 ? 'opacity-100' : 'opacity-30'
              )} />
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
                  <h2 className="text-2xl font-display font-extrabold text-rose-400 uppercase tracking-wider">
                    Emergency Active
                  </h2>
                  <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
                </div>

                {countdown > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-rose-300">Alerting emergency contacts in...</p>
                    <div className="text-6xl font-display font-extrabold text-rose-500 animate-pulse">
                      {countdown}
                    </div>
                    <button
                      onClick={handleDeactivate}
                      className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-semibold text-white hover:bg-white/20 transition inline-flex items-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel Emergency
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-400 font-semibold flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Emergency alerts sent to {emergencyContacts.length} contacts
                    </p>
                    <button
                      onClick={handleDeactivate}
                      className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-semibold text-white hover:bg-white/20 transition inline-flex items-center gap-2 mt-2"
                    >
                      <X className="w-3.5 h-3.5" /> Deactivate Emergency
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Health Card */}
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Emergency Health Card
                </h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-medical-blue">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-medical-teal">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Patient Info */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5 pb-1">Patient Information</p>
                  {[
                    { label: 'Full Name', val: userProfile.name },
                    { label: 'Blood Group', val: userProfile.bloodGroup },
                    { label: 'Emergency ID', val: 'HTG-' + Date.now().toString().slice(-6) }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[10px] text-slate-500">{item.label}</p>
                      <p className="text-sm font-bold text-white">{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Medical Data */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5 pb-1">Critical Medical Data</p>
                  <div>
                    <p className="text-[10px] text-slate-500">Known Allergies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(userProfile.allergies.length > 0 ? userProfile.allergies : ['None reported']).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[10px] font-semibold">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Active Medications</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userProfile.medications.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-medical-blue/10 border border-medical-blue/20 text-medical-blue rounded text-[10px] font-semibold">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Conditions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(userProfile.conditions.length > 0 ? userProfile.conditions : ['None reported']).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[10px] font-semibold">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-white rounded-xl">
                  <div className="w-28 h-28 bg-slate-900 rounded-lg flex items-center justify-center relative">
                    {/* Simulated QR Code pattern */}
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                      {/* QR corners */}
                      <rect x="5" y="5" width="25" height="25" rx="3" fill="#000" />
                      <rect x="8" y="8" width="19" height="19" rx="2" fill="#fff" />
                      <rect x="11" y="11" width="13" height="13" rx="1" fill="#000" />
                      
                      <rect x="70" y="5" width="25" height="25" rx="3" fill="#000" />
                      <rect x="73" y="8" width="19" height="19" rx="2" fill="#fff" />
                      <rect x="76" y="11" width="13" height="13" rx="1" fill="#000" />
                      
                      <rect x="5" y="70" width="25" height="25" rx="3" fill="#000" />
                      <rect x="8" y="73" width="19" height="19" rx="2" fill="#fff" />
                      <rect x="11" y="76" width="13" height="13" rx="1" fill="#000" />
                      
                      {/* QR data dots */}
                      {Array.from({ length: 20 }, (_, i) => (
                        <rect key={i} x={35 + (i % 5) * 8} y={35 + Math.floor(i / 5) * 8} width="5" height="5" rx="1" fill="#000" />
                      ))}
                    </svg>
                  </div>
                  <p className="text-[10px] text-slate-800 font-semibold text-center">Scan for full medical profile</p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className={cn(
                  "glass-panel p-4 rounded-2xl flex items-center gap-3 border",
                  smsSent ? 'border-emerald-500/20' : 'border-white/5'
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    smsSent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-rose-500'
                  )}>
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{contact.name}</h4>
                    <p className="text-[10px] text-slate-500">{contact.role}</p>
                  </div>
                  {smsSent && <span className="text-[9px] text-emerald-400 font-bold uppercase">Notified</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
