import {
  User,
  XeroxCenter,
  PrinterDevice,
  PrintJob,
  SubscriptionPlan,
  PricingCalculation
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('smartprint_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // 1. Auth API
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User; center?: XeroxCenter; message: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(credentials) }
      ),

    register: (payload: { name: string; email: string; password: string; role?: string; center_name?: string; contact_no?: string }) =>
      request<{ success: boolean; token: string; user: User; center?: XeroxCenter; message: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(payload) }
      ),

    me: () =>
      request<{ success: boolean; user: User; center?: XeroxCenter }>('/auth/me'),

    updateProfile: (profile: Partial<User> & { center_name?: string; address?: string }) =>
      request<{ success: boolean; message: string }>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify(profile)
      }),

    changePassword: (payload: { old_password: string; new_password: string }) =>
      request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // 2. Super Admin API
  superAdmin: {
    getStats: () =>
      request<{
        success: boolean;
        stats: {
          total_centers: number;
          active_centers: number;
          total_printers: number;
          active_printers: number;
          total_jobs: number;
          platform_revenue: number;
          active_subscriptions: number;
        };
        recent_centers: XeroxCenter[];
        recent_jobs: PrintJob[];
      }>('/superadmin/stats'),

    getUsers: (query = '', status = 'all') =>
      request<{ success: boolean; centers: XeroxCenter[] }>(
        `/superadmin/users?q=${encodeURIComponent(query)}&status=${status}`
      ),

    updateCenterStatus: (centerId: string, status: string) =>
      request<{ success: boolean; message: string }>(`/superadmin/centers/${centerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),

    getSubscriptions: () =>
      request<{ success: boolean; subscriptions: SubscriptionPlan[] }>('/superadmin/subscriptions'),

    createSubscription: (plan: Partial<SubscriptionPlan>) =>
      request<{ success: boolean; message: string; plan: SubscriptionPlan }>('/superadmin/subscriptions', {
        method: 'POST',
        body: JSON.stringify(plan)
      }),

    updateSubscription: (id: string, plan: Partial<SubscriptionPlan>) =>
      request<{ success: boolean; message: string }>(`/superadmin/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan)
      }),

    deleteSubscription: (id: string) =>
      request<{ success: boolean; message: string }>(`/superadmin/subscriptions/${id}`, {
        method: 'DELETE'
      })
  },

  // 3. Xerox Center API
  center: {
    getDashboard: () =>
      request<{
        success: boolean;
        center: XeroxCenter;
        subscription: SubscriptionPlan;
        metrics: {
          today_revenue: number;
          today_jobs: number;
          queue_count: number;
          active_printers: number;
          total_printers: number;
        };
        printers: PrinterDevice[];
        queue: PrintJob[];
        recent_history: PrintJob[];
      }>('/center/dashboard'),

    getProfileAndQR: () =>
      request<{
        success: boolean;
        profile: {
          center_id: string;
          center_code: string;
          center_name: string;
          owner_name: string;
          email: string;
          contact_no: string;
          address: string;
          qr_url: string;
          qr_target_payload: {
            app: string;
            code: string;
            name: string;
            direct_url: string;
          };
          pricing: {
            bw_price: number;
            color_price: number;
            duplex_multiplier: number;
            a3_surcharge: number;
            legal_surcharge: number;
          };
          subscription?: SubscriptionPlan;
        };
      }>('/center/profile'),

    updatePricing: (pricing: Partial<XeroxCenter>) =>
      request<{ success: boolean; message: string }>('/center/pricing', {
        method: 'PUT',
        body: JSON.stringify(pricing)
      }),

    getPrinters: () =>
      request<{ success: boolean; printers: PrinterDevice[] }>('/center/printers'),

    addPrinter: (printer: Partial<PrinterDevice>) =>
      request<{ success: boolean; message: string; printer: PrinterDevice }>('/center/printers', {
        method: 'POST',
        body: JSON.stringify(printer)
      }),

    updatePrinter: (id: string, update: Partial<PrinterDevice>) =>
      request<{ success: boolean; message: string }>(`/center/printers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(update)
      }),

    getQueue: () =>
      request<{ success: boolean; queue: PrintJob[] }>('/center/queue'),

    updateJobStatus: (jobId: string, status: string) =>
      request<{ success: boolean; message: string }>(`/center/jobs/${jobId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),

    getHistory: () =>
      request<{ success: boolean; history: PrintJob[] }>('/center/history'),

    getAnalytics: () =>
      request<{
        success: boolean;
        three_month_revenue: Array<{ month: string; revenue: number; jobs: number; bw: number; color: number }>;
        distribution: { bw_jobs: number; color_jobs: number; live_total_revenue: number };
      }>('/center/analytics')
  },

  // 4. Customer Printing Journey API (8 Steps)
  customer: {
    getCenterByCode: (code: string) =>
      request<{
        success: boolean;
        center: {
          id: string;
          center_code: string;
          name: string;
          owner_name: string;
          contact_no: string;
          address: string;
          pricing: {
            bw_price: number;
            color_price: number;
            duplex_multiplier: number;
            a3_surcharge: number;
            legal_surcharge: number;
          };
          active_printers_count: number;
          queue_wait_minutes: number;
          available_services: string[];
        };
      }>(`/customer/center/${code}`),

    uploadDocument: async (file?: File, sampleInfo?: { sample_name: string; page_count: number }) => {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('smartprint_token');
        const res = await fetch(`${API_BASE}/customer/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        return res.json();
      } else {
        return request<{
          success: boolean;
          file_info: {
            document_name: string;
            original_size_kb: number;
            compressed_size_kb: number;
            compression_ratio: string;
            detected_page_count: number;
            format_valid: boolean;
            status: string;
          };
        }>('/customer/upload', {
          method: 'POST',
          body: JSON.stringify(sampleInfo || { sample_name: 'Final_Report.pdf', page_count: 8 })
        });
      }
    },

    calculatePrice: (params: {
      center_code: string;
      page_count: number;
      color_mode: string;
      duplex_mode: string;
      paper_size: string;
      copies: number;
    }) =>
      request<{ success: boolean; pricing: PricingCalculation }>('/customer/calculate-price', {
        method: 'POST',
        body: JSON.stringify(params)
      }),

    createOrder: (params: {
      center_code: string;
      page_count: number;
      color_mode: string;
      duplex_mode: string;
      paper_size: string;
      copies: number;
    }) =>
      request<{
        success: boolean;
        order: {
          order_id: string;
          amount: number;
          amount_paise: number;
          currency: string;
          center_name: string;
          key_id: string;
          breakdown: PricingCalculation;
        };
      }>('/customer/create-order', {
        method: 'POST',
        body: JSON.stringify(params)
      }),

    verifyPayment: (payload: {
      center_code: string;
      customer_name: string;
      customer_phone: string;
      document_name: string;
      page_count: number;
      color_mode: string;
      duplex_mode: string;
      paper_size: string;
      copies: number;
      total_amount: number;
      payment_id: string;
      order_id?: string;
      original_size_kb?: number;
      compressed_size_kb?: number;
    }) =>
      request<{
        success: boolean;
        message: string;
        job: PrintJob;
        job_token: string;
        receipt: {
          receipt_no: string;
          center_name: string;
          date: string;
          amount_paid: number;
          payment_ref: string;
        };
      }>('/customer/verify-payment', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getJobStatus: (token: string) =>
      request<{
        success: boolean;
        job: PrintJob;
        center: { name: string; address: string; contact_no: string };
        printer?: PrinterDevice;
        retention_countdown: { hours_remaining: number; auto_trash_scheduled: string };
      }>(`/customer/job-status/${token}`)
  },

  // 5. Print Agent API
  agent: {
    handshake: (center_code = 'XC-89412') =>
      request<{
        success: boolean;
        agent_status: string;
        session_id: string;
        center: { id: string; code: string; name: string };
        printers: PrinterDevice[];
      }>('/agent/handshake', {
        method: 'POST',
        body: JSON.stringify({ center_code })
      }),

    getPendingJobs: (center_code = 'XC-89412') =>
      request<{ success: boolean; center_code: string; queue_length: number; jobs: PrintJob[] }>(
        `/agent/jobs?center_code=${center_code}`
      ),

    updateStatus: (job_id: string, status: string, printer_id?: string) =>
      request<{ success: boolean; message: string; job_id: string; status: string }>(
        '/agent/update-status',
        { method: 'POST', body: JSON.stringify({ job_id, status, printer_id }) }
      ),

    triggerAutoTrash: () =>
      request<{ success: boolean; message: string; result: any }>('/system/auto-trash', {
        method: 'POST'
      })
  }
};
