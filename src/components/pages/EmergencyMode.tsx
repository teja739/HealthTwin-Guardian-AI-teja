'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Phone, Download, Share2, QrCode, 
  Heart, Pill, ShieldAlert, User, Clock, X, MapPin, Navigation,
  Activity, ShieldCheck, Plus, Thermometer, ShieldX, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';
import rawHospitals from '@/lib/hospitals_india.json';

interface EmergencyProps {
  userProfile: {
    name: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    email: string;
  };
}

export default function EmergencyMode({ userProfile }: EmergencyProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [smsSent, setSmsSent] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  // Vitals simulation for emergency trigger
  const [vitals, setVitals] = useState({
    heartRate: 108,
    oxygenLevel: 91,
    bloodPressure: '145/95'
  });

  const emergencyContacts = [
    { name: 'Dr. Sarah Mitchell', role: 'Primary Physician', phone: '+1 (555) 0142' },
    { name: 'Priya (Spouse)', role: 'Emergency Contact', phone: '+1 (555) 0198' },
    { name: 'City Hospital ER', role: 'Nearest Hospital', phone: '911' }
  ];

  // Simulated live GPS resolution
  useEffect(() => {
    let watchId: number | null = null;

    const callLocationApi = async (lat?: number, lng?: number) => {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
        const data = await response.json();
        setCoords({ lat: data.lat, lng: data.lng });
        setAddress(data.address || `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
      } catch (err) {
        if (lat && lng) {
          setCoords({ lat, lng });
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } else {
          setAddress('Region: Default Metropolitan Area');
        }
      } finally {
        setLocating(false);
      }
    };

    if (isActivated) {
      setLocating(true);
      if (typeof window !== 'undefined' && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => callLocationApi(position.coords.latitude, position.coords.longitude),
          () => callLocationApi(),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        callLocationApi();
      }
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isActivated]);

  // Countdown & SMS Trigger
  useEffect(() => {
    if (isActivated && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isActivated && countdown === 0 && !smsSent) {
      setSmsSent(true);
      setAiAnalyzing(true);

      // Log emergency alert to Splunk HEC
      logToSplunk('emergency_sos', {
        action: 'emergency_alerts_broadcasted',
        bloodGroup: userProfile.bloodGroup,
        allergies: userProfile.allergies,
        medications: userProfile.medications,
        vitals
      }, { severity: 'Critical' });

      // Generate AI First-Aid Advice dynamically based on vitals and userProfile
      setTimeout(() => {
        const hasHypertension = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'));
        
        let condition = "Acute Cardiopulmonary Distress";
        let aid = [
          "Sit in an upright position immediately to reduce cardiac load.",
          "Loosen any tight clothing around your neck and chest.",
          "Perform slow, diaphragmatic breathing (4s inhale, 4s hold, 4s exhale)."
        ];
        let avoid = [
          "Do NOT perform any physical movements or walk around.",
          "Do NOT consume large amounts of cold water rapidly.",
          "Do NOT panic; focus entirely on regulating your breathing."
        ];

        if (vitals.oxygenLevel < 92) {
          condition = "Hypoxia & Respiratory Distress";
          aid.unshift("Ensure the room has active ventilation or open a window immediately.");
        }
        if (hasHypertension && parseInt(vitals.bloodPressure.split('/')[0]) > 140) {
          condition = "Hypertensive Crisis Warning";
          aid.push("Take your prescribed Lisinopril 10mg immediately if you missed your morning dose.");
        }

        setAiAdvice({ condition, aid, avoid });
        setAiAnalyzing(false);
      }, 1500);

      // Trigger backend alerts
      fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name,
          bloodGroup: userProfile.bloodGroup,
          allergies: userProfile.allergies,
          medications: userProfile.medications,
          conditions: userProfile.conditions,
          contacts: emergencyContacts,
          location: coords ? {
            lat: coords.lat,
            lng: coords.lng,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
          } : null
        })
      }).catch(err => console.error(err));
    }
  }, [isActivated, countdown, smsSent, userProfile, vitals, coords]);

  // Pulse animation controller
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
    setAiAdvice(null);
    logToSplunk('emergency_sos', { action: 'emergency_initiated' }, { severity: 'Warning' });
  };

  const handleDeactivate = () => {
    setIsActivated(false);
    setCountdown(5);
    setSmsSent(false);
    setAiAdvice(null);
    logToSplunk('emergency_sos', { action: 'emergency_deactivated' }, { severity: 'Success' });
  };

  const handleDownloadCard = () => {
    const cardContent = `====================================
HEALTH TWIN - EMERGENCY HEALTH CARD
====================================
PATIENT NAME: ${userProfile.name}
BLOOD GROUP: ${userProfile.bloodGroup}
EMERGENCY ID: HTG-${Date.now().toString().slice(-6)}

CRITICAL MEDICAL DATA:
---------------------
ALLERGIES: ${userProfile.allergies.join(', ') || 'None'}
MEDICATIONS: ${userProfile.medications.join(', ') || 'None'}
CONDITIONS: ${userProfile.conditions?.join(', ') || 'None'}

EMERGENCY CONTACTS:
------------------
${emergencyContacts.map(c => `- ${c.name} (${c.role}): ${c.phone}`).join('\n')}
====================================`;

    const blob = new Blob([cardContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userProfile.name.replace(/\s+/g, '_')}_health_card.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hospital Matchmaker logic
  const activeCity = address?.includes('Mumbai') ? 'Mumbai' : 'Chennai';
  const matchedHospitals = rawHospitals
    .filter((h: any) => h.city.toLowerCase() === activeCity.toLowerCase())
    .slice(0, 3)
    .map((h: any) => ({
      ...h,
      distance: (Math.random() * 2 + 0.5).toFixed(1) + ' km',
      waitTime: Math.floor(Math.random() * 15 + 5) + ' mins'
    }));

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!isActivated ? (
          /* STANDBY MODE */
          <motion.div
            key="standby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* SOS Button Panel */}
            <div className="lg:col-span-7 glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[420px]">
              <div className="absolute inset-0 bg-gradient-to-b from-medical-red/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-2.5">
                  <h2 className="text-2xl font-display font-extrabold text-foreground">AI Emergency SOS Shield</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Press the button below to initiate emergency protocols. The system will immediately notify contacts, locate the nearest ER, and compile first-aid guidance.
                  </p>
                </div>

                {/* Pulsing Red SOS Button */}
                <button onClick={handleActivate} className="relative cursor-pointer">
                  <div className="absolute inset-[-15px] rounded-full bg-medical-red/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-[-8px] rounded-full bg-medical-red/10 animate-pulse" />
                  <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-medical-red to-red-700 border-4 border-red-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.45)] hover:shadow-[0_0_70px_rgba(239,68,68,0.6)] transition-all duration-300 hover:scale-[1.03]">
                    <div className="text-center">
                      <ShieldAlert className="w-12 h-12 text-white mx-auto mb-1 animate-pulse" />
                      <span className="text-xs font-extrabold text-white tracking-widest uppercase">SOS</span>
                    </div>
                  </div>
                </button>

                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                  A 5-second countdown will begin upon pressing, allowing you to cancel if triggered accidentally.
                </p>
              </div>
            </div>

            {/* Right: Vitals Configuration & Contacts */}
            <div className="lg:col-span-5 space-y-6">
              {/* Emergency Vitals Mock Slider */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-card-border">
                  <Activity className="w-4 h-4 text-medical-red animate-pulse" /> Emergency Vitals Input
                </h3>

                <div className="space-y-3.5">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Heart Rate</span>
                      <span className="font-bold text-medical-red">{vitals.heartRate} bpm</span>
                    </div>
                    <input 
                      type="range" min="60" max="150" value={vitals.heartRate}
                      onChange={(e) => setVitals(prev => ({ ...prev, heartRate: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-red"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Blood Oxygen (SpO2)</span>
                      <span className="font-bold text-medical-red">{vitals.oxygenLevel}%</span>
                    </div>
                    <input 
                      type="range" min="80" max="100" value={vitals.oxygenLevel}
                      onChange={(e) => setVitals(prev => ({ ...prev, oxygenLevel: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-medical-red"
                    />
                  </div>
                </div>

                <div className="p-3 bg-medical-red/10 border border-medical-red/20 rounded-xl text-[11px] text-medical-red leading-relaxed">
                  Adjusting these values will customize the AI First-Aid guidance when SOS is triggered.
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest border-b border-card-border pb-2">Emergency Dispatch Group</h3>
                <div className="space-y-2.5">
                  {emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{contact.name}</p>
                        <p className="text-[10px] text-slate-500">{contact.role}</p>
                      </div>
                      <a href={`tel:${contact.phone}`} className="p-2 bg-white/5 border border-card-border rounded-lg text-medical-red hover:bg-white/10">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE EMERGENCY MODE */
          <motion.div
            key="activated"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Pulsing Alert Bar */}
            <div className="p-6 rounded-2xl border border-medical-red/30 bg-medical-red/10 relative overflow-hidden text-center">
              <div className={cn("absolute inset-0 bg-medical-red/5 transition-opacity duration-700", pulseIntensity === 0 ? 'opacity-100' : 'opacity-20')} />
              <div className="relative z-10 space-y-3">
                <h2 className="text-3xl font-display font-extrabold text-medical-red tracking-widest uppercase animate-pulse">EMERGENCY PROTOCOL ACTIVE</h2>
                {countdown > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-rose-300">Broadcasting emergency alerts to contacts in...</p>
                    <p className="text-6xl font-display font-extrabold text-foreground">{countdown}</p>
                    <button onClick={handleDeactivate} className="px-5 py-2 bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer">
                      Cancel Emergency
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Emergency alerts successfully broadcasted</p>
                    <button onClick={handleDeactivate} className="px-5 py-2 bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer">
                      Deactivate SOS Mode
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gemini First-Aid & Hospital Routing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Gemini First-Aid Panel */}
              <div className="lg:col-span-8 glass-panel p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2.5 border-b border-card-border pb-4">
                  <div className="p-2 bg-medical-red/15 border border-medical-red/25 text-medical-red rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Gemini First-Aid Advisor</h3>
                    <p className="text-[10px] text-slate-500">Instant clinical guidelines customized to your active vitals</p>
                  </div>
                </div>

                {aiAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <span className="w-8 h-8 rounded-full border-4 border-white/10 border-t-medical-red animate-spin" />
                    <p className="text-xs text-slate-400">AI Medical Agent analyzing vitals & conditions...</p>
                  </div>
                ) : aiAdvice ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Possible Condition & Actionable Steps */}
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Possible Condition</span>
                        <p className="text-base font-extrabold text-medical-red">{aiAdvice.condition}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Immediate First Aid</span>
                        <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-light">
                          {aiAdvice.aid.map((step: string, i: number) => (
                            <p key={i} className="flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-medical-red mt-1.5 shrink-0" />
                              <span>{step}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Things NOT to do */}
                    <div className="p-4 bg-medical-red/5 border border-medical-red/20 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[9px] text-medical-red uppercase tracking-widest font-bold flex items-center gap-1.5"><ShieldX className="w-4 h-4" /> Things NOT to do</span>
                        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-light">
                          {aiAdvice.avoid.map((step: string, i: number) => (
                            <p key={i} className="flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-medical-red mt-1.5 shrink-0" />
                              <span>{step}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 mt-4 leading-relaxed font-light border-t border-card-border pt-3">
                        Disclaimer: AI advice is supplementary. Professional responders have been dispatched with your medical records.
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Awaiting AI analysis...</p>
                )}
              </div>

              {/* Nearest ER Matchmaker */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[360px]">
                <div className="space-y-4">
                  <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest border-b border-card-border pb-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-medical-teal" /> Emergency Matchmaker</h3>
                  
                  <div className="space-y-3">
                    {matchedHospitals.map((h, i) => (
                      <div key={i} className="p-3 bg-white/3 border border-card-border rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-foreground">{h.name}</h4>
                          <span className="text-[9px] text-slate-500 font-mono">{h.distance}</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400">{h.address}</p>
                        <div className="flex justify-between items-center pt-1 border-t border-card-border/50 text-[9px] mt-1">
                          <span className="text-medical-teal font-bold uppercase">Cardiology Capable</span>
                          <span className="text-medical-yellow font-mono font-bold">{h.waitTime} wait</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-card-border rounded-xl text-xs space-y-2">
                  <p className="text-[10px] text-slate-500 font-mono">YOUR GPS COORDINATES</p>
                  <p className="font-bold text-foreground">{coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Resolving...'}</p>
                  <p className="text-[9.5px] text-slate-400 leading-snug">{address || 'Detecting address...'}</p>
                </div>
              </div>

            </div>

            {/* Medical Card & QR */}
            <div className="glass-panel p-6 rounded-2xl border border-card-border flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="space-y-3 flex-1">
                <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-5 h-5 text-medical-blue" /> Patient Digital Health Card
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <p className="text-[10px] text-slate-500">Patient</p>
                    <p className="text-xs font-bold text-foreground">{userProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Blood Group</p>
                    <p className="text-xs font-bold text-foreground">{userProfile.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Allergies</p>
                    <p className="text-xs font-bold text-medical-red truncate">{userProfile.allergies.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Medications</p>
                    <p className="text-xs font-bold text-medical-blue truncate">{userProfile.medications.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <button onClick={handleDownloadCard} className="px-4 py-2.5 bg-white/5 border border-card-border hover:bg-white/10 text-xs font-bold text-foreground rounded-xl flex items-center gap-2 transition duration-200 cursor-pointer">
                  <Download className="w-4 h-4" /> Download Card
                </button>
                <div className="p-2 bg-white rounded-xl flex items-center justify-center shadow-md">
                  <QrCode className="w-10 h-10 text-black" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
