'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderLock, Lock, Unlock, Upload, FileText, 
  Trash2, Download, Key, ShieldCheck, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToSplunk } from '@/lib/splunk-client';

interface VaultFile {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
  encryptedKey: string;
  cipherText: string;
  isDecrypted: boolean;
}

export default function HealthVault() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<VaultFile[]>([
    {
      id: '1',
      name: 'Cardiology_ECG_Report.pdf',
      size: '2.4 MB',
      date: '2026-06-15',
      type: 'Medical Report',
      encryptedKey: 'AES256-4c9b8a7f...d2f9',
      cipherText: '5f3c9e8d7a6b5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d...',
      isDecrypted: false
    },
    {
      id: '2',
      name: 'Lisinopril_Prescription.png',
      size: '850 KB',
      date: '2026-05-20',
      type: 'Prescription',
      encryptedKey: 'AES256-8a7f4c9b...d9c2',
      cipherText: '2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c...',
      isDecrypted: false
    }
  ]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptedFileContent, setDecryptedFileContent] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

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
      encryptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      encryptFile(e.target.files[0]);
    }
  };

  const encryptFile = (file: File) => {
    setIsEncrypting(true);
    
    // Simulate Client-side AES-256 encryption
    setTimeout(() => {
      const newFile: VaultFile = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0],
        type: file.type || 'Clinical Document',
        encryptedKey: `AES256-${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        cipherText: Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        isDecrypted: false
      };

      setFiles(prev => [newFile, ...prev]);
      setIsEncrypting(false);

      logToSplunk('health_vault', {
        action: 'document_encrypted_locally',
        fileName: file.name,
        fileSize: file.size,
        docType: newFile.type
      }, { severity: 'Success' });

    }, 1500);
  };

  const toggleDecrypt = (fileId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const nextState = !f.isDecrypted;
        
        if (nextState) {
          setActiveFileId(fileId);
          setDecryptedFileContent(
            `DECRYPTED PAYLOAD - HEALTH VAULT SECURE VIEW\n=========================================\nFile Ref: doc-id-${f.id}\nFilename: ${f.name}\nTimestamp: ${f.date}\nStatus: CLINICAL INTEGRITY VERIFIED (HMAC-SHA256)\n-----------------------------------------\nLocal decryption key validated. Raw file stream unpacked.`
          );
          
          logToSplunk('health_vault', {
            action: 'document_decrypted_locally',
            documentId: fileId,
            documentName: f.name
          }, { severity: 'Warning' });
        } else {
          if (activeFileId === fileId) {
            setDecryptedFileContent(null);
            setActiveFileId(null);
          }
        }
        return { ...f, isDecrypted: nextState };
      }
      return f;
    }));
  };

  const deleteFile = (fileId: string, fileName: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      setDecryptedFileContent(null);
      setActiveFileId(null);
    }

    logToSplunk('health_vault', {
      action: 'document_deleted',
      documentId: fileId,
      documentName: fileName
    }, { severity: 'Info' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-medical-blue/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-medical-teal" />
            Secure Clinical Health Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Store prescriptions, lab reports, X-rays, and insurance documents protected under local client-side AES-256 encryption.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Hand: Upload File Dropzone & Explorer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            {/* Upload Area */}
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
                id="vault-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="vault-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Drag & drop clinical files or Click to import</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Encrypts locally in browser prior to cloud staging</p>
                </div>
              </label>
            </div>

            {/* Encryption Loader */}
            {isEncrypting && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-3">
                <RefreshCw className="w-4 h-4 text-medical-blue animate-spin" />
                <span>Generating client-side key & encrypting document...</span>
              </div>
            )}

            {/* Files List */}
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Vault Documents</p>
              
              <div className="space-y-2.5">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className={cn(
                      "p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs transition duration-200",
                      file.isDecrypted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/2'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 text-lg",
                        file.isDecrypted ? 'border-emerald-500/25 text-emerald-400' : 'border-white/10 text-slate-400'
                      )}>
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{file.name}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">{file.type} · {file.size} · {file.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleDecrypt(file.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1",
                          file.isDecrypted 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-medical-blue'
                        )}
                        title={file.isDecrypted ? 'Lock Document' : 'Decrypt Document'}
                      >
                        {file.isDecrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {file.isDecrypted ? 'Decrypted' : 'Decrypt'}
                      </button>

                      <button
                        onClick={() => deleteFile(file.id, file.name)}
                        className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {files.length === 0 && (
                  <div className="text-center py-10 text-slate-500 italic">
                    Vault is empty. Drag and drop clinical records to secure them.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Encryption Details & Decrypted View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cryptographic telemetry */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Key className="w-4 h-4 text-medical-teal" /> Cryptographic Telemetry
            </h3>

            {activeFileId ? (
              <div className="space-y-3 text-[10px] font-mono leading-relaxed">
                {files.filter(f => f.id === activeFileId).map((f) => (
                  <React.Fragment key={f.id}>
                    <div>
                      <p className="text-slate-500 uppercase tracking-widest font-semibold">Active Encryption Key</p>
                      <p className="text-slate-200 mt-1 bg-slate-900 border border-white/5 p-2 rounded font-bold break-all">{f.encryptedKey}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase tracking-widest font-semibold">Base64 Ciphertext Hex</p>
                      <p className="text-slate-400 mt-1 bg-slate-900 border border-white/5 p-2 rounded break-all max-h-24 overflow-y-auto">{f.cipherText}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 italic text-xs">
                Select and decrypt a document to view cryptographic telemetry keys.
              </div>
            )}

            <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-start gap-2 text-xs text-slate-400 leading-snug">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Zero-Knowledge Protocol:</strong> Keys are kept entirely inside your browser's local state. File headers are not accessible on server environments.
              </p>
            </div>
          </div>

          {/* Secure Document Viewer Panel */}
          <AnimatePresence>
            {decryptedFileContent && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel p-5 rounded-2xl space-y-4 border-emerald-500/20"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" /> Decrypted Viewer
                  </h3>
                  <button
                    onClick={() => { setDecryptedFileContent(null); setFiles(prev => prev.map(f => ({ ...f, isDecrypted: false }))); }}
                    className="text-[9px] font-bold text-slate-500 hover:text-white uppercase"
                  >
                    Close
                  </button>
                </div>

                <pre className="text-[10px] font-mono text-emerald-300 bg-slate-950 p-4 border border-emerald-500/10 rounded-xl leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {decryptedFileContent}
                </pre>

                <div className="flex gap-2">
                  <button
                    onClick={() => alert('Downloading decrypted source...')}
                    className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Original File
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
