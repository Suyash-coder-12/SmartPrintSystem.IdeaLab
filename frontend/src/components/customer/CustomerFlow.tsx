import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PricingCalculation, PrintJob } from '../../types';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Building,
  UploadCloud,
  Settings2,
  CreditCard,
  ListOrdered,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Download,
  AlertCircle,
  Smartphone,
  Check,
  Zap,
  Layers,
  FileCheck2,
  Trash2
} from 'lucide-react';

interface CustomerFlowProps {
  initialCenterCode?: string;
}

export const CustomerFlow: React.FC<CustomerFlowProps> = ({ initialCenterCode = 'XC-89412' }) => {
  // Current Step 1 to 8 (matching PDF exactly)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Center Identification
  const [centerCodeInput, setCenterCodeInput] = useState(initialCenterCode);
  const [centerInfo, setCenterInfo] = useState<any>(null);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerError, setCenterError] = useState<string | null>(null);

  // Step 2 & 3: Document Upload & Compression
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    document_name: string;
    original_size_kb: number;
    compressed_size_kb: number;
    compression_ratio: string;
    detected_page_count: number;
  }>({
    document_name: 'Project_Final_Submission.pdf',
    original_size_kb: 2450,
    compressed_size_kb: 1080,
    compression_ratio: '56%',
    detected_page_count: 6
  });
  const [isCompressing, setIsCompressing] = useState(false);

  // Step 4: Print Settings
  const [printSettings, setPrintSettings] = useState({
    pagesToPrint: 'all', // 'all' or '1-3, 5'
    copies: 1,
    colorMode: 'bw' as 'bw' | 'color',
    paperSize: 'A4' as 'A4' | 'A3' | 'Legal' | 'Letter',
    duplexMode: 'single' as 'single' | 'duplex'
  });
  const [calculatedPrice, setCalculatedPrice] = useState<PricingCalculation | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Step 5: Payment (Razorpay simulation)
  const [customerName, setCustomerName] = useState('Devendra Singh');
  const [customerPhone, setCustomerPhone] = useState('+91 9876543210');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Step 6, 7 & 8: Verified Job & Physical Print Lifecycle
  const [verifiedJob, setVerifiedJob] = useState<PrintJob | null>(null);
  const [jobReceipt, setJobReceipt] = useState<any>(null);
  const [printProgress, setPrintProgress] = useState<'spooling' | 'printing' | 'completed'>('spooling');
  const [printedPages, setPrintedPages] = useState<number>(0);

  // Load center on mount or when initialCenterCode changes
  useEffect(() => {
    if (initialCenterCode) {
      loadCenter(initialCenterCode);
    }
  }, [initialCenterCode]);

  const loadCenter = async (code: string) => {
    setCenterLoading(true);
    setCenterError(null);
    try {
      const res = await api.customer.getCenterByCode(code);
      if (res.success) {
        setCenterInfo(res.center);
        setCenterCodeInput(res.center.center_code);
        setCurrentStep(2); // Auto advance to Step 02: Center Dashboard
      }
    } catch (e) {
      setCenterError((e as Error).message);
    } finally {
      setCenterLoading(false);
    }
  };

  // Recalculate price whenever settings or file changes
  useEffect(() => {
    if (currentStep >= 4 && centerInfo) {
      calculatePrice();
    }
  }, [printSettings, fileDetails, centerInfo, currentStep]);

  const calculatePrice = async () => {
    setPriceLoading(true);
    try {
      const res = await api.customer.calculatePrice({
        center_code: centerInfo?.center_code || centerCodeInput,
        page_count: fileDetails.detected_page_count,
        color_mode: printSettings.colorMode,
        duplex_mode: printSettings.duplexMode,
        paper_size: printSettings.paperSize,
        copies: printSettings.copies
      });
      if (res.success) {
        setCalculatedPrice(res.pricing);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsCompressing(true);

    try {
      const res = await api.customer.uploadDocument(file);
      if (res.success && res.file_info) {
        setFileDetails(res.file_info);
      }
    } catch (e) {
      // Graceful fallback with detected info
      const sizeKb = Math.round(file.size / 1024);
      setFileDetails({
        document_name: file.name,
        original_size_kb: sizeKb,
        compressed_size_kb: Math.max(40, Math.round(sizeKb * 0.45)),
        compression_ratio: '55%',
        detected_page_count: Math.max(1, Math.min(25, Math.ceil(sizeKb / 120)))
      });
    } finally {
      setIsCompressing(false);
    }
  };

  // Step 5: Simulate Razorpay Payment & Verify
  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      // 1. Create order
      const orderRes = await api.customer.createOrder({
        center_code: centerInfo?.center_code || 'XC-89412',
        page_count: fileDetails.detected_page_count,
        color_mode: printSettings.colorMode,
        duplex_mode: printSettings.duplexMode,
        paper_size: printSettings.paperSize,
        copies: printSettings.copies
      });

      // 2. Simulate server-side payment verification
      const payId = 'pay_rzp_' + Math.random().toString(36).substring(2, 9);
      const verifyRes = await api.customer.verifyPayment({
        center_code: centerInfo?.center_code || 'XC-89412',
        customer_name: customerName,
        customer_phone: customerPhone,
        document_name: fileDetails.document_name,
        page_count: fileDetails.detected_page_count,
        color_mode: printSettings.colorMode,
        duplex_mode: printSettings.duplexMode,
        paper_size: printSettings.paperSize,
        copies: printSettings.copies,
        total_amount: calculatedPrice?.total_amount || 12.0,
        payment_id: payId,
        order_id: orderRes.order?.order_id,
        original_size_kb: fileDetails.original_size_kb,
        compressed_size_kb: fileDetails.compressed_size_kb
      });

      if (verifyRes.success) {
        setVerifiedJob(verifyRes.job);
        setJobReceipt(verifyRes.receipt);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setCurrentStep(6); // Step 06: Print Queue

        // Automatically start Step 07 Print simulation after 2 seconds
        simulatePhysicalPrint(verifyRes.job);
      }
    } catch (e) {
      alert('Payment processing failed: ' + (e as Error).message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const simulatePhysicalPrint = (job: PrintJob) => {
    setTimeout(() => {
      setCurrentStep(7); // Physical Print
      setPrintProgress('spooling');

      setTimeout(() => {
        setPrintProgress('printing');
        const totalPgs = job.page_count * job.copies;

        let page = 1;
        const pageInterval = setInterval(() => {
          setPrintedPages(page);
          page++;
          if (page > totalPgs) {
            clearInterval(pageInterval);
            setPrintProgress('completed');
            setTimeout(() => {
              setCurrentStep(8); // History + Auto Trash
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
            }, 1200);
          }
        }, 900);
      }, 2000);
    }, 1500);
  };

  // Steps Navigator metadata from Page 2
  const stepsMeta = [
    { num: 1, title: 'QR Scan' },
    { num: 2, title: 'Dashboard' },
    { num: 3, title: 'Doc Select' },
    { num: 4, title: 'Print Settings' },
    { num: 5, title: 'Payment' },
    { num: 6, title: 'Print Queue' },
    { num: 7, title: 'Physical Print' },
    { num: 8, title: 'History + Trash' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 8-Step Breadcrumbs Bar (Derived directly from PDF Page 2) */}
      <div className="glass-panel p-3 bg-white/90">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 text-center text-xs">
          {stepsMeta.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <button
                key={s.num}
                disabled={s.num > currentStep}
                onClick={() => setCurrentStep(s.num)}
                className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 cursor-pointer'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span className="text-[10px] tracking-tight truncate w-full">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 01: QR SCAN */}
      {currentStep === 1 && (
        <div className="glass-panel-elevated p-8 bg-white/95 text-center max-w-lg mx-auto space-y-6">
          <div className="flex justify-center">
            <QrCode className="w-16 h-16 text-slate-800" strokeWidth={1.5} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              01 • Scan Xerox Center QR Code
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Customer scans the center QR code to instantly identify the Xerox center and access its live cloud spooler.
            </p>
          </div>

          {centerError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {centerError}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={centerCodeInput}
                onChange={(e) => setCenterCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter Center Code (e.g. XC-89412)"
                className="w-full text-center font-mono font-bold text-sm tracking-widest py-3 px-4 rounded-xl glass-input text-slate-900 uppercase"
              />
            </div>

            <button
              onClick={() => loadCenter(centerCodeInput)}
              disabled={centerLoading || !centerCodeInput}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {centerLoading ? (
                <span>Connecting to Center...</span>
              ) : (
                <>
                  <span>Simulate QR Scan Identification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="text-slate-400">Available Demo Centers:</span>
            <button
              onClick={() => loadCenter('XC-89412')}
              className="font-mono font-semibold text-blue-600 hover:underline"
            >
              XC-89412
            </button>
            <span>•</span>
            <button
              onClick={() => loadCenter('XC-44218')}
              className="font-mono font-semibold text-blue-600 hover:underline"
            >
              XC-44218
            </button>
          </div>
        </div>
      )}

      {/* STEP 02: CENTER DASHBOARD */}
      {currentStep === 2 && centerInfo && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center pr-1">
                <Building className="w-8 h-8 text-slate-900" strokeWidth={1.8} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
                  02 • Center Dashboard Verified
                </span>
                <h2 className="text-lg font-bold text-slate-900">{centerInfo.name}</h2>
                <p className="text-xs text-slate-500">{centerInfo.address}</p>
              </div>
            </div>

            <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {centerInfo.center_code}
            </span>
          </div>

          {/* Available Services */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Store Print Services
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {centerInfo.available_services?.map((svc: string, i: number) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{svc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview Pill */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Rates for this station</span>
              <span className="text-slate-500 text-[11px]">
                B/W: ₹{centerInfo.pricing.bw_price}/pg • Color: ₹{centerInfo.pricing.color_price}/pg
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Estimated wait:</span>
              <span className="font-bold text-emerald-700">~{centerInfo.queue_wait_minutes} mins</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Scan Another
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Start New Print Job</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 03: DOCUMENT SELECTION */}
      {currentStep === 3 && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
              03 • Document Selection & Compression
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Upload Document</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select PDF, DOCX or image. File is automatically compressed & validated client-side.
            </p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <label className="relative block border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-blue-50/30 hover:bg-blue-50/60 transition-all group">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex justify-center mb-2">
              <UploadCloud className="w-12 h-12 text-slate-700 group-hover:scale-105 transition-transform" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Click to select PDF or drag and drop here
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports PDF, Word Documents, High-Res Images up to 50MB
            </p>
          </label>

          {/* Compression & Validation Badge */}
          {fileDetails && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" strokeWidth={1.8} />
                  <span className="truncate max-w-[240px]">{fileDetails.document_name}</span>
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compressed ({fileDetails.compression_ratio} saved)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>
                  Original: {fileDetails.original_size_kb} KB &rarr; Compressed: <strong>{fileDetails.compressed_size_kb} KB</strong>
                </span>
                <span>
                  Detected Pages: <strong className="text-slate-900">{fileDetails.detected_page_count}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              disabled={isCompressing}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Print Settings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 04: PRINT SETTINGS */}
      {currentStep === 4 && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto space-y-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
              04 • Print Settings & Price Engine
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Configure Print Job</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select page range, color mode, copies, and duplex. Final price calculates instantly.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Color Mode Switcher */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Color Preference</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSettings({ ...printSettings, colorMode: 'bw' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    printSettings.colorMode === 'bw'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">Black & White</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Standard laser • ₹{centerInfo?.pricing.bw_price || 2.0}/pg
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSettings({ ...printSettings, colorMode: 'color' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    printSettings.colorMode === 'color'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">Full HD Color</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Premium color • ₹{centerInfo?.pricing.color_price || 10.0}/pg
                  </span>
                </button>
              </div>
            </div>

            {/* Duplex / Sides */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Printing Sides (Duplex)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSettings({ ...printSettings, duplexMode: 'single' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    printSettings.duplexMode === 'single'
                      ? 'border-blue-600 bg-blue-50 font-bold text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Single-Sided (1 page/sheet)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSettings({ ...printSettings, duplexMode: 'duplex' })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    printSettings.duplexMode === 'duplex'
                      ? 'border-blue-600 bg-blue-50 font-bold text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Double-Sided (Back to Back, 10% Off)
                </button>
              </div>
            </div>

            {/* Paper Size & Copies Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Paper Size</label>
                <select
                  value={printSettings.paperSize}
                  onChange={(e) => setPrintSettings({ ...printSettings, paperSize: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-800"
                >
                  <option value="A4">A4 (Standard)</option>
                  <option value="A3">A3 (+₹5/pg)</option>
                  <option value="Legal">Legal (+₹2/pg)</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Number of Copies</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintSettings({ ...printSettings, copies: Math.max(1, printSettings.copies - 1) })}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={printSettings.copies}
                    onChange={(e) => setPrintSettings({ ...printSettings, copies: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full p-2 rounded-xl glass-input text-center font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setPrintSettings({ ...printSettings, copies: printSettings.copies + 1 })}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Price Calculation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Calculated Total</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{calculatedPrice?.total_amount || 12.0}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {fileDetails.detected_page_count} pages × {printSettings.copies} copies ({printSettings.colorMode.toUpperCase()})
              </span>
            </div>

            <button
              onClick={() => setCurrentStep(5)}
              className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Proceed to Pay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 05: PAYMENT */}
      {currentStep === 5 && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto space-y-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
              05 • Secure Online Payment (Razorpay)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Payment Checkout</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified instantly. Zero touch required at Xerox shop counter.
            </p>
          </div>

          {/* Customer Contact */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Your Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Mobile (for SMS token)</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div className="space-y-2 text-xs">
            <span className="text-slate-600 font-semibold block">Select Gateway Method</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border text-center font-medium transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                UPI (GPay/PhonePe)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center font-medium transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Debit/Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-3 rounded-xl border text-center font-medium transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Net Banking
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Payable to:</span>
              <strong className="text-slate-900">{centerInfo?.name}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Document:</span>
              <strong className="text-slate-900 truncate max-w-[200px]">{fileDetails.document_name}</strong>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Amount:</span>
              <span>₹{calculatedPrice?.total_amount || 12.0}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <span>Verifying with Bank...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Simulate Instant Online Payment (₹{calculatedPrice?.total_amount || 12.0})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 06: PRINT QUEUE */}
      {currentStep === 6 && verifiedJob && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" strokeWidth={1.5} />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">
              06 • Verified Job Entered Print Queue
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Payment Verified Successfully!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your print job has been digitally signed and routed to the shop's local Print Agent.
            </p>
          </div>

          {/* Secure 4-Digit PIN Token */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-xl max-w-xs mx-auto">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
              Secure Pick-Up Job Token
            </span>
            <span className="font-mono text-3xl font-black text-emerald-400 tracking-widest my-2 block">
              {verifiedJob.job_token}
            </span>
            <span className="text-[11px] text-slate-300 block">
              Show this code to shopkeeper if manual assistance needed
            </span>
          </div>

          <p className="text-xs text-blue-600 font-semibold animate-pulse">
            Local Printer Spooler is activating now...
          </p>
        </div>
      )}

      {/* STEP 07: PHYSICAL PRINT */}
      {currentStep === 7 && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto text-center space-y-6">
          <div className="relative flex justify-center">
            <Printer className="w-16 h-16 text-slate-900" strokeWidth={1.5} />
            <span className="absolute -top-1 right-[43%] flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
              07 • Physical Print Spooling
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {printProgress === 'spooling'
                ? 'Connecting to Hardware Printer...'
                : printProgress === 'printing'
                ? 'Printing Pages in Progress...'
                : 'Physical Print Completed!'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Print Agent receives only approved jobs and securely spools raster data to local tray.
            </p>
          </div>

          {/* Live Progress Bar */}
          <div className="space-y-2 max-w-sm mx-auto">
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{
                  width:
                    printProgress === 'spooling'
                      ? '35%'
                      : printProgress === 'printing'
                      ? `${Math.min(95, Math.max(45, (printedPages / Math.max(1, (verifiedJob?.page_count || 6) * (verifiedJob?.copies || 1))) * 100))}%`
                      : '100%'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Status: {printProgress.toUpperCase()}</span>
              {printProgress === 'printing' && (
                <span>
                  Page {printedPages} of {(verifiedJob?.page_count || 6) * (verifiedJob?.copies || 1)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 08: HISTORY + AUTO TRASH */}
      {currentStep === 8 && (
        <div className="glass-panel-elevated p-8 bg-white/95 max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">
              08 • History & Auto-Trash Retention
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Printing Complete & Privacy Protected
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please collect your documents from the printer output tray.
            </p>
          </div>

          {/* Digital Receipt Card */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 text-xs space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">Digital Tax Invoice</span>
              <span className="font-mono text-slate-500">{jobReceipt?.receipt_no || 'INV-94102'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Xerox Station:</span>
              <strong className="text-slate-900">{jobReceipt?.center_name || centerInfo?.name}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <strong className="text-slate-900">{customerName}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Paid Amount:</span>
              <strong className="text-emerald-700">₹{jobReceipt?.amount_paid || calculatedPrice?.total_amount}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ref ID:</span>
              <strong className="font-mono text-slate-800">{jobReceipt?.payment_ref}</strong>
            </div>
          </div>

          {/* Auto-Trash Privacy Notice from PDF */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs">
            <Trash2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">Auto-Trash Retention Protection</span>
              <span className="text-amber-800 text-[11px] leading-relaxed block mt-0.5">
                Security Guarantee: Your uploaded document is protected with private storage keys and will be automatically and permanently shredded from the server in 24 hours.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentStep(1);
              setVerifiedJob(null);
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
          >
            Start Another Print Job
          </button>
        </div>
      )}
    </div>
  );
};
