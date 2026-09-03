'use client';

import React, { useState } from 'react';
import { ScanLine, Download, Upload, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PilgrimManagementHeader() {
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrFile, setOCRFile] = useState<File | null>(null);
  const [ocrScanning, setOCRScanning] = useState(false);

  const handleOCRScan = () => {
    if (!ocrFile) {
      toast?.error('Please select a passport image first');
      return;
    }
    setOCRScanning(true);
    // Backend integration point: POST /api/ocr/passport with FormData(ocrFile)
    setTimeout(() => {
      setOCRScanning(false);
      setShowOCRModal(false);
      toast?.success('Passport OCR complete — 3 fields extracted successfully');
    }, 2200);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pilgrim Management</h1>
          <p className="text-sm text-muted-foreground mt-1">850 pilgrims registered · Hajj 2027 Campaign</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={() => setShowOCRModal(true)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <ScanLine size={14} />
            Passport OCR
          </button>
          <button className="btn-secondary text-sm flex items-center gap-1.5">
            <Upload size={14} />
            Import CSV
          </button>
          <button className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={14} />
            Export
          </button>
          <button className="btn-primary text-sm flex items-center gap-1.5">
            <UserPlus size={14} />
            Add Pilgrim
          </button>
        </div>
      </div>

      {/* OCR Modal */}
      {showOCRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Passport OCR Scanner</h2>
              <button
                onClick={() => setShowOCRModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a passport photo or scan to automatically extract MRZ data, name, nationality, and expiry date.
            </p>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-4 hover:border-primary/40 transition-colors cursor-pointer bg-muted/30"
              onClick={() => document.getElementById('ocr-file-input')?.click()}
            >
              <ScanLine size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Drop passport image here</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF — max 10MB</p>
              {ocrFile && (
                <p className="text-xs text-primary mt-2 font-medium">Selected: {ocrFile?.name}</p>
              )}
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setOCRFile(e?.target?.files?.[0] ?? null)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOCRModal(false)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleOCRScan}
                disabled={ocrScanning}
                className="btn-primary flex-1 justify-center"
              >
                {ocrScanning ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanLine size={14} />
                    Scan Passport
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}