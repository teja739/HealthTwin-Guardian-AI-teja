'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, Activity, Brain, FileText,
  Scan, Shield, Users, Globe, AlertTriangle, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Database,
  Calendar, Plane, Heart, Smile, Clock, Utensils, FolderLock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';

import Home from './pages/Home';
import MissionControl from './pages/MissionControl';
import BodyMap from './pages/BodyMap';
import AgentSwarm from './pages/AgentSwarm';
import ReportAnalyzer from './pages/ReportAnalyzer';
import MedicineScanner from './pages/MedicineScanner';
import SafetyCenter from './pages/SafetyCenter';
import FamilyHealth from './pages/FamilyHealth';
import Assistant from './pages/Assistant';
import EmergencyMode from './pages/EmergencyMode';
import SplunkDashboard from './pages/SplunkDashboard';
import Appointments from './pages/Appointments';
import TravelAssistant from './pages/TravelAssistant';
import WellnessTracker from './pages/WellnessTracker';
import TimeMachine from './pages/TimeMachine';
import MentalHealth from './pages/MentalHealth';
import NutritionTwin from './pages/NutritionTwin';
import HealthVault from './pages/HealthVault';

interface DashboardProps {
  userProfile: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    onboardingComplete: boolean;
  };
  onLogout: () => void;
  isOffline?: boolean;
}

export default function Dashboard({ userProfile, onLogout, isOffline }: DashboardProps) {
  const [activePage, setActivePage] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [elderlyMode, setElderlyMode] = useState(false);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timemachine', label: 'Health Time Machine', icon: Clock },
    { id: 'mentalhealth', label: 'Emotion Twin', icon: Heart },
    { id: 'nutrition', label: 'Nutrition Twin', icon: Utensils },
    { id: 'vault', label: 'Health Vault', icon: FolderLock },
    { id: 'appointments', label: 'Book Appointments', icon: Calendar },
    { id: 'travel', label: 'Travel Assistant', icon: Plane },
    { id: 'wellness', label: 'Wellness Tracker', icon: Activity },
    { id: 'bodymap', label: 'Body Risk Map', icon: Activity },
    { id: 'scanner', label: 'Medicine Scanner', icon: Scan },
    { id: 'safety', label: 'Safety Center', icon: Shield },
    { id: 'family', label: 'Family Health', icon: Users },
    { id: 'assistant', label: 'AI Assistant', icon: Globe },
    { id: 'mission', label: 'Mission Control', icon: Target },
    { id: 'agents', label: 'AI Agent Swarm', icon: Brain },
    { id: 'reports', label: 'Report Analyzer', icon: FileText },
    { id: 'splunk', label: 'Splunk Observability', icon: Database },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <Home userProfile={userProfile} />;
      case 'timemachine': return <TimeMachine userProfile={userProfile} />;
      case 'mentalhealth': return <MentalHealth userProfile={userProfile} />;
      case 'nutrition': return <NutritionTwin userProfile={userProfile} />;
      case 'vault': return <HealthVault />;
      case 'appointments': return <Appointments userProfile={userProfile} />;
      case 'travel': return <TravelAssistant userProfile={userProfile} />;
      case 'wellness': return <WellnessTracker userProfile={userProfile} />;
      case 'mission': return <MissionControl />;
      case 'bodymap': return <BodyMap userProfile={userProfile} />;
      case 'agents': return <AgentSwarm />;
      case 'reports': return <ReportAnalyzer userProfile={userProfile} />;
      case 'scanner': return <MedicineScanner userProfile={userProfile} />;
      case 'safety': return <SafetyCenter />;
      case 'family': return <FamilyHealth userProfile={userProfile} />;
      case 'assistant': return <Assistant userProfile={userProfile} />;
      case 'splunk': return <SplunkDashboard />;
      case 'emergency': return <EmergencyMode userProfile={userProfile} />;
      default: return <Home userProfile={userProfile} />;
    }
  };

  const currentPageTitle = activePage === 'emergency' 
    ? 'Emergency Mode' 
    : navItems.find(n => n.id === activePage)?.label || 'Dashboard';

  return (
    <div className={cn("min-h-screen bg-background flex", elderlyMode && "elderly-mode")}>
      {elderlyMode && (
        <style dangerouslySetInnerHTML={{__html: `
          .elderly-mode {
            font-size: 125% !important;
          }
          .elderly-mode button, .elderly-mode select, .elderly-mode input, .elderly-mode textarea {
            font-size: 115% !important;
            padding-top: 0.8rem !important;
            padding-bottom: 0.8rem !important;
          }
          .elderly-mode h1 { font-size: 2.2rem !important; }
          .elderly-mode h2 { font-size: 1.8rem !important; }
          .elderly-mode h3 { font-size: 1.4rem !important; }
          .elderly-mode p, .elderly-mode span, .elderly-mode td, .elderly-mode li {
            font-size: 1.1rem !important;
            line-height: 1.7 !important;
          }
          .elderly-mode .glass-panel {
            border-width: 1.5px !important;
            border-color: rgba(255, 255, 255, 0.18) !important;
          }
        `}} />
      )}
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-white/5 bg-slate-950/80 transition-all duration-300 h-screen sticky top-0",
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="HealthTwin Logo" className="w-7 h-7 object-contain shrink-0 rounded-lg" />
              <span className="font-display font-bold text-sm text-white tracking-tight">HealthTwin</span>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/logo.png" alt="HealthTwin Logo" className="w-7 h-7 object-contain mx-auto rounded-lg" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("p-1 rounded-md hover:bg-white/5 text-slate-500 transition", sidebarCollapsed && "mx-auto mt-2")}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? 'bg-white/8 text-white border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                  sidebarCollapsed && 'justify-center px-0'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <IconComp className={cn("w-4 h-4 shrink-0", isActive && 'text-medical-blue')} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Emergency + Profile at Bottom */}
        <div className="p-2 space-y-1.5 border-t border-white/5">
          <button
            onClick={() => setElderlyMode(!elderlyMode)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
              elderlyMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            <Smile className="w-4 h-4 shrink-0 text-amber-400" />
            {!sidebarCollapsed && <span>Elderly Care: {elderlyMode ? 'ON' : 'OFF'}</span>}
          </button>

          <button
            onClick={() => setActivePage('emergency')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
              activePage === 'emergency'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-rose-500 hover:bg-rose-500/10',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Emergency SOS</span>}
          </button>

          <div className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 border border-white/5",
            sidebarCollapsed && 'justify-center px-1.5'
          )}>
            <div className="shrink-0 flex items-center justify-center">
              {isOffline ? (
                <div className="w-7 h-7 rounded-full bg-medical-blue/20 border border-medical-blue/30 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                  {userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              ) : (
                <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{userProfile.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button onClick={onLogout} className="p-1 rounded-md hover:bg-white/5 text-slate-500 transition">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav / Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="HealthTwin Logo" className="w-7 h-7 object-contain rounded-lg" />
          <span className="font-display font-bold text-sm text-white">{currentPageTitle}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-white/5 border border-white/10">
          {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Mobile Slide-Over Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[260px] bg-slate-950 border-l border-white/5 p-4 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-14 space-y-0.5">
                {navItems.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition",
                        activePage === item.id ? 'bg-white/8 text-white' : 'text-slate-400'
                      )}
                    >
                      <IconComp className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setActivePage('emergency'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Emergency SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen lg:p-6 p-4 pt-16 lg:pt-6 overflow-x-hidden">
        {/* Top bar for desktop */}
        <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-xl font-display font-bold text-white">{currentPageTitle}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              7 Agents Online
            </div>
          </div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
