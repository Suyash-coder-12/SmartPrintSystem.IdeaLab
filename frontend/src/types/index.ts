export type UserRole = 'superadmin' | 'center' | 'customer';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  contact_no?: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export interface XeroxCenter {
  id: string;
  user_id: string;
  center_code: string;
  name: string;
  owner_name: string;
  email: string;
  contact_no: string;
  address: string;
  qr_code_url: string;
  bw_price: number;
  color_price: number;
  duplex_multiplier: number;
  a3_surcharge: number;
  legal_surcharge: number;
  status: 'active' | 'suspended' | 'pending';
  subscription_plan_id?: string;
  subscription_expires_at?: string;
  created_at: string;
  total_jobs_count?: number;
  owner_details?: {
    name: string;
    email: string;
    contact_no: string;
  };
}

export interface PrinterDevice {
  id: string;
  center_id: string;
  name: string;
  model: string;
  type: 'bw' | 'color';
  status: 'online' | 'offline' | 'busy';
  paper_level: number;
  ink_level: number;
  supported_sizes: string;
  created_at: string;
}

export type JobStatus = 'queued' | 'spooling' | 'printing' | 'completed' | 'failed' | 'trashed';

export interface PrintJob {
  id: string;
  center_id: string;
  customer_name: string;
  customer_phone?: string;
  document_name: string;
  file_path?: string;
  file_size_kb: number;
  compressed_size_kb: number;
  page_count: number;
  pages_to_print: string;
  color_mode: 'bw' | 'color';
  paper_size: 'A4' | 'A3' | 'Letter' | 'Legal';
  duplex_mode: 'single' | 'duplex';
  copies: number;
  total_amount: number;
  payment_id?: string;
  payment_status: 'pending' | 'paid' | 'failed';
  job_status: JobStatus;
  job_token: string;
  assigned_printer_id?: string;
  retention_hours: number;
  trashed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  printer_limit: number;
  max_jobs: number;
  has_analytics: number | boolean;
  has_agent: number | boolean;
  offers_text?: string;
  is_active: number | boolean;
  created_at: string;
  subscribers_count?: number;
}

export interface PricingCalculation {
  page_count: number;
  color_mode: 'bw' | 'color';
  paper_size: string;
  duplex_mode: 'single' | 'duplex';
  copies: number;
  base_rate: number;
  size_surcharge: number;
  cost_per_copy: number;
  subtotal: number;
  total_amount: number;
  currency: string;
}

export interface Transaction {
  id: string;
  job_id: string;
  center_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  customer_phone?: string;
  created_at: string;
}
