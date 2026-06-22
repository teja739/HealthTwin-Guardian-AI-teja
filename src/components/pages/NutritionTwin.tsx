'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, Flame, Sparkles, Upload, 
  DollarSign, Check, ChevronRight, Apple, 
  Activity, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface NutritionProps {
  userProfile: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

export default function NutritionTwin({ userProfile }: NutritionProps) {
  // Food scanning state
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    healthScore: number;
    conflicts: string[];
  } | null>(null);

  // Meal Planner State
  const [budget, setBudget] = useState<'Student' | 'Moderate' | 'Premium'>('Student');
  const [dietPref, setDietPref] = useState<'All' | 'High Protein' | 'Low Carb'>('All');
  const [mealPlan, setMealPlan] = useState<any[] | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Constants
  const dailyGoals = { calories: 2200, protein: 120, carbs: 250, fat: 70 };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      runFoodScan(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      runFoodScan(file.name);
    }
  };

  const runFoodScan = (fileName: string) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      // Simulate OCR/Vision detection based on typical file keywords
      const lowercase = fileName.toLowerCase();
      let foodName = 'Healthy Grain Bowl & Chicken';
      let calories = 580;
      let protein = 42;
      let carbs = 55;
      let fat = 18;
      let healthScore = 92;
      let conflicts: string[] = [];

      if (lowercase.includes('burger') || lowercase.includes('pizza') || lowercase.includes('junk')) {
        foodName = 'Double Cheeseburger with Fries';
        calories = 980;
        protein = 32;
        carbs = 95;
        fat = 46;
        healthScore = 48;
        
        // Check conflicts (e.g. Hypertension & high fat/sodium)
        const hasHypertension = userProfile.conditions.some(c => c.toLowerCase().includes('hypertension'));
        if (hasHypertension) {
          conflicts.push('CRITICAL: High sodium (1450mg) exceeds Hypertension threshold.');
        }
      } else if (lowercase.includes('oat') || lowercase.includes('porridge') || lowercase.includes('egg')) {
        foodName = 'Oatmeal with Blueberries & Scrambled Eggs';
        calories = 420;
        protein = 24;
        carbs = 48;
        fat = 12;
        healthScore = 96;
      }

      // Check allergies
      userProfile.allergies.forEach(allergy => {
        if (foodName.toLowerCase().includes(allergy.toLowerCase())) {
          conflicts.push(`ALLERGY SHIELD ACTIVE: Detected ${allergy} match!`);
        }
      });

      setScanResult({ foodName, calories, protein, carbs, fat, healthScore, conflicts });
      setIsScanning(false);

      logToSplunk('nutrition_twin', {
        action: 'food_image_scanned',
        fileName,
        detectedFood: foodName,
        calories,
        protein,
        carbs,
        fat,
        healthScore,
        conflictsCount: conflicts.length
      }, { severity: conflicts.length > 0 ? 'Critical' : 'Success' });

    }, 1200);
  };

  const generateMealPlan = () => {
    setPlannerLoading(true);
    setMealPlan(null);

    setTimeout(() => {
      let plans = [];

      if (budget === 'Student') {
        plans = [
          {
            meal: 'Breakfast',
            name: 'High-Protein Oats & Scrambled Eggs',
            ingredients: '1 cup Oats, 3 Whole Eggs, Blueberries, Honey',
            cost: '$1.80',
            calories: 520,
            protein: 30,
            carbs: 58,
            fat: 14
          },
          {
            meal: 'Lunch',
            name: 'Lean Chicken Breast & White Rice Bowl',
            ingredients: '150g Grilled Chicken Breast, 1.5 cups Jasmine Rice, Steamed Broccoli',
            cost: '$2.90',
            calories: 620,
            protein: 48,
            carbs: 72,
            fat: 8
          },
          {
            meal: 'Snack',
            name: 'Greek Yogurt & Almond Mix',
            ingredients: '150g Non-fat Greek Yogurt, 15g Almonds',
            cost: '$1.20',
            calories: 210,
            protein: 18,
            carbs: 12,
            fat: 9
          },
          {
            meal: 'Dinner',
            name: 'Canned Tuna Fried Rice',
            ingredients: '1 can Chunk Light Tuna, 1 cup Brown Rice, Mixed Veggies, Soy sauce',
            cost: '$2.10',
            calories: 540,
            protein: 38,
            carbs: 60,
            fat: 12
          }
        ];
      } else {
        plans = [
          {
            meal: 'Breakfast',
            name: 'Avocado Toast with Smoked Salmon & Poached Eggs',
            ingredients: 'Sourdough slice, 1/2 Avocado, 50g Smoked Salmon, 2 Eggs',
            cost: '$6.50',
            calories: 580,
            protein: 32,
            carbs: 34,
            fat: 26
          },
          {
            meal: 'Lunch',
            name: 'Pan-seared Salmon with Quinoa & Asparagus',
            ingredients: '150g Atlantic Salmon, 1 cup Red Quinoa, Grilled Asparagus',
            cost: '$8.20',
            calories: 680,
            protein: 44,
            carbs: 48,
            fat: 28
          },
          {
            meal: 'Dinner',
            name: 'Grass-fed Beef Steak & Roasted Sweet Potatoes',
            ingredients: '200g New York Strip, Roasted Sweet Potato wedges, Sautéed Spinach',
            cost: '$12.00',
            calories: 780,
            protein: 56,
            carbs: 45,
            fat: 32
          }
        ];
      }

      setMealPlan(plans);
      setPlannerLoading(false);

      logToSplunk('nutrition_twin', {
        action: 'meal_plan_generated',
        budgetTier: budget,
        dietaryPreference: dietPref,
        mealsCount: plans.length
      }, { severity: 'Success' });

    }, 1000);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Apple className="w-5 h-5 text-medical-teal" />
            AI Nutrition Twin & Meal Planner
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze food photos for macronutrients and generate budget student-friendly diets synced with your health goals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Photo Scanner & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
              <Upload className="w-4 h-4 text-medical-blue" /> Upload Meal Photo
            </h3>

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer",
                dragActive ? "border-medical-blue bg-medical-blue/5" : "border-white/10 bg-white/2 hover:border-white/20"
              )}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Drag & drop or Click to upload</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP</p>
                </div>
              </label>
            </div>

            {/* Scanning loader */}
            {isScanning && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-6">
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-medical-blue animate-spin" />
                <span>Running Nutrition Vision OCR...</span>
              </div>
            )}

            {/* Scanner results */}
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className={cn("p-4 rounded-xl border flex items-center justify-between", getHealthScoreColor(scanResult.healthScore))}>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Detected Nutrition Intake</h4>
                    <p className="text-sm font-bold text-white mt-0.5">{scanResult.foodName}</p>
                  </div>
                  <div className="text-center font-display">
                    <span className="text-2xl font-extrabold">{scanResult.healthScore}</span>
                    <span className="text-[9px] block uppercase tracking-wider opacity-60">Score</span>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Calories', val: scanResult.calories, unit: 'kcal' },
                    { label: 'Protein', val: scanResult.protein, unit: 'g' },
                    { label: 'Carbs', val: scanResult.carbs, unit: 'g' },
                    { label: 'Fat', val: scanResult.fat, unit: 'g' }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-white/3 border border-white/5 p-2 rounded-lg text-center text-xs">
                      <p className="text-[9px] text-slate-500">{m.label}</p>
                      <p className="font-bold text-white mt-0.5">{m.val}{m.unit}</p>
                    </div>
                  ))}
                </div>

                {/* Warnings / Conflicts */}
                {scanResult.conflicts.map((c, i) => (
                  <div key={i} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 flex items-start gap-2 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Macro Goals & Smart Meal Planner */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Macro Progress Bars */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-white/5">
              <Activity className="w-4 h-4 text-medical-teal" /> Daily Macro Goal Tracker
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Calories Logged', goal: dailyGoals.calories, logged: scanResult ? scanResult.calories : 1450, unit: 'kcal', color: 'bg-medical-blue' },
                { label: 'Protein Target', goal: dailyGoals.protein, logged: scanResult ? scanResult.protein : 85, unit: 'g', color: 'bg-medical-teal' },
                { label: 'Carbs Target', goal: dailyGoals.carbs, logged: scanResult ? scanResult.carbs : 180, unit: 'g', color: 'bg-indigo-500' },
                { label: 'Fat Limit', goal: dailyGoals.fat, logged: scanResult ? scanResult.fat : 42, unit: 'g', color: 'bg-amber-500' }
              ].map((item, idx) => {
                const pct = Math.min((item.logged / item.goal) * 100, 100);
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                      <span className="text-white font-bold">{item.logged} / {item.goal} {item.unit}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Budget Meal Planner */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-medical-teal" /> Smart Student Meal Planner
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Budget-friendly healthy diets based on eggs, oats, chicken, and rice.</p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Budget Tier</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as any)}
                  className="glass-input w-full px-3 py-2 mt-1 bg-slate-950"
                >
                  <option value="Student">Student Budget (Cheap)</option>
                  <option value="Moderate">Moderate Budget</option>
                  <option value="Premium">Premium Ingredients</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dietary Plan</label>
                <select
                  value={dietPref}
                  onChange={(e) => setDietPref(e.target.value as any)}
                  className="glass-input w-full px-3 py-2 mt-1 bg-slate-950"
                >
                  <option value="All">Balanced Diet</option>
                  <option value="High Protein">High Protein</option>
                  <option value="Low Carb">Low Carb</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateMealPlan}
              disabled={plannerLoading}
              className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition"
            >
              {plannerLoading ? 'Compiling Diet Curves...' : 'Generate Daily Meal Plan'}
            </button>

            {/* Meal Plan outputs */}
            {mealPlan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {mealPlan.map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-white/3 border border-white/5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-medical-blue font-bold font-mono uppercase tracking-wider">{m.meal}</span>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">{m.cost} est.</span>
                    </div>
                    <h4 className="font-bold text-white leading-snug">{m.name}</h4>
                    <p className="text-[10px] text-slate-400 italic leading-snug">{m.ingredients}</p>
                    
                    <div className="flex gap-4 pt-1.5 text-[9px] text-slate-500 font-mono">
                      <span>Cal: {m.calories} kcal</span>
                      <span>P: {m.protein}g</span>
                      <span>C: {m.carbs}g</span>
                      <span>F: {m.fat}g</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
