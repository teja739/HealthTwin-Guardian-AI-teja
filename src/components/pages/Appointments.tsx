'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Calendar, Clock, MapPin, Activity, 
  ShieldAlert, Search, Bot, Sparkles, Plus, 
  Phone, ArrowRight, User, CheckCircle, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAppointment, getAppointments } from '@/lib/supabase';
import { logToSplunk } from '@/lib/splunk-client';

interface AppointmentsProps {
  userProfile: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    onboardingComplete: boolean;
  };
}

interface Hospital {
  id: string;
  name: string;
  distance: string;
  address: string;
  rating: number;
  phone: string;
  lat: number;
  lng: number;
}

export default function Appointments({ userProfile }: AppointmentsProps) {
  // Symptom Checker State
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Geolocation & Hospital State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Booking State
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Bookings list
  const [myBookings, setMyBookings] = useState<any[]>([]);

  const doctorsBySpecialty: Record<string, string[]> = {
    'Cardiologist': ['Dr. Sarah Mitchell', 'Dr. Kenneth Cole'],
    'Dermatologist': ['Dr. David Vance', 'Dr. Amanda Perry'],
    'General Physician': ['Dr. Elena Rostova', 'Dr. James Sullivan'],
    'Pediatrician': ['Dr. Michael Chang', 'Dr. Lisa Kudrow'],
    'Neurologist': ['Dr. Robert Chen', 'Dr. Sandra Bullock'],
    'Orthopedic': ['Dr. Anthony Stark', 'Dr. Bruce Banner']
  };

  const defaultHospitals: Record<string, Hospital[]> = {
    global: [
      { id: 'h1', name: 'Metro Health Memorial Hospital', distance: '1.2 km', address: '450 Health Ave, Metro City', rating: 4.8, phone: '+1 (555) 0120', lat: 37.7749, lng: -122.4194 },
      { id: 'h2', name: 'St. Jude General Clinic & ER', distance: '2.5 km', address: '102 Care Blvd, Downtown', rating: 4.6, phone: '+1 (555) 0134', lat: 37.7849, lng: -122.4094 },
      { id: 'h3', name: 'Valley Cardiac Specialist Center', distance: '3.8 km', address: '88 Arterial Rd, Valley Hills', rating: 4.9, phone: '+1 (555) 0199', lat: 37.7649, lng: -122.4294 },
      { id: 'h4', name: 'Greenwood Pediatric & Family Clinic', distance: '4.1 km', address: '304 Forest Parkway', rating: 4.5, phone: '+1 (555) 0167', lat: 37.7949, lng: -122.4394 }
    ],
    bangalore: [
      { id: 'b1', name: 'Manipal Hospital Hal Road', distance: '1.5 km', address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru', rating: 4.7, phone: '+91 80 2502 4444', lat: 12.9592, lng: 77.6433 },
      { id: 'b2', name: 'Fortis Hospital Bannerghatta', distance: '3.2 km', address: '154/9, Bannerghatta Rd, Opposite IIM-B, Bengaluru', rating: 4.6, phone: '+91 80 6621 4444', lat: 12.8954, lng: 77.5979 },
      { id: 'b3', name: 'Apollo Hospitals Jayanagar', distance: '4.5 km', address: '21st Main Rd, 2nd Phase, Jayanagar, Bengaluru', rating: 4.8, phone: '+91 80 4668 8888', lat: 12.9298, lng: 77.5831 }
    ],
    mumbai: [
      { id: 'm1', name: 'Kokilaben Dhirubhai Ambani Hospital', distance: '2.1 km', address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai', rating: 4.8, phone: '+91 22 4269 6969', lat: 19.1311, lng: 72.8252 },
      { id: 'm2', name: 'Hinduja National Hospital', distance: '3.6 km', address: 'Veer Savarkar Marg, Mahim, Mumbai', rating: 4.7, phone: '+91 22 2445 1515', lat: 19.0322, lng: 72.8396 },
      { id: 'm3', name: 'Lilavati Hospital & Research Centre', distance: '4.8 km', address: 'A-791, Bandra Reclamation Rd, Bandra West, Mumbai', rating: 4.6, phone: '+91 22 2675 1000', lat: 19.0526, lng: 72.8262 }
    ]
  };

  const detectLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    const callLocationApi = async (lat?: number, lng?: number) => {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
        if (!response.ok) throw new Error('Location API failed');
        const data = await response.json();
        
        const coords = { lat: data.lat, lng: data.lng };
        setCoordinates(coords);
        if (data.city) {
          setSearchCity(data.city);
          // Set appropriate hospitals based on resolved city name
          const cityLower = data.city.toLowerCase();
          if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
            setHospitals(defaultHospitals.bangalore);
          } else if (cityLower.includes('mumbai') || cityLower.includes('bombay')) {
            setHospitals(defaultHospitals.mumbai);
          } else {
            // Generate customized hospital list using the city name
            const customHospitals = [
              { id: 'c1', name: `${data.city} General Hospital & ER`, distance: '1.2 km', address: `101 Medical Plaza, ${data.city}`, rating: 4.7, phone: '+1 (555) 8801', lat: data.lat, lng: data.lng },
              { id: 'c2', name: `${data.city} Urgent Care Center`, distance: '2.5 km', address: `45 Wellness Ave, ${data.city}`, rating: 4.6, phone: '+1 (555) 8802', lat: data.lat, lng: data.lng }
            ];
            setHospitals(customHospitals);
          }
        }
        
        logToSplunk('location_services', {
          action: 'location_detected_via_api',
          lat: data.lat,
          lng: data.lng,
          city: data.city,
          provider: data.provider
        }, { severity: 'Info' });
      } catch (err) {
        console.error('Location API error:', err);
        setLocationError('Could not resolve location. Please enter your city manually.');
      } finally {
        setLocationLoading(false);
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          callLocationApi(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Browser Geolocation failed, trying server-side location lookup:', error);
          // Fall back to server geolocation (IP-based or Google Geolocation API)
          callLocationApi();
        },
        { timeout: 8000 }
      );
    } else {
      callLocationApi();
    }
  };

  // Fetch user bookings on mount and detect location automatically
  useEffect(() => {
    async function loadBookings() {
      const data = await getAppointments(userProfile.email);
      setMyBookings(data);
    }
    loadBookings();
    
    // Set default hospital list
    setHospitals(defaultHospitals.global);

    // Trigger live location detection automatically on mount
    detectLocation();
  }, [userProfile.email]);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity) return;
    
    const city = searchCity.toLowerCase().trim();
    if (city.includes('bangalore') || city.includes('bengaluru')) {
      setHospitals(defaultHospitals.bangalore);
      setCoordinates({ lat: 12.9716, lng: 77.5946 });
    } else if (city.includes('mumbai') || city.includes('bombay')) {
      setHospitals(defaultHospitals.mumbai);
      setCoordinates({ lat: 19.0760, lng: 72.8777 });
    } else {
      // Generate randomized local hospitals for the custom city
      const customHospitals = [
        { id: 'c1', name: `${searchCity} Community General Hospital`, distance: '1.4 km', address: `101 Medical Plaza, ${searchCity}`, rating: 4.6, phone: '+1 (555) 8801', lat: 0, lng: 0 },
        { id: 'c2', name: `St. Elizabeth ER & Care Center`, distance: '2.8 km', address: `45 Wellness Ave, ${searchCity}`, rating: 4.7, phone: '+1 (555) 8802', lat: 0, lng: 0 },
        { id: 'c3', name: `${searchCity} Urgent Care & Pediatrics`, distance: '3.9 km', address: `209 Health Dr, ${searchCity}`, rating: 4.4, phone: '+1 (555) 8803', lat: 0, lng: 0 }
      ];
      setHospitals(customHospitals);
      setCoordinates({ lat: 0, lng: 0 });
    }

    logToSplunk('location_services', {
      action: 'hospital_search_by_city',
      city: searchCity
    }, { severity: 'Info' });
  };

  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, userProfile })
      });

      if (!response.ok) throw new Error('Symptom analysis failed');
      const data = await response.json();
      
      setAnalysisResult(data);
      setSelectedSpecialty(data.specialty);
      
      // Auto select the first doctor of that specialty
      const docs = doctorsBySpecialty[data.specialty] || doctorsBySpecialty['General Physician'];
      setSelectedDoctor(docs[0]);

      logToSplunk('symptom_checker', {
        action: 'symptoms_analyzed_success',
        specialtyRecommended: data.specialty,
        urgency: data.urgency
      }, { severity: data.urgency === 'Critical SOS' ? 'Critical' : 'Success' });

    } catch (err) {
      console.error(err);
      // Fallback
      setAnalysisResult({
        specialty: 'General Physician',
        urgency: 'Consult within 24 hours',
        analysis: 'Could not communicate with the AI analyzer. Based on standard clinical triage, a General Physician consultation is recommended.',
        advice: 'Stay hydrated, record temperature, and monitor symptoms. Visit the nearest ER if pain worsens.',
        disclaimer: 'Standard disclaimer: Fallback guidance in place.'
      });
      setSelectedSpecialty('General Physician');
      setSelectedDoctor(doctorsBySpecialty['General Physician'][0]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime || !activeHospital) return;
    setBookingLoading(true);

    const appt = {
      specialty: selectedSpecialty,
      doctorName: selectedDoctor,
      hospitalName: activeHospital.name,
      appointmentTime: `${selectedDate}T${selectedTime}:00`,
      status: 'Confirmed'
    };

    try {
      const saved = await createAppointment(userProfile.email, appt);
      setMyBookings(prev => [saved, ...prev]);
      setBookingSuccess(true);

      logToSplunk('appointment_booking', {
        action: 'appointment_created',
        specialty: appt.specialty,
        doctor: appt.doctorName,
        hospital: appt.hospitalName,
        time: appt.appointmentTime
      }, { severity: 'Success' });

    } catch (err) {
      console.error('Failed to create appointment:', err);
      alert('Error booking appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-medical-blue" />
            Book AI-Recommended Appointments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Let the HealthTwin AI analyze symptoms to direct you to the correct specialist, locate nearby facilities, and book slots in one click.
          </p>
        </div>
        <button 
          onClick={detectLocation}
          className="z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition duration-200"
        >
          <MapPin className="w-4 h-4 text-medical-teal" />
          Detect Live Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Step 1: AI Symptom Triage */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4 h-fit">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-medical-blue/15 border border-medical-blue/30 flex items-center justify-center text-medical-blue">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">AI Symptom Analyzer</h3>
              <p className="text-[10px] text-slate-500">Describe what you are feeling</p>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="glass-input w-full px-3.5 py-3 text-xs h-28 resize-none"
              placeholder="Describe symptoms (e.g., 'Experiencing chest pain that radiates to my left arm, along with mild dizziness...')"
            />
            <button
              onClick={handleSymptomAnalysis}
              disabled={!symptoms.trim() || isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition-all duration-300 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Symptoms...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analyze Symptoms & Triage
                </>
              )}
            </button>
          </div>

          {/* AI Symptom Results */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-4 border-t border-white/5 space-y-4"
              >
                <div className={cn(
                  "p-3.5 rounded-xl border text-xs space-y-2",
                  analysisResult.urgency === 'Critical SOS' ? 'bg-rose-500/10 border-rose-500/30' :
                  analysisResult.urgency.includes('24') ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-emerald-500/10 border-emerald-500/30'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Recommended Referral:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                      analysisResult.urgency === 'Critical SOS' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' :
                      analysisResult.urgency.includes('24') ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    )}>
                      {analysisResult.urgency}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-white">{analysisResult.specialty}</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Triage Analysis</p>
                  <p className="p-3 bg-white/3 border border-white/5 rounded-xl text-slate-300 leading-relaxed font-mono">
                    {analysisResult.analysis}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Home Care Guidance</p>
                  <p className="p-3 bg-white/3 border border-white/5 rounded-xl text-slate-300 leading-relaxed font-mono">
                    {analysisResult.advice}
                  </p>
                </div>

                <p className="text-[9px] text-slate-500 italic leading-relaxed">
                  ⚠️ {analysisResult.disclaimer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2 & 3: Facility Locator & Booking Form */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Facility Locator */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-medical-teal" /> Nearby Hospital Locator
              </h3>
              <form onSubmit={handleCitySearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Enter city (e.g. Mumbai)"
                  className="glass-input px-3 py-1.5 text-xs w-36"
                />
                <button type="submit" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                  <Search className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
            </div>

            {locationError && (
              <p className="text-[10px] text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                {locationError}
              </p>
            )}

            {/* Hospitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitals.map((hospital) => {
                const isActive = activeHospital?.id === hospital.id;
                return (
                  <button
                    key={hospital.id}
                    onClick={() => {
                      setActiveHospital(hospital);
                      setBookingSuccess(false);
                    }}
                    className={cn(
                      "text-left p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition duration-200",
                      isActive ? 'border-medical-blue bg-medical-blue/5' : 'border-white/5 hover:border-white/12'
                    )}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-semibold text-white leading-tight">{hospital.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">{hospital.distance}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{hospital.address}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2 mt-1">
                      <span className="text-amber-400 font-bold">★ {hospital.rating}</span>
                      <span className="text-slate-500 font-mono">{hospital.phone}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking Configurator */}
          <AnimatePresence>
            {activeHospital && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel p-6 rounded-2xl space-y-4"
              >
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-medical-blue" />
                  Select Booking Slot at {activeHospital.name.split(' ')[0]}
                </h3>

                {bookingSuccess ? (
                  <div className="p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-center space-y-3">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Appointment Confirmed!</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Your slot with **{selectedDoctor}** on **{selectedDate}** at **{selectedTime}** is scheduled.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBookingSuccess(false);
                        setActiveHospital(null);
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition mt-2"
                    >
                      Book Another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Doctor Specialty & Physician Select */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Specialty Needed</label>
                          <select
                            value={selectedSpecialty}
                            onChange={(e) => {
                              setSelectedSpecialty(e.target.value);
                              const docs = doctorsBySpecialty[e.target.value] || [];
                              setSelectedDoctor(docs[0] || '');
                            }}
                            className="glass-input w-full px-3 py-2 text-xs mt-1.5 bg-slate-950"
                          >
                            <option value="">-- Select Specialty --</option>
                            {Object.keys(doctorsBySpecialty).map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Available Physician</label>
                          <select
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="glass-input w-full px-3 py-2 text-xs mt-1.5 bg-slate-950"
                            disabled={!selectedSpecialty}
                          >
                            {(doctorsBySpecialty[selectedSpecialty] || []).map(doc => (
                              <option key={doc} value={doc}>{doc}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date & Time Select */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Date</label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="glass-input w-full px-3 py-2 text-xs mt-1.5 bg-slate-950"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Time Slot</label>
                          <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="glass-input w-full px-3 py-2 text-xs mt-1.5 bg-slate-950"
                          >
                            <option value="">-- Select Time --</option>
                            {['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'].map(t => (
                              <option key={t} value={t}>{t} AM/PM</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmBooking}
                      disabled={!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime || bookingLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,210,255,0.15)] hover:shadow-[0_0_30px_rgba(0,210,255,0.3)] transition-all duration-300 disabled:opacity-30"
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Scheduling...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Confirm & Book Appointment
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bookings List */}
          {myBookings.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-medical-teal" /> Your Scheduled Consultations ({myBookings.length})
              </h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {myBookings.map((appt, idx) => (
                  <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-white">{appt.doctorName || appt.doctor_name}</h4>
                      <p className="text-[10px] text-slate-400">{appt.specialty} · {appt.hospitalName || appt.hospital_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-medical-blue">
                        {appt.appointmentTime ? appt.appointmentTime.replace('T', ' ').slice(0, 16) : appt.appointment_time}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold uppercase">
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
