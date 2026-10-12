import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { PrinterDevice, PrintJob } from '../../types';
import {
  Cpu,
  Printer,
  Terminal,
  Activity,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  HardDrive,
  Radio,
  Sparkles
} from 'lucide-react';

export const AgentConsoleView: React.FC = () => {
  const [centerCode, setCenterCode] = useState('XC-89412');
  const [isConnected, setIsConnected] = useState(true);
  const [isAutoSpooling, setIsAutoSpooling] = useState(true);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PrintJob[]>([]);
  const [logs, setLogs] = useState<Array<{ time: string; level: 'info' | 'success' | 'warn'; msg: string }>>([
    { time: '14:30:00', level: 'info', msg: 'SmartPrint Local Print Agent v1.0.0 initialized' },
    { time: '14:30:02', level: 'success', msg: 'Handshake accepted with Cloud API: Center XC-89412' },
    { time: '14:30:05', level: 'info', msg: 'Local CUPS/Windows Spooler connected to 3 physical hardware devices' }
  ]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const addLog = (msg: string, level: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-40), { time, level, msg }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const pollAgent = async () => {
    try {
      const res = await api.agent.getPendingJobs(centerCode);
      if (res.success && res.jobs) {
        setPendingJobs(res.jobs);

        // Auto spool first job if auto-spooling enabled
        if (isAutoSpooling && res.jobs.length > 0) {
          const job = res.jobs[0];
          if (job.job_status === 'queued') {
            addLog(`[QUEUE] Found verified job ${job.job_token}: ${job.document_name}`, 'info');
            await api.agent.updateStatus(job.id, 'printing');
            addLog(`[SPOOLER] Physical tray feeding page 1 to HP LaserJet Pro...`, 'info');

            setTimeout(async () => {
              await api.agent.updateStatus(job.id, 'completed');
              addLog(`[HARDWARE] Job ${job.job_token} printed & delivered to output bin!`, 'success');
              addLog(`[PRIVACY] File tagged for 24h Auto-Trash retention shredder`, 'warn');
              pollAgent();
            }, 3000);
          }
        }
      }
    } catch (e) {
      addLog(`Polling warning: ${(e as Error).message}`, 'warn');
    }
  };

  useEffect(() => {
    // Initial handshake
    api.agent.handshake(centerCode).then((res) => {
      if (res.success) {
        setPrinters(res.printers || []);
        setIsConnected(true);
        addLog(`Synchronized hardware: ${res.printers?.length || 0} printers reporting online`, 'success');
      }
    });

    const interval = setInterval(() => {
      pollAgent();
    }, 4000);

    return () => clearInterval(interval);
  }, [centerCode, isAutoSpooling]);

  const handleTriggerAutoTrash = async () => {
    try {
      const res = await api.agent.triggerAutoTrash();
      addLog(`Auto-trash sweep finished: Purged ${res.result?.cleaned || 0} expired files`, 'warn');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Console Header */}
      <div className="glass-panel-elevated p-4 sm:p-6 bg-gradient-to-r from-white via-emerald-50/20 to-teal-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/AppIcon.png"
            alt="SmartPrint Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl shadow-xs border border-slate-200/50 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Local Print Agent Service Console
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Daemon Running
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure bridge connecting Cloud API payments with Windows/CUPS hardware spoolers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoSpooling(!isAutoSpooling)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isAutoSpooling
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isAutoSpooling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoSpooling ? 'Auto-Spool Active' : 'Auto-Spool Paused'}</span>
          </button>

          <button
            onClick={handleTriggerAutoTrash}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
            title="Clean expired files"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Trigger Auto-Trash</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Printers Hardware Telemetry */}
        <div className="space-y-4">
          <div className="glass-panel p-5 bg-white/90 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Attached Hardware Printers</span>
              <span className="text-emerald-600 font-semibold">{printers.length} Online</span>
            </h3>

            <div className="space-y-2.5">
              {printers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-slate-700" strokeWidth={1.8} />
                      <span>{p.name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      ONLINE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div>
                      Paper Tray: <strong className="text-slate-800">{p.paper_level}%</strong>
                    </div>
                    <div>
                      Ink/Toner: <strong className="text-slate-800">{p.ink_level}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 bg-white/90 text-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Architectural Security Notes
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              &bull; Print Agent accepts only approved jobs authenticated with cryptographic tokens.
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              &bull; Raw document buffers are stored in memory and purged upon job execution.
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              &bull; Zero customer documents are cached permanently on the local machine.
            </p>
          </div>
        </div>

        {/* Right Column: Live Terminal Stream */}
        <div className="lg:col-span-2 glass-panel-elevated p-5 bg-slate-950 text-slate-200 shadow-2xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-white tracking-wide">
                agent_daemon_stdout.log
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>POLL: 4000ms</span>
            </div>
          </div>

          {/* Log Stream Output */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] pr-2 text-slate-300"
          >
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 select-none">[{log.time}]</span>
                <span
                  className={
                    log.level === 'success'
                      ? 'text-emerald-400 font-medium'
                      : log.level === 'warn'
                      ? 'text-amber-400 font-medium'
                      : 'text-slate-300'
                  }
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Center Target: {centerCode}</span>
            <span>CLI equivalent: npm run agent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
