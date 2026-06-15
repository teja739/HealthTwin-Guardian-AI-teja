'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
import LandingPage from '@/components/LandingPage';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

type AppState = 'landing' | 'signing-in' | 'onboarding' | 'dashboard';

export default function Page() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn, signOut } = useClerk();
  const [appState, setAppState] = useState<AppState>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Sync auth state with AppState
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      try {
        const saved = localStorage.getItem('healthtwin_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Check if it belongs to the signed-in user
          if (parsed.email === user.primaryEmailAddress?.emailAddress) {
            setUserProfile(parsed);
            setAppState('dashboard');
            return;
          }
        }
        // If no matching profile session found, proceed to onboarding
        setAppState('onboarding');
      } catch {
        setAppState('onboarding');
      }
    } else {
      setUserProfile(null);
      setAppState('landing');
    }
  }, [isLoaded, isSignedIn, user]);

  const handleGetStarted = () => {
    setAppState('signing-in');
    try {
      openSignIn();
    } catch (err) {
      console.error('Failed to open Clerk sign-in:', err);
      // Fallback
      setAppState('landing');
    }
  };

  const handleOnboardingComplete = (profile: any) => {
    setUserProfile(profile);
    setAppState('dashboard');
    try {
      localStorage.setItem('healthtwin_session', JSON.stringify(profile));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('healthtwin_session');
      setUserProfile(null);
      await signOut();
    } catch (err) {
      console.error('Failed to log out with Clerk:', err);
    }
  };

  // Show a premium glassmorphic loader while checking Clerk auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-medical-blue animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white">Loading HealthTwin</h3>
            <p className="text-xs text-slate-400 mt-1">Initializing secure credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {appState === 'landing' && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingPage onGetStarted={handleGetStarted} />
        </motion.div>
      )}

      {appState === 'signing-in' && (
        <motion.div
          key="signing-in"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-background flex items-center justify-center"
        >
          <div className="text-center space-y-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-medical-blue animate-spin mx-auto" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-white">Opening Secure Sign-In</h3>
              <p className="text-xs text-slate-400 mt-1">Please log in to your account...</p>
            </div>
          </div>
        </motion.div>
      )}

      {appState === 'onboarding' && user && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Onboarding
            onComplete={handleOnboardingComplete}
            userName={user.fullName || user.username || 'User'}
            userEmail={user.primaryEmailAddress?.emailAddress || ''}
          />
        </motion.div>
      )}

      {appState === 'dashboard' && userProfile && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard userProfile={userProfile} onLogout={handleLogout} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
