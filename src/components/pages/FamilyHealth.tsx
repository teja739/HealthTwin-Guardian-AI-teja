'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, AlertTriangle, Calendar, Pill, Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FamilyHealth() {
  const [selectedMember, setSelectedMember] = useState<number>(0);

  const family = [
    {
      name: 'You (Primary)',
      relation: 'Self',
      age: 32,
      avatar: '👤',
      healthScore: 88,
      risk: 'Low',
      bloodGroup: 'O+',
      conditions: ['Mild Hypertension'],
      medications: 6,
      nextAppt: 'Jun 28, 2026',
      alerts: []
    },
    {
      name: 'Priya',
      relation: 'Spouse',
      age: 30,
      avatar: '👩',
      healthScore: 94,
      risk: 'Low',
      bloodGroup: 'A+',
      conditions: [],
      medications: 1,
      nextAppt: 'Jul 15, 2026',
      alerts: []
    },
    {
      name: 'Arjun',
      relation: 'Son',
      age: 6,
      avatar: '👦',
      healthScore: 97,
      risk: 'Low',
      bloodGroup: 'O+',
      conditions: [],
      medications: 0,
      nextAppt: 'Aug 02, 2026',
      alerts: ['Vaccination due: DPT Booster']
    },
    {
      name: 'Rajesh',
      relation: 'Father',
      age: 62,
      avatar: '👨‍🦳',
      healthScore: 71,
      risk: 'Medium',
      bloodGroup: 'B+',
      conditions: ['Type 2 Diabetes', 'Hypertension'],
      medications: 4,
      nextAppt: 'Jun 20, 2026',
      alerts: ['HbA1c test overdue', 'Blood pressure trending high']
    }
  ];

  const member = family[selectedMember];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Family Members List */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-white">Family Members</h3>
            <button className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
              <Plus className="w-4 h-4 text-medical-blue" />
            </button>
          </div>

          <div className="space-y-2.5">
            {family.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMember(idx)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border flex items-center justify-between transition duration-200",
                  selectedMember === idx ? 'border-medical-blue bg-white/5' : 'border-white/5 hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                    {m.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                    <span className="text-[10px] text-slate-500">{m.relation} · Age {m.age}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.alerts.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <span className={cn(
                    "text-xs font-bold font-display",
                    m.healthScore >= 85 ? 'text-emerald-400' : m.healthScore >= 70 ? 'text-amber-400' : 'text-rose-500'
                  )}>{m.healthScore}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Member Detail Panel */}
      <div className="lg:col-span-3 glass-panel p-6 rounded-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
              {member.avatar}
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">{member.name}</h3>
              <p className="text-xs text-slate-400">{member.relation} · Blood Group: {member.bloodGroup}</p>
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-3xl font-display font-extrabold",
              member.healthScore >= 85 ? 'text-emerald-400' : member.healthScore >= 70 ? 'text-amber-400' : 'text-rose-500'
            )}>{member.healthScore}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Health Score</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Heart, label: 'Risk Level', val: member.risk, color: member.risk === 'Low' ? 'text-emerald-400' : 'text-amber-400' },
            { icon: Pill, label: 'Medications', val: member.medications.toString(), color: 'text-medical-blue' },
            { icon: Calendar, label: 'Next Visit', val: member.nextAppt.split(',')[0], color: 'text-medical-teal' },
            { icon: AlertTriangle, label: 'Alerts', val: member.alerts.length.toString(), color: member.alerts.length > 0 ? 'text-amber-400' : 'text-emerald-400' }
          ].map((s, i) => (
            <div key={i} className="bg-white/3 border border-white/5 p-3.5 rounded-xl">
              <s.icon className={cn("w-4 h-4 mb-1.5", s.color)} />
              <p className="text-[10px] text-slate-500">{s.label}</p>
              <p className={cn("text-sm font-bold mt-0.5", s.color)}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Conditions */}
        {member.conditions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Known Conditions</p>
            <div className="flex flex-wrap gap-2">
              {member.conditions.map((c, i) => (
                <span key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {member.alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Alerts</p>
            <div className="space-y-2">
              {member.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {member.alerts.length === 0 && member.conditions.length === 0 && (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
            <Heart className="w-5 h-5" />
            <span>All health markers are within normal range. No active alerts or concerns.</span>
          </div>
        )}
      </div>
    </div>
  );
}
