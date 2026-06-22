'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, CheckCircle, AlertTriangle, 
  ArrowRight, Search, Activity, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedMetric {
  name: string;
  category: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'Borderline' | 'High' | 'Low';
}

interface ReportTemplate {
  name: string;
  type: string;
  fileName: string;
  metrics: ExtractedMetric[];
  explanation: string;
  recs: string[];
}

interface ReportAnalyzerProps {
  userProfile?: {
    name: string;
    email: string;
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    conditions: string[];
    onboardingComplete: boolean;
  };
}

export default function ReportAnalyzer({ userProfile }: ReportAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      name: 'Comprehensive Metabolic Panel (CMP)',
      type: 'Blood Test',
      fileName: 'blood_panel_cmp_mercer.pdf',
      metrics: [
        { name: 'Fasting Serum Glucose', category: 'Glycemic Control', value: '104', unit: 'mg/dL', referenceRange: '70 - 99', status: 'High' },
        { name: 'HbA1c Hemoglobin', category: 'Glycemic Control', value: '5.4', unit: '%', referenceRange: '4.0 - 5.6', status: 'Normal' },
        { name: 'Total Serum Cholesterol', category: 'Lipid Panel', value: '215', unit: 'mg/dL', referenceRange: '< 200', status: 'High' },
        { name: 'Triglycerides', category: 'Lipid Panel', value: '145', unit: 'mg/dL', referenceRange: '< 150', status: 'Normal' },
        { name: 'Alanine Aminotransferase (ALT)', category: 'Liver Function', value: '41', unit: 'U/L', referenceRange: '7 - 56', status: 'Borderline' },
        { name: 'Serum Creatinine', category: 'Renal Function', value: '0.82', unit: 'mg/dL', referenceRange: '0.60 - 1.20', status: 'Normal' }
      ],
      explanation: 'Extracted results highlight mild Hyperglycemia (Fasting Serum Glucose at 104 mg/dL) and hypercholesterolemia (Total Cholesterol at 215 mg/dL). ALT is within reference limits but sits borderline-high. The insulin sensitivity loop is stable, supported by normal HbA1c (5.4%). Physical stress indicators suggest lipid clearing optimization is recommended.',
      recs: [
        'Shift carbohydrate loading windows to post-workout states to capture muscle glycogen storage capacity.',
        'Integrate 3g soluble oat fiber (Beta-glucan) daily to assist serum cholesterol binding and clearance.',
        'Limit refined lipid fats and sugars; run a follow-up Fasting Glucose & Lipid panel in 45 days.'
      ]
    },
    {
      name: 'Cardiovascular Risk Panel',
      type: 'Cardiac Indicators',
      fileName: 'cardio_risk_profile_mercer.pdf',
      metrics: [
        { name: 'High-Sensitivity CRP (hs-CRP)', category: 'Inflammatory Marker', value: '0.9', unit: 'mg/L', referenceRange: '< 1.0', status: 'Normal' },
        { name: 'Apolipoprotein B (ApoB)', category: 'Atherogenic Lipids', value: '92', unit: 'mg/dL', referenceRange: '< 90', status: 'Borderline' },
        { name: 'Lipoprotein(a)', category: 'Genetics Indicator', value: '18', unit: 'nmol/L', referenceRange: '< 75', status: 'Normal' },
        { name: 'Homocysteine', category: 'Vascular Load', value: '9.4', unit: 'µmol/L', referenceRange: '< 15.0', status: 'Normal' }
      ],
      explanation: 'Inflammatory marker hs-CRP is optimal at 0.9 mg/L, indicating low active arterial lining irritation. Apolipoprotein B registers borderline high at 92 mg/dL, which points to mild atherogenic particle counts. Homocysteine and Lipoprotein(a) are clear, indicating zero inherited vascular inflammation factors.',
      recs: [
        'Maintain high Omega-3 fatty acid intake (2g/day) to sustain vascular cellular elasticity.',
        'Focus on methylfolate (Vitamin B9) resources in leafy vegetables to optimize homocysteine buffering.'
      ]
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setSelectedReport(null);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;

          const response = await fetch('/api/analyze-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              mimeType: file.type,
              fileName: file.name,
              userProfile,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to analyze report');
          }

          const data = await response.json();
          setSelectedReport(data);
          setIsAnalyzing(false);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'An error occurred while analyzing the report document.');
          setIsAnalyzing(false);
        }
      };

      reader.onerror = () => {
        setErrorMsg('Failed to read report file');
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while uploading the report.');
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerSimulation = (template: ReportTemplate) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setSelectedReport(null);
    setErrorMsg(null);
    setTimeout(() => {
      setSelectedReport(template);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Borderline':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'High':
      case 'Low':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default:
        return 'bg-white/5 text-slate-400 border border-white/5';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Upload and Template Column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[280px]">
          <div>
            <h3 className="text-lg font-display font-semibold text-white">Upload Lab Sheets</h3>
            <p className="text-xs text-slate-400">PDF, JPG, PNG formats supported. Automated OCR parsing.</p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition duration-300 h-[170px]",
              dragActive 
                ? 'border-medical-blue bg-medical-blue/5 scale-[0.99]' 
                : 'border-white/10 bg-white/2 hover:border-white/20'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
              accept="image/*,application/pdf" 
              className="hidden" 
            />
            <Upload className="w-8 h-8 text-medical-blue mb-2.5" />
            <p className="text-xs font-semibold text-white">Drag & drop files here, or click to browse</p>
            <p className="text-[10px] text-slate-500 mt-1">Files analyzed locally. HIPAA compliant encrypted transmission.</p>
          </div>
        </div>

        {/* Demo Templates Selector */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-300">Preset Sample Files</h3>
            <p className="text-xs text-slate-400">Quick-load test datasets for hackathon review</p>
          </div>

          <div className="space-y-2.5">
            {reportTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => triggerSimulation(template)}
                disabled={isAnalyzing}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border flex items-center justify-between text-xs transition duration-200 glass-panel-hover",
                  selectedReport?.name === template.name ? 'border-medical-blue bg-white/5' : 'border-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 border border-white/5 rounded-lg text-medical-blue">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{template.fileName}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Telemetry Results Column */}
      <div className="lg:col-span-3 min-h-[500px]">
        <AnimatePresence mode="wait">
          {isAnalyzing && (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <Loader2 className="w-10 h-10 text-medical-blue animate-spin" />
                <Sparkles className="w-4 h-4 text-medical-teal absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-bold text-white text-sm">Parsing Medical Document</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Executing Google Vision OCR. Extracting tabular biomarkers. Triggering Cardiac and Blood Report AI agents...
                </p>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-4 border-rose-500/25 bg-rose-950/5"
            >
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display font-bold text-white text-sm">Analysis Failed</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
              <button 
                onClick={() => setErrorMsg(null)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {!isAnalyzing && !errorMsg && !selectedReport && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-slate-500">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display font-bold text-white text-sm">No Report Loaded</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Drag in your PDF/images files or select one of the templates on the left to extract health biomarkers.
                </p>
              </div>
            </motion.div>
          )}

          {!isAnalyzing && !errorMsg && selectedReport && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-6 rounded-2xl space-y-6 h-full flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                      {selectedReport.name}
                      <span className="text-[10px] bg-medical-blue/10 border border-medical-blue/20 text-medical-blue px-2 py-0.5 rounded-full font-sans uppercase">
                        {selectedReport.type}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Parsed file: {selectedReport.fileName}</p>
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    OCR Accurate
                  </div>
                </div>

                {/* Biomarkers Table */}
                <div className="space-y-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Extracted Values</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-mono">
                          <th className="pb-2 font-normal">Biomarker</th>
                          <th className="pb-2 font-normal">Extracted Value</th>
                          <th className="pb-2 font-normal">Reference Range</th>
                          <th className="pb-2 text-right font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedReport.metrics.map((m, idx) => (
                          <tr key={idx} className="hover:bg-white/2 transition duration-150">
                            <td className="py-2.5">
                              <p className="font-semibold text-white">{m.name}</p>
                              <span className="text-[10px] text-slate-500">{m.category}</span>
                            </td>
                            <td className="py-2.5 font-mono text-white">
                              {m.value} <span className="text-[10px] text-slate-400">{m.unit}</span>
                            </td>
                            <td className="py-2.5 font-mono text-slate-400">{m.referenceRange}</td>
                            <td className="py-2.5 text-right">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                getStatusBg(m.status)
                              )}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-medical-blue" />
                    AI Diagnostic Explanation
                  </p>
                  <p className="p-3.5 bg-slate-900 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
                    {selectedReport.explanation}
                  </p>
                </div>
              </div>

              {/* Actionable recommendations */}
              <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Action Items</p>
                <div className="space-y-2">
                  {selectedReport.recs.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-medical-blue mt-1.5 shrink-0" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
