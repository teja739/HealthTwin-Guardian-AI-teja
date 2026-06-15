'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Search, Play, HelpCircle, 
  BarChart2, FileText, Bot, Shield, 
  Settings, ChevronRight, Activity, 
  AlertTriangle, CheckCircle, Database, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';
import {
  ResponsiveContainer, BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell
} from 'recharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function SplunkDashboard() {
  const [activeTab, setActiveTab] = useState<'search' | 'visuals' | 'guide'>('search');
  const [searchQuery, setSearchQuery] = useState('index=healthtwin');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0);

  // AI Agent state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your Splunk AI Observability Agent. I have parsed your HealthTwin logs and can summarize biometric trends, safety checks, or system status. Ask me anything!"
    }
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Setup XML Copy State
  const [copied, setCopied] = useState(false);

  // Recharts metric summary state
  const [metricsData, setMetricsData] = useState<{
    logVolume: { name: string; count: number }[];
    heartRateTrend: { _time: string; value: number }[];
    severityShare: { name: string; value: number; color: string }[];
  }>({
    logVolume: [],
    heartRateTrend: [],
    severityShare: []
  });

  const splTemplates = [
    { label: 'All Logs', query: 'index=healthtwin' },
    { label: 'Biometric Telemetry', query: 'index=healthtwin sourcetype=biometric_telemetry' },
    { label: 'Drug Scan Violations', query: 'index=healthtwin sourcetype=medicine_scan hasConflicts=true' },
    { label: 'Emergency Triggers', query: 'index=healthtwin sourcetype=emergency_sos' },
    { label: 'Agent Diagnostics', query: 'index=healthtwin sourcetype=agent_diagnostics' },
    { label: 'Severity Count', query: 'index=healthtwin | stats count by severity' }
  ];

  // Run Search Query
  const handleSearch = async (queryToRun = searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/splunk/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.results || []);
        setSearchCount(data.count || 0);
        calculateDashboardMetrics(data.results || []);
      }
    } catch (err) {
      console.error('Splunk Query API failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Process logs to generate Recharts graphs
  const calculateDashboardMetrics = (allLogs: any[]) => {
    // 1. Log Volume by Sourcetype
    const sourcetypeCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = { info: 0, success: 0, warning: 0, high: 0, critical: 0 };
    const hrTrend: { _time: string; value: number }[] = [];

    allLogs.forEach((log: any) => {
      const st = log.sourcetype || 'unknown';
      sourcetypeCounts[st] = (sourcetypeCounts[st] || 0) + 1;

      const sev = String(log.event?.severity || 'Info').toLowerCase();
      if (sev in severityCounts) {
        severityCounts[sev]++;
      } else {
        severityCounts['info']++;
      }

      // If biometric, capture heartRate
      if (st === 'biometric_telemetry' && log.event?.heartRate) {
        const date = new Date(log.time);
        hrTrend.push({
          _time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Number(log.event.heartRate)
        });
      }
    });

    const logVolume = Object.entries(sourcetypeCounts).map(([name, count]) => ({
      name: name.replace('biometric_telemetry', 'Telemetry').replace('medicine_scan', 'Meds Scan').replace('emergency_sos', 'SOS Alert').replace('security_access', 'Security').replace('agent_diagnostics', 'AI Swarm'),
      count
    }));

    const severityShare = [
      { name: 'Info / Success', value: severityCounts.info + severityCounts.success, color: '#00d2ff' },
      { name: 'Warnings', value: severityCounts.warning, color: '#f59e0b' },
      { name: 'Criticals / SOS', value: severityCounts.high + severityCounts.critical, color: '#ef4444' }
    ].filter(item => item.value > 0);

    setMetricsData({
      logVolume,
      heartRateTrend: hrTrend.reverse().slice(-10), // last 10 points
      severityShare
    });
  };

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, []);

  // Scroll chat window to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle AI Agent chat
  const handleAgentChat = async () => {
    if (!chatInput.trim() || isAgentTyping) return;
    const userText = chatInput;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAgentTyping(true);

    try {
      const response = await fetch('/api/splunk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      if (response.ok) {
        const data = await response.json();
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content };
        setChatMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('AI Agent request failed');
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I am having trouble reading the logs index right now. Please check if your Google Gemini API key is configured correctly." }
      ]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  // Copy Splunk XML Source
  const copyXML = () => {
    const xml = `<dashboard theme="dark">
  <label>HealthTwin Guardian AI Observability</label>
  <row>
    <panel>
      <title>Emergency Alerts & SOS Actions</title>
      <single>
        <search>
          <query>index=healthtwin sourcetype=emergency_sos action=emergency_alerts_broadcasted | stats count</query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
        </search>
        <option name="colorMode">block</option>
        <option name="rangeColors">["0x53a051","0xdc4e41"]</option>
        <option name="rangeValues">[0]</option>
        <option name="useColors">1</option>
      </single>
    </panel>
    <panel>
      <title>Medicine Conflict Violations</title>
      <single>
        <search>
          <query>index=healthtwin sourcetype=medicine_scan hasConflicts=true | stats count</query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
        </search>
        <option name="colorMode">block</option>
        <option name="rangeColors">["0x53a051","0xf8be34","0xdc4e41"]</option>
        <option name="rangeValues">[0,2]</option>
        <option name="useColors">1</option>
      </single>
    </panel>
  </row>
  <row>
    <panel>
      <chart>
        <title>Biometric Heart Rate Telemetry Trend</title>
        <search>
          <query>index=healthtwin sourcetype=biometric_telemetry | timechart span=5m avg(heartRate)</query>
          <earliest>-4h@h</earliest>
          <latest>now</latest>
        </search>
        <option name="charting.chart">line</option>
      </chart>
    </panel>
  </row>
</dashboard>`;
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      
      {/* Search & Dashboard Section (Left 3 columns) */}
      <div className="xl:col-span-3 flex flex-col justify-between glass-panel rounded-2xl overflow-hidden h-full">
        
        {/* Navigation Tabs */}
        <div className="bg-slate-950/80 px-6 py-4 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-medical-blue/20 border border-medical-blue/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-medical-blue" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Splunk Observability Engine</h4>
              <p className="text-[10px] text-slate-500 font-mono">Index: healthtwin · status=connected</p>
            </div>
          </div>

          <div className="flex gap-1.5 p-1 rounded-lg bg-white/5 border border-white/5">
            {[
              { id: 'search', label: 'SPL Search Console', icon: Search },
              { id: 'visuals', label: 'Visual Analytics', icon: BarChart2 },
              { id: 'guide', label: 'Splunk Setup & XML', icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] rounded-lg transition duration-200",
                  activeTab === tab.id 
                    ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <div className="space-y-5 h-full flex flex-col">
              
              {/* SPL Command Line */}
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs font-bold">&gt;</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="glass-input font-mono text-xs w-full pl-8 pr-4 py-3 bg-slate-950/60"
                    placeholder="Enter SPL query (e.g. index=healthtwin severity=High)"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="px-5 py-3 rounded-xl bg-medical-blue/20 border border-medical-blue/30 hover:bg-medical-blue/30 text-medical-blue text-xs font-mono font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? 'SEARCHING...' : 'RUN'}
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {splTemplates.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(t.query);
                      handleSearch(t.query);
                    }}
                    className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-white/3 border border-white/5 text-slate-400 hover:text-white hover:border-white/12 transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Event Feed table */}
              <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-[300px]">
                <div className="px-4 py-2 bg-slate-950 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Showing {searchCount} matching events</span>
                  <span>Splunk Web Console Emulator</span>
                </div>
                <div className="flex-1 overflow-auto max-h-[320px] divide-y divide-white/5 font-mono text-[10px] leading-relaxed">
                  {logs.length > 0 ? (
                    logs.map((log, index) => {
                      const sev = String(log.event?.severity || 'Info').toUpperCase();
                      return (
                        <div key={index} className="p-3 hover:bg-white/3 flex flex-col md:flex-row gap-3">
                          <span className="text-slate-500 shrink-0 select-none md:w-36">
                            {new Date(log.time).toLocaleString()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0",
                                sev === 'CRITICAL' || sev === 'HIGH' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                sev === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                sev === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                'bg-white/5 border-white/10 text-slate-400'
                              )}>
                                {sev}
                              </span>
                              <span className="text-medical-blue font-bold">{log.sourcetype}</span>
                              <span className="text-slate-600">host={log.host}</span>
                            </div>
                            <pre className="text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap select-text">
                              {JSON.stringify(log.event, null, 2)}
                            </pre>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-slate-500 py-10 space-y-2">
                      <Terminal className="w-8 h-8 text-slate-600" />
                      <p>No matching logs found in this index/timeframe.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VISUALS TAB */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
              
              {/* Telemetry quick metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-semibold uppercase">
                    <span>Active Telemetry Index</span>
                    <Activity className="w-4.5 h-4.5 text-medical-blue" />
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-white">88/100</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Calculated from 5 bio vectors</p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-semibold uppercase">
                    <span>Log Ingestion Rate</span>
                    <Database className="w-4.5 h-4.5 text-medical-teal" />
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-white">{searchCount} Events</h3>
                  <p className="text-[10px] text-slate-500 font-mono">HEC pipeline operational</p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-1 border-rose-500/10">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-semibold uppercase">
                    <span>Critical Alert Triggers</span>
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-white">
                    {logs.filter(l => String(l.event?.severity).toLowerCase() === 'critical' || String(l.event?.severity).toLowerCase() === 'high').length} Issues
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">SOS & scan safety violations</p>
                </div>
              </div>

              {/* Recharts Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Log Volume by Sourcetype */}
                <div className="bg-white/2 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">Log Ingestion by Sourcetype</h4>
                  <div className="w-full h-52">
                    {metricsData.logVolume.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metricsData.logVolume}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                          <YAxis stroke="#94a3b8" fontSize={9} />
                          <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)' }} labelStyle={{ fontSize: 10, color: 'white' }} itemStyle={{ fontSize: 10 }} />
                          <Bar dataKey="count" fill="#00d2ff" radius={[4, 4, 0, 0]}>
                            {metricsData.logVolume.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00d2ff' : '#0df2c9'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500">No data to display. Run vitals sync or medicine scan first.</div>
                    )}
                  </div>
                </div>

                {/* 2. Heart Rate Telemetry Trend */}
                <div className="bg-white/2 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">Biometric Vitals Stream (HR)</h4>
                  <div className="w-full h-52">
                    {metricsData.heartRateTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData.heartRateTrend}>
                          <XAxis dataKey="_time" stroke="#94a3b8" fontSize={9} />
                          <YAxis stroke="#94a3b8" fontSize={9} domain={[50, 100]} />
                          <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)' }} labelStyle={{ fontSize: 10, color: 'white' }} itemStyle={{ fontSize: 10 }} />
                          <Line type="monotone" dataKey="value" stroke="#ff3f5e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="BPM" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500">No biometric telemetry events detected. Trigger "Sync Vitals" on Dashboard.</div>
                    )}
                  </div>
                </div>

                {/* 3. Severity Distribution (Pie) */}
                <div className="bg-white/2 border border-white/5 p-5 rounded-2xl space-y-3 lg:col-span-2">
                  <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">System Safety Alert Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="w-full h-44">
                      {metricsData.severityShare.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={metricsData.severityShare}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={65}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {metricsData.severityShare.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">No events log indexed.</div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {metricsData.severityShare.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/2 border border-white/5 p-2 rounded-xl text-xs">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 flex-1">{item.name}</span>
                          <span className="font-mono font-bold text-white">{item.value} logs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* GUIDE TAB */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-2">
                <h3 className="text-base font-display font-bold text-white">How to connect live Splunk Cloud HEC</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To stream live security audits, AI diagnostic runs, drug conflict scans, and emergency telemetry directly into your Splunk instance, follow this setup:
                </p>
              </div>

              <div className="space-y-4 font-mono text-[11px] text-slate-300">
                <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-2">
                  <p className="text-medical-teal font-semibold">1. Create a Custom Index</p>
                  <p>In Splunk, go to Settings &gt; Indexes &gt; New Index. Name the index <strong className="text-white">"healthtwin"</strong> and set type to Events.</p>
                </div>
                <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-2">
                  <p className="text-medical-teal font-semibold">2. Enable HTTP Event Collector (HEC)</p>
                  <p>Go to Settings &gt; Data Inputs &gt; HTTP Event Collector. Click HEC Global Settings, click Enabled, and save.</p>
                </div>
                <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-2">
                  <p className="text-medical-teal font-semibold">3. Create HEC Token</p>
                  <p>Create a New Token named <strong className="text-white">"HealthTwin"</strong>. Set source type to automatic, assign index <strong className="text-white">"healthtwin"</strong>, and save the generated token string.</p>
                </div>
                <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-2">
                  <p className="text-medical-teal font-semibold">4. Configure App environment variables</p>
                  <p>Add these keys to your <strong className="text-white">.env.local</strong> file inside the project:</p>
                  <pre className="text-medical-blue font-bold mt-1 select-text">
{`SPLUNK_HEC_URL=https://http-inputs-[YOUR_STACK].splunkcloud.com/services/collector
SPLUNK_HEC_TOKEN=[PASTE_YOUR_HEC_TOKEN_HERE]`}
                  </pre>
                </div>
              </div>

              <div className="space-y-3 pt-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Splunk Web Dashboard XML Configuration</h3>
                  <button 
                    onClick={copyXML}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-medical-blue/10 border border-medical-blue/20 text-medical-blue text-[10px] hover:bg-medical-blue/20 transition duration-200"
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5" /> COPIED</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> COPY XML SOURCE</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Paste the XML configuration below into the "Source" tab of a new dashboard inside your Splunk workspace to instantly populate graphs for patient heart rates, drug safety conflicts, and live logs.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-[10px] max-h-60 overflow-y-auto leading-normal text-slate-400 select-text">
                  <pre>{`<dashboard theme="dark">
  <label>HealthTwin Guardian AI Observability</label>
  <row>
    <panel>
      <title>Emergency Alerts & SOS Actions</title>
      <single>
        <search>
          <query>index=healthtwin sourcetype=emergency_sos action=emergency_alerts_broadcasted | stats count</query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
        </search>
        ...
      </single>
    </panel>
  </row>
</dashboard>`}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Obs pipeline: active · buffer=1000 logs max</span>
          <span>HealthTwin Guardian Engine</span>
        </div>

      </div>

      {/* Splunk AI Observability Agent (Right 1 column) */}
      <div className="xl:col-span-1 glass-panel rounded-2xl flex flex-col overflow-hidden h-full">
        
        {/* Chat header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-medical-blue/20 border border-medical-blue/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-medical-blue" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Splunk AI Agent</h4>
              <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                INDEX: logs-active
              </span>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[85%] p-3 rounded-xl text-[10px] leading-relaxed",
                msg.role === 'user'
                  ? 'bg-medical-blue/20 border border-medical-blue/30 text-white rounded-br-none'
                  : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-none'
              )}>
                <div className="prose prose-invert prose-xs select-text">
                  {msg.content.split('\n').map((para, i) => (
                    <p key={i} className="mb-1.5 last:mb-0 leading-normal">{para}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {isAgentTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-xl rounded-bl-none p-3 text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-3 border-t border-white/5 bg-slate-950/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAgentChat()}
              placeholder="Ask Splunk Agent..."
              className="glass-input flex-1 px-3 py-2 text-[10px] bg-slate-900"
            />
            <button
              onClick={handleAgentChat}
              disabled={!chatInput.trim() || isAgentTyping}
              className="p-2 rounded-lg bg-medical-blue/20 border border-medical-blue/30 hover:bg-medical-blue/30 text-medical-blue transition disabled:opacity-30 flex items-center justify-center shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
