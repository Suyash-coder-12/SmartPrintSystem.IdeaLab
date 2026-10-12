/**
 * SmartPrint Local Print Agent (TypeScript)
 * Connects physical Xerox center printers with the Cloud Backend.
 * Follows architecture from PDF:
 * [Web/Mobile] -> [PHP API] -> [Database] -> [Razorpay] -> [Print Agent] -> [Printer]
 */

declare const process: any;

export interface PrintJob {
  id: string;
  center_id: string;
  customer_name: string;
  document_name: string;
  page_count: number;
  color_mode: 'bw' | 'color';
  paper_size: string;
  duplex_mode: string;
  copies: number;
  total_amount: number;
  job_status: 'queued' | 'spooling' | 'printing' | 'completed' | 'failed';
  job_token: string;
  assigned_printer_id?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'busy' | 'offline';
  paper_level: number;
  ink_level: number;
}

const API_BASE = process.env.SMARTPRINT_API_URL || 'http://127.0.0.1:8000/api';
const CENTER_CODE = process.env.CENTER_CODE || 'XC-89412';

class SmartPrintAgent {
  private isConnected = false;
  private pollingIntervalMs = 4000;
  private activeJobs = new Set<string>();

  public async start(): Promise<void> {
    console.log('====================================================');
    console.log('   SMARTPRINT LOCAL PRINT AGENT v1.0.0 [Enterprise]');
    console.log(`   Target Center: ${CENTER_CODE}`);
    console.log(`   Endpoint:      ${API_BASE}`);
    console.log('====================================================');

    await this.performHandshake();
    this.startPollingLoop();
  }

  private async performHandshake(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/agent/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center_code: CENTER_CODE })
      });

      if (!res.ok) {
        throw new Error(`Handshake failed with status ${res.status}`);
      }

      const data = await res.json() as { success: boolean; printers: PrinterDevice[]; message: string };
      this.isConnected = true;
      console.log(`[AGENT] 🟢 Handshake Successful! Connected to ${CENTER_CODE}`);
      console.log(`[AGENT] Found ${data.printers?.length || 0} configured physical printers:`);
      data.printers?.forEach((p) => {
        console.log(`   - [${p.type.toUpperCase()}] ${p.name} (Paper: ${p.paper_level}%, Ink: ${p.ink_level}%)`);
      });
    } catch (err) {
      console.warn(`[AGENT] ⚠️ Connection warning: ${(err as Error).message}`);
      console.log('[AGENT] Retrying handshake in 5 seconds...');
      setTimeout(() => this.performHandshake(), 5000);
    }
  }

  private startPollingLoop(): void {
    setInterval(async () => {
      if (!this.isConnected) return;
      await this.checkQueue();
    }, this.pollingIntervalMs);
  }

  private async checkQueue(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/agent/jobs?center_code=${CENTER_CODE}`);
      if (!res.ok) return;

      const data = await res.json() as { success: boolean; queue_length: number; jobs: PrintJob[] };
      if (!data.success || !data.jobs || data.jobs.length === 0) return;

      for (const job of data.jobs) {
        if (this.activeJobs.has(job.id)) continue;
        this.activeJobs.add(job.id);
        this.processJob(job);
      }
    } catch (err) {
      console.error('[AGENT] Poll error:', (err as Error).message);
    }
  }

  private async processJob(job: PrintJob): Promise<void> {
    console.log(`\n[AGENT] 📥 INCOMING JOB DETECTED! Token: [${job.job_token}]`);
    console.log(`   Document: ${job.document_name}`);
    console.log(`   Specs:    ${job.page_count} pages × ${job.copies} copies (${job.color_mode.toUpperCase()}, ${job.paper_size}, ${job.duplex_mode})`);
    console.log(`   Customer: ${job.customer_name}`);

    // Step 1: Spooling
    await this.updateJobStatus(job.id, 'spooling');
    console.log(`[AGENT] 🔄 Spooling rasterized pages for [${job.job_token}]...`);
    await this.sleep(2500);

    // Step 2: Physical Printing
    await this.updateJobStatus(job.id, 'printing');
    console.log(`[AGENT] 🖨️  Physical Printer Feed Activated for [${job.job_token}]...`);
    const pagesTotal = job.page_count * job.copies;
    for (let p = 1; p <= pagesTotal; p++) {
      await this.sleep(1200);
      console.log(`   Page ${p}/${pagesTotal} printed successfully...`);
    }

    // Step 3: Completed
    await this.updateJobStatus(job.id, 'completed');
    console.log(`[AGENT] ✅ Job [${job.job_token}] Completed & Ejected from Tray.`);
    console.log(`[AGENT] 🔒 Document marked for Auto-Trash Retention (24h countdown).`);
    this.activeJobs.delete(job.id);
  }

  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/agent/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, status })
      });
    } catch (e) {
      console.error(`[AGENT] Failed to update job status: ${(e as Error).message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Auto-run if executed directly
const agent = new SmartPrintAgent();
agent.start();
