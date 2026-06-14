'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Brain, Shield, FileText, 
  Globe, AlertTriangle, Pill, Cpu, Play, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentNode {
  id: string;
  name: string;
  icon: any;
  color: string;
  glow: string;
  x: number; // percentage coordinate
  y: number;
  status: 'IDLE' | 'COMPUTING' | 'SYNCED' | 'WARNING';
  activity: string;
}

export default function AgentSwarm() {
  const [selectedAgent, setSelectedAgent] = useState<string>('cardiac');
  const [pulseTrigger, setPulseTrigger] = useState(false);
  const [swarmConsole, setSwarmConsole] = useState<string[]>([
    'Swarm core initialized. All nodes reporting online.',
    'Ready for diagnostic command signals.'
  ]);

  const agents: Record<string, AgentNode> = {
    blood: {
      id: 'blood',
      name: 'Blood Report Agent',
      icon: Shield,
      color: 'text-rose-500',
      glow: 'rgba(244, 63, 94, 0.4)',
      x: 30,
      y: 20,
      status: 'SYNCED',
      activity: 'Awaiting lab sheet uploads to execute entities extraction pipelines.'
    },
    medication: {
      id: 'medication',
      name: 'Medication Agent',
      icon: Pill,
      color: 'text-medical-teal',
      glow: 'rgba(13, 242, 201, 0.4)',
      x: 70,
      y: 20,
      status: 'IDLE',
      activity: 'Cross-checking medication databases for possible duplicate active ingredients.'
    },
    cardiac: {
      id: 'cardiac',
      name: 'Cardiac Agent',
      icon: Heart,
      color: 'text-rose-500',
      glow: 'rgba(244, 63, 94, 0.4)',
      x: 15,
      y: 50,
      status: 'COMPUTING',
      activity: 'Analyzing real-time resting heart rate vectors. Running ECG correlation.'
    },
    prediction: {
      id: 'prediction',
      name: 'Prediction Agent',
      icon: Brain,
      color: 'text-medical-blue',
      glow: 'rgba(0, 210, 255, 0.4)',
      x: 85,
      y: 50,
      status: 'SYNCED',
      activity: 'Re-evaluating general longevity indices based on weekly sleep consistency.'
    },
    document: {
      id: 'document',
      name: 'Medical Document Agent',
      icon: FileText,
      color: 'text-medical-blue',
      glow: 'rgba(0, 210, 255, 0.4)',
      x: 30,
      y: 80,
      status: 'IDLE',
      activity: 'OCR indexing pipeline dormant. No new PDF files in queue.'
    },
    translation: {
      id: 'translation',
      name: 'Translation Agent',
      icon: Globe,
      color: 'text-medical-teal',
      glow: 'rgba(13, 242, 201, 0.4)',
      x: 70,
      y: 80,
      status: 'SYNCED',
      activity: 'Multi-language translation library initialized. Supported languages: 5.'
    },
    emergency: {
      id: 'emergency',
      name: 'Emergency Agent',
      icon: AlertTriangle,
      color: 'text-rose-500',
      glow: 'rgba(244, 63, 94, 0.4)',
      x: 50,
      y: 90,
      status: 'SYNCED',
      activity: 'Telemetry node monitor actively listening for emergency SOS signals.'
    }
  };

  const handleTriggerAnalysis = (agentId: string) => {
    setPulseTrigger(true);
    const agent = agents[agentId];
    setSwarmConsole(prev => [
      ...prev,
      `[PING] -> Triggered immediate diagnostics scan for: ${agent.name}`,
      `[${agent.name.toUpperCase()}] -> Processing biometric telemetry buffers...`,
      `[${agent.name.toUpperCase()}] -> Biometric checksum validated. Status: ${agent.status}.`
    ]);

    setTimeout(() => {
      setPulseTrigger(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Interactive Swarm Visualization */}
      <div className="glass-panel p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between items-center relative min-h-[500px]">
        
        <div className="w-full flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-display font-semibold text-white">AI Agent Swarm</h3>
            <p className="text-xs text-slate-400">Interactive live processing map of neural agents</p>
          </div>
          <div className="flex gap-2.5 text-[10px] font-mono">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SYNCED</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-pulse" /> COMPUTING</span>
          </div>
        </div>

        {/* Node Network Map */}
        <div className="relative w-full h-[320px] my-6 z-10">
          
          {/* Connection Lines via SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {/* Center Node coordinates are (50%, 50%) */}
            {Object.values(agents).map((agent) => (
              <g key={agent.id}>
                {/* Static dotted connection */}
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${agent.x}%`}
                  y2={`${agent.y}%`}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Animated signal pulse when triggered */}
                {pulseTrigger && (
                  <motion.line
                    x1="50%"
                    y1="50%"
                    x2={`${agent.x}%`}
                    y2={`${agent.y}%`}
                    stroke={agent.id === selectedAgent ? "#00d2ff" : "rgba(255, 255, 255, 0.15)"}
                    strokeWidth="2.5"
                    strokeDasharray="10 30"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Central AI Health Twin Engine Node */}
          <div 
            className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-16 h-16 rounded-full glass-panel border border-medical-blue/30 flex items-center justify-center cursor-pointer shadow-[0_0_25px_rgba(0,210,255,0.2)] z-20 group"
            onClick={() => handleTriggerAnalysis('cardiac')}
          >
            <div className="absolute inset-0 rounded-full border border-medical-teal/30 scale-125 animate-ping" style={{ animationDuration: '3s' }} />
            <Cpu className="w-6 h-6 text-medical-blue group-hover:rotate-90 transition duration-300" />
          </div>

          {/* Orbital Agent Nodes */}
          {Object.values(agents).map((agent) => {
            const IconComp = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className="absolute -translate-x-[50%] -translate-y-[50%] flex flex-col items-center gap-1 focus:outline-none z-20"
                style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full glass-panel border flex items-center justify-center transition-all duration-300 relative",
                    isSelected 
                      ? 'border-medical-blue bg-slate-900 shadow-[0_0_20px_var(--glow)] scale-110' 
                      : 'border-white/10 hover:border-white/30 hover:scale-105'
                  )}
                  style={{ '--glow': agent.glow } as any}
                >
                  <IconComp className={cn("w-4 h-4", agent.color)} />
                  
                  {/* Computing glowing status dot */}
                  {agent.status === 'COMPUTING' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-medical-blue animate-ping" />
                  )}
                </div>
                <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                  {agent.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 font-mono">
          Click on any node to view active queues and trigger diagnostic runs.
        </p>
      </div>

      {/* Agent details and Command Shell panel */}
      <div className="lg:col-span-2 flex flex-col justify-between glass-panel p-6 rounded-2xl min-h-[500px]">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h4 className="font-display font-bold text-white text-base">
                {agents[selectedAgent].name}
              </h4>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  agents[selectedAgent].status === 'COMPUTING' ? 'bg-medical-blue animate-pulse' : 'bg-emerald-400'
                )} />
                STATUS: {agents[selectedAgent].status}
              </span>
            </div>
            <button
              onClick={() => handleTriggerAnalysis(selectedAgent)}
              className="p-2 bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue border border-medical-blue/20 hover:border-medical-blue/30 rounded-xl transition duration-200"
            >
              <Play className="w-4 h-4 fill-medical-blue" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider">Active Process Task</span>
            <p className="text-xs text-slate-300 bg-white/3 p-3 border border-white/5 rounded-xl leading-relaxed">
              {agents[selectedAgent].activity}
            </p>
          </div>

          {/* Agent Vitals metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Latency Node', val: '12ms' },
              { label: 'Execution Thread', val: 'Worker-07' },
              { label: 'Biomarkers Index', val: '4 active' },
              { label: 'Security Context', val: 'Encrypted' }
            ].map((v, i) => (
              <div key={i} className="bg-white/3 border border-white/5 p-2.5 rounded-xl">
                <p className="text-[10px] text-slate-400 font-mono">{v.label}</p>
                <p className="text-xs font-mono font-bold text-white mt-0.5">{v.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Swarm Console Feed */}
        <div className="pt-4 border-t border-white/5 space-y-2 mt-4">
          <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Live Swarm Console
          </span>
          <div className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-[10px] leading-relaxed text-slate-400 h-32 overflow-y-auto space-y-1 select-text">
            {swarmConsole.slice(-6).map((log, idx) => (
              <div key={idx} className={cn(
                idx === swarmConsole.slice(-6).length - 1 ? 'text-medical-teal font-bold' : ''
              )}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
