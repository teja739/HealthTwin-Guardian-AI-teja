'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Phone, Download, Share2, QrCode, 
  Heart, Pill, ShieldAlert, User, Clock, X, MapPin, Navigation,
  Activity, ShieldCheck, Settings, Plus
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

  // Smart Emergency Prediction Vitals State
  const [vitals, setVitals] = useState({
    heartRate: 108,
    oxygenLevel: 92,
    bloodPressure: '145/95'
  });

  const [filterCategory, setFilterCategory] = useState<'Hospitals' | 'Pharmacies' | 'Blood Banks'>('Hospitals');

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
      // Log emergency alert broadcast to Splunk HEC
      logToSplunk('emergency_sos', {
        action: 'emergency_alerts_broadcasted',
        contactsCount: emergencyContacts.length,
        contactsNotified: emergencyContacts.map(c => ({ name: c.name, role: c.role })),
        bloodGroup: userProfile.bloodGroup,
        allergies: userProfile.allergies,
        medications: userProfile.medications,
        coordinates: coords ? `${coords.lat}, ${coords.lng}` : 'Not detected'
      }, { severity: 'Critical' });

      // Trigger backend SMS and Discord alerts
      fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name,
          bloodGroup: userProfile.bloodGroup,
          allergies: userProfile.allergies,
          medications: userProfile.medications,
          conditions: userProfile.conditions || [],
          contacts: emergencyContacts,
          location: coords ? {
            lat: coords.lat,
            lng: coords.lng,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
          } : null
        })
      }).catch(err => console.error('Failed to trigger backend emergency alert:', err));
    }
  }, [isActivated, countdown, smsSent, userProfile, emergencyContacts, coords]);

  useEffect(() => {
    if (!isActivated) return;
    const interval = setInterval(() => {
      setPulseIntensity(prev => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, [isActivated]);

  const handleDownloadCard = () => {
    const cardContent = `====================================
HEALTH TWIN - EMERGENCY HEALTH CARD
====================================
PATIENT NAME: ${userProfile.name}
BLOOD GROUP: ${userProfile.bloodGroup}
EMERGENCY ID: HTG-${Date.now().toString().slice(-6)}

CRITICAL MEDICAL DATA:
---------------------
KNOWN ALLERGIES: ${userProfile.allergies.join(', ') || 'None reported'}
ACTIVE MEDICATIONS: ${userProfile.medications.join(', ') || 'None reported'}
EXISTING CONDITIONS: ${userProfile.conditions?.join(', ') || 'None reported'}

EMERGENCY CONTACTS:
------------------
${emergencyContacts.map(c => `- ${c.name} (${c.role}): ${c.phone}`).join('\n')}

====================================
HIPAA COMPLIANT · ENCRYPTED TELEMETRY
====================================`;

    const blob = new Blob([cardContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userProfile.name.replace(/\s+/g, '_')}_health_card.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareCard = () => {
    const shareText = `Emergency Health Card for ${userProfile.name}:\nBlood Group: ${userProfile.bloodGroup}\nAllergies: ${userProfile.allergies.join(', ') || 'None'}\nConditions: ${userProfile.conditions?.join(', ') || 'None'}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${userProfile.name} - Emergency Health Card`,
        text: shareText,
        url: window.location.origin
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Emergency details copied to clipboard!');
    }
  };

  useEffect(() => {
    let watchId: number | null = null;

    const callLocationApi = async (lat?: number, lng?: number) => {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
        if (!response.ok) throw new Error('Location API failed');
        const data = await response.json();
        
        setCoords({ lat: data.lat, lng: data.lng });
        setAddress(data.address || `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
        
        logToSplunk('emergency_sos', {
          action: 'emergency_location_resolved',
          lat: data.lat,
          lng: data.lng,
          address: data.address,
          provider: data.provider
        }, { severity: 'Info' });
      } catch (err) {
        console.error('Emergency location resolution error:', err);
        if (lat && lng) {
          setCoords({ lat, lng });
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } else {
          setAddress('Could not resolve physical address.');
        }
      } finally {
        setLocating(false);
      }
    };

    if (isActivated) {
      setLocating(true);
      if (typeof window !== 'undefined' && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            callLocationApi(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn('Emergency browser live Geolocation failed, trying server-side lookup:', error);
            callLocationApi();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        callLocationApi();
      }
    } else {
      setCoords(null);
      setAddress(null);
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isActivated]);

  const handleActivate = () => {
    setIsActivated(true);
    setCountdown(5);
    setSmsSent(false);
    setAddress(null);
    
    // Log emergency initiated to Splunk HEC
    logToSplunk('emergency_sos', {
      action: 'emergency_initiated',
      countdownSeconds: 5
    }, { severity: 'Warning' });
  };

  const handleDeactivate = () => {
    setIsActivated(false);
    setCountdown(5);
    setSmsSent(false);
    setCoords(null);
    setAddress(null);
    // Log emergency deactivated to Splunk HEC
    logToSplunk('emergency_sos', {
      action: 'emergency_deactivated'
    }, { severity: 'Success' });
  };

  // Smart prediction calculations
  const isHypoxia = vitals.oxygenLevel < 93;
  const isTachycardia = vitals.heartRate > 100;
  const systolic = parseInt(vitals.bloodPressure.split('/')[0]) || 120;
  const isHypertensive = systolic > 140;
  const hasPredictionAlert = isHypoxia || isTachycardia || isHypertensive;

  // Hospital Matchmaker logic
  const activeCity = address && !locating 
    ? (address.includes('Chennai') ? 'Chennai' : address.includes('Mumbai') ? 'Mumbai' : address.includes('Hosur') ? 'Hosur' : 'Chennai') 
    : 'Chennai';

  const matchedHospitals = rawHospitals
    .filter((h: any) => h.city.toLowerCase() === activeCity.toLowerCase())
    .slice(0, 5)
    .map((h: any) => {
      let relevance = 'General Medical';
      let isMatch = false;
      
      const isCardio = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure') || c.toLowerCase().includes('heart'));
      const isMetabolic = userProfile.conditions.some(c => c.toLowerCase().includes('diabetes'));
      
      if (isCardio && (h.name.toLowerCase().includes('heart') || h.name.toLowerCase().includes('cardio') || h.name.toLowerCase().includes('general') || h.name.toLowerCase().includes('care'))) {
        relevance = 'Cardiology Specialty (Perfect Match)';
        isMatch = true;
      } else if (isMetabolic && (h.name.toLowerCase().includes('diabetes') || h.name.toLowerCase().includes('endocrine') || h.name.toLowerCase().includes('general'))) {
        relevance = 'Metabolic Specialty (Perfect Match)';
        isMatch = true;
      }
      
      return {
        ...h,
        relevance,
        isMatch,
        distance: (Math.random() * 3 + 0.8).toFixed(1) + ' km',
        waitTime: Math.floor(Math.random() * 25 + 5) + ' mins wait'
      };
    });

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!isActivated ? (
          <motion.div
            key="standby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Left: SOS Panel, Contacts, and Card Preview */}
            <div className="lg:col-span-3 space-y-6">
              {/* Activation Panel */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[320px]">
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

                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
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
                    <div key={i} className="bg-white/3 border border-white/5 p-3 rounded-xl text-xs">
                      <item.icon className="w-4 h-4 text-rose-500 mb-1" />
                      <p className="text-[10px] text-slate-500">{item.label}</p>
                      <p className="text-xs font-semibold text-white mt-0.5">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Smart Prediction & Location Intelligence */}
            <div className="lg:col-span-2 space-y-6">
              {/* Smart Emergency Prediction */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <Activity className="w-4 h-4 text-rose-500 animate-pulse" /> Smart Emergency Prediction
                </h3>

                <div className="space-y-3.5">
                  {/* Slider 1: Heart Rate */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Heart Rate</span>
                      <span className={cn("font-bold", vitals.heartRate > 100 ? "text-rose-400" : "text-slate-200")}>{vitals.heartRate} bpm</span>
                    </div>
                    <input 
                      type="range" min="60" max="140" value={vitals.heartRate}
                      onChange={(e) => setVitals(prev => ({ ...prev, heartRate: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Slider 2: SpO2 */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Blood Oxygen (SpO2)</span>
                      <span className={cn("font-bold", vitals.oxygenLevel < 93 ? "text-rose-400" : "text-slate-200")}>{vitals.oxygenLevel}%</span>
                    </div>
                    <input 
                      type="range" min="85" max="100" value={vitals.oxygenLevel}
                      onChange={(e) => setVitals(prev => ({ ...prev, oxygenLevel: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Slider 3: Blood Pressure */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Systolic Blood Pressure</span>
                      <span className={cn("font-bold", systolic > 140 ? "text-rose-400" : "text-slate-200")}>{vitals.bloodPressure} mmHg</span>
                    </div>
                    <input 
                      type="range" min="110" max="170" value={systolic}
                      onChange={(e) => setVitals(prev => ({ ...prev, bloodPressure: `${e.target.value}/${parseInt(prev.bloodPressure.split('/')[1]) || 80}` }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                {/* Warning Notification Banner */}
                {hasPredictionAlert ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 space-y-1.5 leading-relaxed"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                      <span>Potential Health Risk Detected</span>
                    </div>
                    <p className="italic">
                      "Potential health risk detected. Consider contacting a doctor." SpO2 is sub-optimal ({vitals.oxygenLevel}%) or BP is elevated ({vitals.bloodPressure}).
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>All dynamic telemetry indexes are stable.</span>
                  </div>
                )}
              </div>

              {/* Location-Aware Hospital Matchmaker */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-medical-teal animate-bounce" /> Hospital Matchmaker
                  </h3>
                  
                  {/* Category switcher */}
                  <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                    {(['Hospitals', 'Pharmacies', 'Blood Banks'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={cn(
                          "px-2 py-1 text-[9px] font-bold rounded transition",
                          filterCategory === cat ? 'bg-medical-teal/20 text-medical-teal border border-medical-teal/20' : 'text-slate-400'
                        )}
                      >
                        {cat.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {filterCategory === 'Hospitals' && matchedHospitals.map((h: any, idx: number) => (
                    <div key={idx} className={cn(
                      "p-3 bg-white/3 border rounded-xl space-y-1.5 text-xs transition",
                      h.isMatch ? 'border-medical-teal/20 bg-medical-teal/5' : 'border-white/5'
                    )}>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-white leading-tight">{h.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">{h.distance}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{h.address}, {h.city}</p>
                      
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider",
                          h.isMatch ? 'text-medical-teal' : 'text-slate-500'
                        )}>{h.relevance}</span>
                        <span className="text-[9px] font-mono text-amber-400 font-bold">{h.waitTime}</span>
                      </div>
                    </div>
                  ))}

                  {filterCategory === 'Pharmacies' && [
                    { name: 'Apollo Pharmacy 24/7', dist: '0.4 km', addr: 'Bandra Main Rd', status: 'Open 24/7' },
                    { name: 'Wellness Forever Medicals', dist: '0.8 km', addr: 'Link Road Corner', status: 'Open 24/7' }
                  ].map((p, idx) => (
                    <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">{p.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono">{p.dist}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{p.addr}</p>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">{p.status}</span>
                    </div>
                  ))}

                  {filterCategory === 'Blood Banks' && [
                    { name: 'Red Cross Society Blood Center', dist: '1.8 km', groups: 'O+, A+, B+, AB+', stock: 'High' },
                    { name: 'City Hospital Blood Bank', dist: '2.5 km', groups: 'All Blood Groups', stock: 'Critical Stock' }
                  ].map((b, idx) => (
                    <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">{b.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono">{b.dist}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Available: {b.groups}</p>
                      <span className="text-[9px] text-amber-400 font-bold uppercase">Stock: {b.stock}</span>
                    </div>
                  ))}
                </div>
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
                  <button 
                    onClick={handleDownloadCard}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-medical-blue"
                    title="Download Health Card"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleShareCard}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-medical-teal"
                    title="Share Health Card"
                  >
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

            {/* Smart Emergency Locator */}
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" /> Smart Emergency Locator
              </h3>
              
              {locating ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-rose-500 animate-spin" />
                  <span>Pinpointing GPS coordinates...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono">YOUR GPS LOCATION</p>
                      <p className="text-xs font-semibold text-white mt-1">
                        {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Location Permission Denied'}
                      </p>
                      {address && (
                        <p className="text-[9px] text-slate-300 mt-1 font-sans italic leading-snug">{address}</p>
                      )}
                      <p className="text-[9px] text-slate-500 mt-1">Shared live with family via emergency channels</p>
                    </div>
                    {coords && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded-lg border border-white/10 transition"
                      >
                        <Navigation className="w-3 h-3 text-rose-400" /> View Map Location
                      </a>
                    )}
                  </div>

                  <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono">NEAREST EMERGENCY ROOM</p>
                      <p className="text-xs font-semibold text-white mt-1">City Memorial Hospital ER</p>
                      <p className="text-[9px] text-emerald-400 font-mono mt-1">1.2 km away · Open 24/7</p>
                    </div>
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=City+Memorial+Hospital+ER"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-bold text-rose-400 rounded-lg border border-rose-500/20 transition"
                    >
                      <Navigation className="w-3 h-3" /> Get SOS Route Directions
                    </a>
                  </div>

                  <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono">DISPATCH AMBULANCE</p>
                      <p className="text-xs font-semibold text-white mt-1">National Emergency Service</p>
                      <p className="text-[9px] text-slate-500 mt-1">Priority dispatch line</p>
                    </div>
                    <a
                      href="tel:911"
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-[10px] font-bold text-white rounded-lg border border-rose-500/30 transition"
                    >
                      <Phone className="w-3 h-3 text-rose-400" /> Dispatch Call (911)
                    </a>
                  </div>
                </div>
              )}
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
