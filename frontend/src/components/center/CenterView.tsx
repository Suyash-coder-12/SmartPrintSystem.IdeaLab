import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { XeroxCenter, PrinterDevice, PrintJob, SubscriptionPlan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'qrcode';
import {
  Building,
  QrCode,
  Printer,
  History,
  TrendingUp,
  Settings,
  CreditCard,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Lock,
  Cpu
} from 'lucide-react';

interface CenterViewProps {
  onOpenCustomerFlowWithCode: (code: string) => void;
  onOpenAgentConsole: () => void;
}

export const CenterView: React.FC<CenterViewProps> = ({
  onOpenCustomerFlowWithCode,
  onOpenAgentConsole
}) => {
  const { user, center: authCenter, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'qr' | 'queue' | 'printers' | 'history' | 'analytics' | 'subscription'>('dashboard');

  const [loading, setLoading] = useState(false);
  const [centerData, setCenterData] = useState<XeroxCenter | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [metrics, setMetrics] = useState({
    today_revenue: 0,
    today_jobs: 0,
    queue_count: 0,
    active_printers: 0,
    total_printers: 0
  });
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [queueJobs, setQueueJobs] = useState<PrintJob[]>([]);
  const [historyJobs, setHistoryJobs] = useState<PrintJob[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Pricing Form
  const [pricingForm, setPricingForm] = useState({
    bw_price: 2.0,
    color_price: 10.0,
    duplex_multiplier: 1.8,
    a3_surcharge: 5.0,
    legal_surcharge: 2.0
  });

  // Printer modal
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterType, setNewPrinterType] = useState<'bw' | 'color'>('bw');
  const [newPrinterModel, setNewPrinterModel] = useState('');

  // QR Code canvas
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCenterDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.center.getDashboard();
      if (res.success) {
        setCenterData(res.center);
        setSubscription(res.subscription);
        setMetrics(res.metrics);
        setPrinters(res.printers);
        setQueueJobs(res.queue);
        setPricingForm({
          bw_price: res.center.bw_price,
          color_price: res.center.color_price,
          duplex_multiplier: res.center.duplex_multiplier,
          a3_surcharge: res.center.a3_surcharge,
          legal_surcharge: res.center.legal_surcharge
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.center.getHistory();
      if (res.success) {
        setHistoryJobs(res.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.center.getAnalytics();
      if (res.success) {
        setAnalytics(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCenterDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  // Generate dynamic QR Code when on QR tab
  const activeCenterCode = centerData?.center_code || authCenter?.center_code || 'XC-89412';
  useEffect(() => {
    if (qrCanvasRef.current && activeCenterCode) {
      const qrPayload = JSON.stringify({
        app: 'SmartPrint',
        code: activeCenterCode,
        center_name: centerData?.name || 'SmartPrint Xerox Center',
        url: `${window.location.origin}/print/${activeCenterCode}`
      });

      QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    }
  }, [activeTab, activeCenterCode, centerData]);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.center.updatePricing(pricingForm);
      setFeedback('Pricing rules updated successfully!');
      setTimeout(() => setFeedback(null), 3000);
      fetchCenterDashboard();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.center.addPrinter({
        name: newPrinterName,
        model: newPrinterModel || 'Network Spooler',
        type: newPrinterType
      });
      setIsPrinterModalOpen(false);
      setNewPrinterName('');
      setNewPrinterModel('');
      fetchCenterDashboard();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    try {
      await api.center.updateJobStatus(jobId, status);
      fetchCenterDashboard();
      if (activeTab === 'history') fetchHistory();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(activeCenterCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadQrCode = () => {
    if (!qrCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `SmartPrint-Standee-${activeCenterCode}.png`;
    link.href = qrCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Center Top Header with Unique QR Pill */}
      <div className="glass-panel-elevated p-6 bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center pr-1">
            <Building className="w-9 h-9 text-slate-900" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {centerData?.name || 'QuickPrint Xerox & Digital Hub'}
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-mono font-bold">
                <span>{activeCenterCode}</span>
                <button
                  onClick={copyCodeToClipboard}
                  title="Copy Unique Center Code"
                  className="hover:text-blue-950 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: <strong className="text-slate-700">{centerData?.owner_name || user?.name}</strong> •{' '}
              {centerData?.contact_no || '+91 9823456789'}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-medium w-full md:w-auto overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'qr', label: 'Profile + Unique QR', icon: QrCode },
            { id: 'queue', label: `Print Queue (${metrics.queue_count})`, icon: Clock },
            { id: 'printers', label: 'Printers & Rates', icon: Printer },
            { id: 'history', label: 'History', icon: History },
            { id: 'analytics', label: 'Analytics', icon: Sparkles },
            { id: 'subscription', label: 'Subscription', icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 bg-white/85">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Today's Earnings
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  ₹{metrics.today_revenue}
                </span>
                <span className="text-xs font-medium text-emerald-600">INR</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">From verified online payments</div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Today's Print Jobs
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {metrics.today_jobs}
                </span>
                <span className="text-xs font-medium text-blue-600">Documents</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Zero wait-time self service</div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Live Queue Waiting
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight text-blue-600">
                  {metrics.queue_count}
                </span>
                <span className="text-xs font-medium text-slate-500">In Spooler</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Agent auto-routing enabled</div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Active Printers
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight text-emerald-600">
                  {metrics.active_printers}
                </span>
                <span className="text-xs font-medium text-slate-500">of {metrics.total_printers} Online</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">HP LaserJet & Canon Multifunction</div>
            </div>
          </div>

          {/* Quick Actions & Live Queue Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="glass-panel p-5 bg-white/85 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Store Quick Launch</h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => onOpenCustomerFlowWithCode(activeCenterCode)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 text-blue-800 font-medium transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Launch Customer Self-Service Scanner</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={onOpenAgentConsole}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 font-medium transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    <span>Open Local Print Agent Console</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('qr')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-slate-600" />
                    <span>Download Acrylic Shop Standee</span>
                  </div>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current Active Queue (2 columns) */}
            <div className="glass-panel p-5 bg-white/85 lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Current Print Queue Stream</h3>
                <button
                  onClick={fetchCenterDashboard}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {queueJobs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Printer className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <span>Queue is clear. New jobs will appear automatically upon customer payment.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {queueJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/60">
                            {job.job_token}
                          </span>
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {job.document_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {job.customer_name} • {job.page_count} pgs × {job.copies} copies (
                          {job.color_mode.toUpperCase()}, {job.paper_size}, {job.duplex_mode})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 mr-2">₹{job.total_amount}</span>
                        {job.job_status === 'queued' && (
                          <button
                            onClick={() => handleUpdateJobStatus(job.id, 'printing')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px]"
                          >
                            Send to Printer
                          </button>
                        )}
                        {job.job_status === 'printing' && (
                          <button
                            onClick={() => handleUpdateJobStatus(job.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                          >
                            Mark Printed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE + UNIQUE QR */}
      {activeTab === 'qr' && (
        <div className="glass-panel p-6 bg-white/90 space-y-6">
          <div className="max-w-3xl">
            <h3 className="text-base font-bold text-slate-900">Store Profile & SmartPrint Standee Generator</h3>
            <p className="text-xs text-slate-500">
              Unique Auto ID generated from center credentials. Customers scan this QR to instantly load your pricing and print queue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Interactive Printable Standee Preview */}
            <div className="relative mx-auto w-full max-w-sm p-6 rounded-3xl glass-panel-elevated bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-center shadow-xl">
              <div className="flex justify-center mb-1">
                <Printer className="w-8 h-8 text-slate-900" strokeWidth={1.8} />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {centerData?.name || 'QuickPrint Hub'}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Self-Service Digital Print Station
              </p>

              {/* Dynamic QR Canvas */}
              <div className="my-4 inline-block p-3 rounded-2xl bg-white shadow-inner border border-slate-200/80">
                <canvas ref={qrCanvasRef} className="mx-auto rounded-lg" />
              </div>

              {/* Unique Center ID */}
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Unique Xerox Center ID
                </span>
                <span className="font-mono text-base font-extrabold text-blue-700 tracking-wider">
                  {activeCenterCode}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500">
                <span>1. Scan with Phone</span>
                <span>•</span>
                <span>2. Upload & Pay</span>
                <span>•</span>
                <span>3. Collect Print</span>
              </div>
            </div>

            {/* Right: Actions & Details */}
            <div className="space-y-4">
              <div className="glass-panel p-5 bg-white/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Store Details & Credentials
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Owner Name:</span>
                    <strong className="text-slate-900">{centerData?.owner_name || user?.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Email:</span>
                    <strong className="text-slate-900">{centerData?.email || user?.email}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Contact:</span>
                    <strong className="text-slate-900">{centerData?.contact_no}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Address:</span>
                    <strong className="text-slate-900 max-w-xs text-right truncate">{centerData?.address}</strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 bg-white/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  QR Standee Deployment
                </h4>
                <p className="text-xs text-slate-600">
                  Download the high-resolution PNG file to print acrylic stands or counter stickers for your shop front.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    onClick={downloadQrCode}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Standee</span>
                  </button>
                  <button
                    onClick={() => onOpenCustomerFlowWithCode(activeCenterCode)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Simulate Mobile Scan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRINT QUEUE */}
      {activeTab === 'queue' && (
        <div className="glass-panel p-6 bg-white/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Print Queue Management</h3>
              <p className="text-xs text-slate-500">
                Jobs verified by cloud payment entering local printer spool
              </p>
            </div>
            <button
              onClick={fetchCenterDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium hover:bg-slate-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {queueJobs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500/60" />
              <p className="font-semibold text-slate-700">All print jobs completed!</p>
              <p className="text-slate-400 mt-0.5">The queue is currently clear.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
                  <tr>
                    <th className="p-3.5">Job Token</th>
                    <th className="p-3.5">Customer & Phone</th>
                    <th className="p-3.5">Document</th>
                    <th className="p-3.5">Specifications</th>
                    <th className="p-3.5">Paid Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Spooler Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-blue-700">
                        {job.job_token}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{job.customer_name}</span>
                        <span className="text-[11px] text-slate-400">{job.customer_phone || 'Walk-in'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 truncate block max-w-xs">{job.document_name}</span>
                        <span className="text-[11px] text-slate-400">{job.page_count} pages • {job.copies} copies</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mr-1">
                          {job.color_mode.toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mr-1">
                          {job.paper_size}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {job.duplex_mode}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        ₹{job.total_amount}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            job.job_status === 'printing'
                              ? 'bg-blue-100 text-blue-700 animate-pulse'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {job.job_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {job.job_status === 'queued' && (
                          <button
                            onClick={() => handleUpdateJobStatus(job.id, 'printing')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px]"
                          >
                            Print Now
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateJobStatus(job.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                        >
                          Mark Completed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRINTERS & RATES */}
      {activeTab === 'printers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hardware Printers Setup */}
          <div className="glass-panel p-6 bg-white/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Connected Printers</h3>
                <p className="text-xs text-slate-500">
                  HP, Canon & Epson physical USB/Network spoolers
                </p>
              </div>
              <button
                onClick={() => setIsPrinterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Printer</span>
              </button>
            </div>

            <div className="space-y-3">
              {printers.map((prn) => (
                <div
                  key={prn.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center p-1">
                      <Printer className="w-6 h-6 text-slate-700" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{prn.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                          {prn.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{prn.model}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span>Paper: {prn.paper_level}%</span>
                        <span>•</span>
                        <span>Ink: {prn.ink_level}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        prn.status === 'online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {prn.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Print Pricing Settings (Rate Card) */}
          <div className="glass-panel p-6 bg-white/90 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Print Rates & Pricing Formula</h3>
              <p className="text-xs text-slate-500">
                Customer rates dynamically calculated on document upload
              </p>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">B/W Rate per Page (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={pricingForm.bw_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, bw_price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Color Rate per Page (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={pricingForm.color_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, color_price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Duplex Mult.</label>
                  <input
                    type="number"
                    step="0.05"
                    value={pricingForm.duplex_multiplier}
                    onChange={(e) => setPricingForm({ ...pricingForm, duplex_multiplier: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">1.8 = 10% disc</span>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">A3 Surcharge</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pricingForm.a3_surcharge}
                    onChange={(e) => setPricingForm({ ...pricingForm, a3_surcharge: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Legal Surch.</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pricingForm.legal_surcharge}
                    onChange={(e) => setPricingForm({ ...pricingForm, legal_surcharge: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xs"
              >
                Save Rate Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Printer Modal */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-elevated p-6 bg-white text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Register Local Printer</h3>
            <form onSubmit={handleAddPrinter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Printer Model / Name</label>
                <input
                  type="text"
                  required
                  value={newPrinterName}
                  onChange={(e) => setNewPrinterName(e.target.value)}
                  placeholder="e.g. HP LaserJet 1020 Plus"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Color Capability</label>
                <select
                  value={newPrinterType}
                  onChange={(e) => setNewPrinterType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl glass-input"
                >
                  <option value="bw">Black & White Only</option>
                  <option value="color">Full Color & B/W</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
                >
                  Register Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel p-6 bg-white/90 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Historical Print Transactions & Privacy Audit</h3>
          <p className="text-xs text-slate-500">
            Completed jobs with auto-trash retention tracking
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="p-3.5">Job Token</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Document</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Privacy Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{job.job_token}</td>
                    <td className="p-3.5">{job.customer_name}</td>
                    <td className="p-3.5">{job.document_name}</td>
                    <td className="p-3.5 font-bold">₹{job.total_amount}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {job.job_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {job.trashed_at ? (
                        <span className="text-slate-400">File Auto-Purged</span>
                      ) : (
                        <span className="text-amber-600">Encrypted (24h retention)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: 3-MONTH ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="glass-panel p-6 bg-white/90 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">3-Month Revenue Analytics & Print Volume</h3>
            <p className="text-xs text-slate-500">
              Financial trends, color vs black & white breakdown as specified in PDF architecture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(analytics?.three_month_revenue || [
              { month: 'Month 1', revenue: 14200, jobs: 840, bw: 650, color: 190 },
              { month: 'Month 2', revenue: 18950, jobs: 1120, bw: 890, color: 230 },
              { month: 'Month 3 (Current)', revenue: 24100, jobs: 1480, bw: 1140, color: 340 }
            ]).map((m: any, i: number) => (
              <div key={i} className="glass-panel p-5 bg-white/80 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 block">{m.month}</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-2 block">
                  ₹{m.revenue.toLocaleString()}
                </span>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Total Jobs: <strong>{m.jobs}</strong></span>
                  <span>B/W: {m.bw} | Color: {m.color}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block">Growth Trend: +27.2% Month-Over-Month</span>
              <span className="text-slate-500 text-[11px]">Average ticket size: ₹38.40 per order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs">
                Export Financial CSV
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="glass-panel p-6 bg-white/90 max-w-xl mx-auto space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <CreditCard className="w-9 h-9 text-slate-800" strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your SmartPrint Subscription</h3>
            <p className="text-xs text-slate-500">
              Active plan: <strong className="text-indigo-700">{subscription?.name || 'Pro Xerox Hub'}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Billing Cycle:</span>
              <strong className="text-slate-900">{subscription?.billing_cycle || 'Monthly'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rate:</span>
              <strong className="text-slate-900">₹{subscription?.price || 999} /mo</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Printers Supported:</span>
              <strong className="text-slate-900">Up to {subscription?.printer_limit || 4} Devices</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Agent Priority:</span>
              <strong className="text-emerald-700">High / Active</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
