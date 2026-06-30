'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Heart, AlertTriangle, Calendar, 
  Pill, Plus, ChevronRight, X, Sparkles, CheckCircle2, Loader2, Award 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFamilyMembers, addFamilyMember } from '@/lib/supabase';
import { logToSplunk } from '@/lib/splunk-client';

interface FamilyHealthProps {
  userProfile: {
    email: string;
  };
}

export default function FamilyHealth({ userProfile }: FamilyHealthProps) {
  const [family, setFamily] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('Spouse');
  const [newAge, setNewAge] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newConditions, setNewConditions] = useState('');
  const [newMedications, setNewMedications] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Live Family Alerts State
  const [alerts, setAlerts] = useState<any[]>([
    {
      id: '1',
      type: 'success',
      title: 'Water Goal Completed',
      text: 'Rajesh Damaraju (Father) completed 2.4L daily water target.',
      time: '1 hr ago'
    },
    {
      id: '2',
      type: 'success',
      title: 'Medication Adherence Logged',
      text: 'Devika Damaraju (Mother) registered morning Lisinopril intake.',
      time: '2 hrs ago'
    }
  ]);

  const handleSimulateAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      type: 'critical',
      title: 'CRITICAL: Medication Missed',
      text: 'Rajesh Damaraju (Father) MISSED Metformin dosage (due at 8:00 AM). AI alerted family via SMS.',
      time: 'Just now'
    };
    setAlerts(prev => [newAlert, ...prev]);
    alert('🚨 Emergency Simulation Triggered!\nFather Rajesh Damaraju missed his Metformin dosage. AI dispatched urgent SMS alerts.');
    
    logToSplunk('family_health', {
      action: 'family_emergency_simulated',
      event: 'father_missed_meds'
    }, { severity: 'Critical' });
  };

  useEffect(() => {
    async function loadFamily() {
      setLoading(true);
      try {
        const data = await getFamilyMembers(userProfile.email);
        // Pre-populate with Father, Mother, Sister if DB has no members
        if (data.length === 0) {
          const defaultFamily = [
            {
              id: 'f1',
              name: 'Rajesh Damaraju',
              relation: 'Father',
              age: 59,
              bloodGroup: 'O+',
              conditions: ['Hypertension'],
              medications: ['Aspirin 81mg', 'Metformin 500mg'],
              avatar: '👨',
              healthScore: 88,
              risk: 'Medium'
            },
            {
              id: 'm1',
              name: 'Devika Damaraju',
              relation: 'Mother',
              age: 56,
              bloodGroup: 'A+',
              conditions: ['Type 2 Diabetes'],
              medications: ['Lisinopril 10mg'],
              avatar: '👩',
              healthScore: 94,
              risk: 'Low'
            },
            {
              id: 's1',
              name: 'Anjali Damaraju',
              relation: 'Sister',
              age: 22,
              bloodGroup: 'O+',
              conditions: [],
              medications: [],
              avatar: '👧',
              healthScore: 91,
              risk: 'Low'
            }
          ];
          setFamily(defaultFamily);
        } else {
          setFamily(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFamily();
  }, [userProfile.email]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAge || saveLoading) return;
    
    setSaveLoading(true);

    const conditionsArray = newConditions
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const medicationsArray = newMedications
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    let healthScore = 95;
    let risk = 'Low';
    if (conditionsArray.length > 0) {
      healthScore -= 10 * conditionsArray.length;
      risk = 'Medium';
    }
    if (parseInt(newAge) > 60) {
      healthScore -= 10;
      risk = 'Medium';
    }
    if (healthScore < 75) {
      risk = 'High';
    }
    healthScore = Math.max(healthScore, 45);

    const member = {
      name: newName,
      relation: newRelation,
      age: parseInt(newAge),
      bloodGroup: newBloodGroup,
      conditions: conditionsArray,
      medications: medicationsArray,
      avatar: newRelation === 'Spouse' || newRelation === 'Mother' ? '👩' : newRelation === 'Daughter' || newRelation === 'Sister' ? '👧' : '👨',
      healthScore,
      risk
    };

    try {
      const saved = await addFamilyMember(userProfile.email, member);
      setFamily(prev => [...prev, saved]);
      
      logToSplunk('family_health', {
        action: 'family_member_added',
        relation: newRelation,
        age: parseInt(newAge)
      }, { severity: 'Success' });

      setNewName('');
      setNewRelation('Spouse');
      setNewAge('');
      setNewBloodGroup('O+');
      setNewConditions('');
      setNewMedications('');
      setShowAddModal(false);

    } catch (err) {
      console.error(err);
      alert('Failed to add family member.');
    } finally {
      setSaveLoading(false);
    }
  };

  const member = family[selectedMember] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Family Members List & Alerts */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-card-border pb-3">
            <div>
              <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-medical-blue" /> Family Dashboard
              </h3>
              <p className="text-[10px] text-slate-500">Monitor family health scores and vitals</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-card-bg border border-card-border hover:border-medical-blue/30 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-medical-blue" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-medical-blue animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {family.map((m, idx) => (
                <button
                  key={m.id || idx}
                  onClick={() => setSelectedMember(idx)}
                  className={cn(
                    "w-full text-left p-4.5 rounded-2xl border flex items-center justify-between transition duration-200 cursor-pointer",
                    selectedMember === idx ? 'border-medical-blue bg-medical-blue/5' : 'border-card-border hover:border-card-border/60'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-white/5 border border-card-border flex items-center justify-center text-xl shadow-sm">
                      {m.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{m.name}</h4>
                      <span className="text-[10px] text-slate-500">{m.relation} · Age {m.age}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.conditions && m.conditions.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-medical-yellow animate-pulse" />
                    )}
                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-extrabold font-display",
                        m.healthScore >= 85 ? 'text-medical-green' : m.healthScore >= 70 ? 'text-medical-yellow' : 'text-medical-red'
                      )}>{m.healthScore}</span>
                      <p className="text-[8px] text-slate-500 uppercase font-mono">Score</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Alerts Feed */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-card-border pb-3">
            <div>
              <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-medical-red animate-pulse" /> Live Family Alerts
              </h3>
            </div>
            <button
              onClick={handleSimulateAlert}
              className="px-3 py-1 bg-medical-red/10 border border-medical-red/20 hover:bg-medical-red/20 rounded-xl text-[9px] font-bold text-medical-red transition cursor-pointer"
            >
              Simulate Missed Meds
            </button>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {alerts.map((a) => (
              <div 
                key={a.id} 
                className={cn(
                  "p-3.5 rounded-xl border text-[11px] leading-relaxed space-y-1.5 relative overflow-hidden transition",
                  a.type === 'critical' 
                    ? 'bg-medical-red/5 border-medical-red/20 text-medical-red animate-pulse'
                    : 'bg-white/3 border-card-border text-slate-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{a.title}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{a.time}</span>
                </div>
                <p className="text-slate-400 leading-snug">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Member Detail Panel */}
      <div className="lg:col-span-7">
        {member ? (
          <div className="glass-panel p-6 rounded-2xl space-y-6 min-h-[500px]">
            {/* Detail Header */}
            <div className="flex items-center justify-between border-b border-card-border pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-card-border flex items-center justify-center text-3xl shadow-sm">
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">{member.name}</h3>
                  <p className="text-xs text-slate-400">{member.relation} · Blood Group: {member.bloodGroup || 'O+'}</p>
                </div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-3xl font-display font-extrabold",
                  member.healthScore >= 85 ? 'text-medical-green' : member.healthScore >= 70 ? 'text-medical-yellow' : 'text-medical-red'
                )}>{member.healthScore}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Health Score</div>
              </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Heart, label: 'Risk Level', val: member.risk, color: member.risk === 'Low' ? 'text-medical-green' : 'text-medical-yellow' },
                { icon: Pill, label: 'Medications', val: (member.medications?.length || 0).toString(), color: 'text-medical-blue' },
                { icon: Calendar, label: 'Next Visit', val: 'Scheduled', color: 'text-medical-teal' },
                { icon: AlertTriangle, label: 'Alerts', val: (member.conditions?.length || 0).toString(), color: (member.conditions?.length || 0) > 0 ? 'text-medical-yellow' : 'text-medical-green' }
              ].map((s, i) => (
                <div key={i} className="bg-white/3 border border-card-border p-3.5 rounded-xl">
                  <s.icon className={cn("w-4.5 h-4.5 mb-2", s.color)} />
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                  <p className={cn("text-xs font-extrabold mt-0.5", s.color)}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Conditions Section */}
            {member.conditions && member.conditions.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Registered Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {member.conditions.map((c: string, i: number) => (
                    <span key={i} className="px-3.5 py-2 bg-medical-yellow/10 border border-medical-yellow/20 text-medical-yellow rounded-xl text-xs font-semibold">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Medications List */}
            {member.medications && member.medications.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Medications</p>
                <div className="space-y-2">
                  {member.medications.map((m: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-3.5 bg-white/3 border border-card-border rounded-xl text-xs text-slate-300 font-mono">
                      <Pill className="w-4.5 h-4.5 text-medical-blue" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!member.conditions || member.conditions.length === 0) && (!member.medications || member.medications.length === 0) && (
              <div className="p-4 bg-medical-green/5 border border-medical-green/20 rounded-xl flex items-center gap-3 text-xs text-medical-green">
                <Heart className="w-5 h-5 animate-pulse" />
                <span>All biological markers are within optimal ranges. No active alerts or medications.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl text-center py-12 text-xs text-slate-400">
            No family member records found.
          </div>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-2xl w-full max-w-md space-y-4 relative border border-card-border"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-display font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-medical-teal" /> Add Family Record
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage health records for your family in one place.</p>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 bg-slate-950"
                  placeholder="e.g. Ramesh Damaraju"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Relation</label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 bg-slate-950"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Age</label>
                  <input
                    type="number"
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 bg-slate-950"
                    placeholder="e.g. 58"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Blood Group</label>
                <select
                  value={newBloodGroup}
                  onChange={(e) => setNewBloodGroup(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 bg-slate-950"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Known Conditions</label>
                <input
                  type="text"
                  value={newConditions}
                  onChange={(e) => setNewConditions(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 bg-slate-950"
                  placeholder="e.g. Asthma, Hypertension (comma separated)"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Current Medications</label>
                <textarea
                  value={newMedications}
                  onChange={(e) => setNewMedications(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs mt-1.5 h-16 bg-slate-950 resize-none"
                  placeholder="One medicine per line"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-medical-blue to-medical-teal rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition cursor-pointer"
              >
                {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Save Record'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
