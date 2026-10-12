// Vercel Serverless Function Handler for SmartPrint API
// Provides full serverless fallback and optional PHP backend proxying

const mockDB = {
  users: [
    {
      id: 'usr_admin_01',
      role: 'superadmin',
      name: 'Super Administrator',
      email: 'admin@smartprint.com',
      password: 'admin123',
      contact_no: '+91 9876543210',
      status: 'active'
    },
    {
      id: 'usr_center_01',
      role: 'center',
      name: 'Vikram Sharma',
      email: 'center@quickprint.com',
      password: 'center123',
      contact_no: '+91 9823456789',
      status: 'active'
    },
    {
      id: 'usr_center_02',
      role: 'center',
      name: 'Rajesh Gupta',
      email: 'delhi@apexprint.in',
      password: 'center123',
      contact_no: '+91 9123456780',
      status: 'active'
    }
  ],
  centers: [
    {
      id: 'cnt_01',
      user_id: 'usr_center_01',
      center_code: 'XC-89412',
      name: 'QuickPrint Xerox & Digital Hub',
      owner_name: 'Vikram Sharma',
      email: 'center@quickprint.com',
      contact_no: '+91 9823456789',
      address: 'Shop 14, Metro Pillar 218, University North Campus',
      bw_price: 2.0,
      color_price: 10.0,
      duplex_multiplier: 1.8,
      a3_surcharge: 5.0,
      legal_surcharge: 2.0,
      status: 'active',
      subscription_plan_id: 'sub_pro',
      available_services: [
        'High-Speed B/W Printing (₹2/pg)',
        'HD Color Laser Printing (₹10/pg)',
        'Smart Duplex Auto-Save (15% Off)',
        'A4, A3, Legal Sizes Supported',
        'Zero-Wait Cloud Spooling'
      ]
    },
    {
      id: 'cnt_02',
      user_id: 'usr_center_02',
      center_code: 'XC-44218',
      name: 'Apex Campus Xerox Center',
      owner_name: 'Rajesh Gupta',
      email: 'delhi@apexprint.in',
      contact_no: '+91 9123456780',
      address: 'Gate 2, Engineering College Complex, South City',
      bw_price: 2.5,
      color_price: 12.0,
      duplex_multiplier: 1.75,
      a3_surcharge: 6.0,
      legal_surcharge: 2.5,
      status: 'active',
      subscription_plan_id: 'sub_starter',
      available_services: [
        'High-Speed B/W Printing (₹2.5/pg)',
        'HD Color Laser Printing (₹12/pg)',
        'Smart Duplex Auto-Save',
        'All Sizes Supported'
      ]
    }
  ],
  printers: [
    {
      id: 'prn_01',
      center_id: 'cnt_01',
      name: 'HP LaserJet Pro M404dn',
      model: 'LaserJet HighSpeed Network',
      type: 'bw',
      status: 'online',
      paper_level: 88,
      ink_level: 92,
      supported_sizes: 'A4,A3,Legal'
    },
    {
      id: 'prn_02',
      center_id: 'cnt_01',
      name: 'Canon imageRUNNER 2625',
      model: 'Heavy Duty Multi-Function',
      type: 'color',
      status: 'online',
      paper_level: 74,
      ink_level: 65,
      supported_sizes: 'A4,A3,Letter,Legal'
    },
    {
      id: 'prn_03',
      center_id: 'cnt_01',
      name: 'Epson EcoTank L3250 Wi-Fi',
      model: 'Photo & Document Color',
      type: 'color',
      status: 'online',
      paper_level: 95,
      ink_level: 80,
      supported_sizes: 'A4,Letter'
    }
  ],
  subscriptions: [
    {
      id: 'sub_starter',
      name: 'Starter Vendor',
      price: 499.0,
      billing_cycle: 'monthly',
      printer_limit: 1,
      max_jobs: 500,
      has_analytics: 1,
      has_agent: 1,
      offers_text: 'Introductory 15% off first month',
      is_active: 1
    },
    {
      id: 'sub_pro',
      name: 'Pro Xerox Hub',
      price: 999.0,
      billing_cycle: 'monthly',
      printer_limit: 4,
      max_jobs: 5000,
      has_analytics: 1,
      has_agent: 1,
      offers_text: 'Most Popular: Free QR Acrylic Standee kit',
      is_active: 1
    },
    {
      id: 'sub_enterprise',
      name: 'Enterprise Campus Network',
      price: 1999.0,
      billing_cycle: 'monthly',
      printer_limit: 20,
      max_jobs: 50000,
      has_analytics: 1,
      has_agent: 1,
      offers_text: 'Dedicated SLA + 24/7 Agent Monitoring',
      is_active: 1
    }
  ],
  jobs: [
    {
      id: 'job_seed_01',
      center_id: 'cnt_01',
      customer_name: 'Aarav Patel',
      customer_phone: '+91 9876112233',
      document_name: 'Final_Year_Project_Synopsis.pdf',
      file_size_kb: 2450,
      compressed_size_kb: 940,
      page_count: 16,
      pages_to_print: 'all',
      color_mode: 'bw',
      paper_size: 'A4',
      duplex_mode: 'duplex',
      copies: 2,
      total_amount: 57.6,
      payment_id: 'pay_rzp_demo_101',
      payment_status: 'paid',
      job_status: 'queued',
      job_token: 'SP-8421',
      assigned_printer_id: 'prn_01',
      retention_hours: 24,
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 'job_seed_02',
      center_id: 'cnt_01',
      customer_name: 'Sneha Verma',
      customer_phone: '+91 9765432190',
      document_name: 'Aadhar_Card_Color_FrontBack.pdf',
      file_size_kb: 1100,
      compressed_size_kb: 450,
      page_count: 2,
      pages_to_print: 'all',
      color_mode: 'color',
      paper_size: 'A4',
      duplex_mode: 'single',
      copies: 1,
      total_amount: 20.0,
      payment_id: 'pay_rzp_demo_102',
      payment_status: 'paid',
      job_status: 'printing',
      job_token: 'SP-3910',
      assigned_printer_id: 'prn_02',
      retention_hours: 24,
      created_at: new Date(Date.now() - 40 * 60000).toISOString()
    }
  ]
};

function calculatePrice(center, pageCount, colorMode, duplexMode, paperSize, copies) {
  const bwPrice = center.bw_price || 2.0;
  const colorPrice = center.color_price || 10.0;
  const duplexMultiplier = center.duplex_multiplier || 1.8;
  const a3Surcharge = center.a3_surcharge || 5.0;
  const legalSurcharge = center.legal_surcharge || 2.0;

  const baseRate = colorMode === 'color' ? colorPrice : bwPrice;
  let sizeSurcharge = 0.0;
  if (paperSize && paperSize.toUpperCase() === 'A3') sizeSurcharge = a3Surcharge;
  if (paperSize && paperSize.toUpperCase() === 'LEGAL') sizeSurcharge = legalSurcharge;

  const effectivePerPage = baseRate + sizeSurcharge;
  let costPerCopy = 0;
  if (duplexMode === 'duplex') {
    const sheets = Math.ceil(pageCount / 2);
    costPerCopy = sheets * effectivePerPage * (duplexMultiplier / 2.0) * 2;
  } else {
    costPerCopy = pageCount * effectivePerPage;
  }

  const subtotal = costPerCopy * Math.max(1, copies);
  return {
    page_count: pageCount,
    color_mode: colorMode,
    paper_size: paperSize,
    duplex_mode: duplexMode,
    copies: copies,
    base_rate: baseRate,
    size_surcharge: sizeSurcharge,
    cost_per_copy: Math.round(costPerCopy * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    total_amount: Math.round(subtotal * 100) / 100,
    currency: 'INR'
  };
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  } else if (!body) {
    body = {};
  }

  // Robust path resolution across Vercel routing models
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
  let pathname = (matchedPath || req.url || '').split('?')[0].replace(/\/+$/, '');
  
  if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    pathname = '/api/' + p.replace(/^\/+/, '');
  }

  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
  }
  pathname = pathname.replace(/\/+$/, '');

  const method = req.method;

  // 1. Health
  if (pathname === '/api' || pathname === '/api/health') {
    return res.json({
      status: 'online',
      service: 'SmartPrint Management System API',
      version: '1.0.0',
      architecture: 'Vercel Serverless + Cloud Print Agent Bridge',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Auth Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const user = mockDB.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const center = mockDB.centers.find(c => c.user_id === user.id) || null;
    const token = 'token_' + Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64');
    return res.json({
      success: true,
      token,
      user: { id: user.id, role: user.role, name: user.name, email: user.email, contact_no: user.contact_no },
      center,
      message: 'Login successful'
    });
  }

  // 3. Auth Me
  if (pathname === '/api/auth/me') {
    const authHeader = req.headers.authorization || '';
    if (authHeader.includes('superadmin') || authHeader.includes('usr_admin_01')) {
      return res.json({ success: true, user: mockDB.users[0], center: null });
    }
    return res.json({ success: true, user: mockDB.users[1], center: mockDB.centers[0] });
  }

  // 4. Customer: Get Center by Code
  const centerMatch = pathname.match(/^\/api\/customer\/center\/([^/]+)$/);
  if (centerMatch) {
    const code = centerMatch[1].toUpperCase();
    const center = mockDB.centers.find(c => c.center_code === code || c.id === code) || mockDB.centers[0];
    const queue = mockDB.jobs.filter(j => j.center_id === center.id && ['queued', 'printing'].includes(j.job_status));
    return res.json({
      success: true,
      center: {
        id: center.id,
        center_code: center.center_code,
        name: center.name,
        owner_name: center.owner_name,
        contact_no: center.contact_no,
        address: center.address,
        pricing: {
          bw_price: center.bw_price,
          color_price: center.color_price,
          duplex_multiplier: center.duplex_multiplier,
          a3_surcharge: center.a3_surcharge,
          legal_surcharge: center.legal_surcharge
        },
        active_printers_count: 3,
        queue_wait_minutes: Math.max(1, queue.length * 2),
        available_services: center.available_services
      }
    });
  }

  // 5. Customer: Upload Document
  if (pathname === '/api/customer/upload' && method === 'POST') {
    const sampleName = req.body?.sample_name || 'Uploaded_Document.pdf';
    const pageCount = req.body?.page_count || 6;
    return res.json({
      success: true,
      file_info: {
        document_name: sampleName,
        original_size_kb: pageCount * 180,
        compressed_size_kb: Math.round(pageCount * 80),
        compression_ratio: '55%',
        detected_page_count: pageCount,
        format_valid: true,
        status: 'validated_and_compressed'
      }
    });
  }

  // 6. Customer: Calculate Price
  if (pathname === '/api/customer/calculate-price' && method === 'POST') {
    const { center_code, page_count, color_mode, duplex_mode, paper_size, copies } = req.body || {};
    const center = mockDB.centers.find(c => c.center_code === (center_code || '').toUpperCase()) || mockDB.centers[0];
    const pricing = calculatePrice(center, page_count || 1, color_mode || 'bw', duplex_mode || 'single', paper_size || 'A4', copies || 1);
    return res.json({ success: true, pricing });
  }

  // 7. Customer: Create Order
  if (pathname === '/api/customer/create-order' && method === 'POST') {
    const { center_code, page_count, color_mode, duplex_mode, paper_size, copies } = req.body || {};
    const center = mockDB.centers.find(c => c.center_code === (center_code || '').toUpperCase()) || mockDB.centers[0];
    const pricing = calculatePrice(center, page_count || 1, color_mode || 'bw', duplex_mode || 'single', paper_size || 'A4', copies || 1);
    return res.json({
      success: true,
      order: {
        order_id: 'order_rzp_' + Math.random().toString(36).substring(2, 9),
        amount: pricing.total_amount,
        amount_paise: Math.round(pricing.total_amount * 100),
        currency: 'INR',
        center_name: center.name,
        key_id: 'rzp_test_smartprint_live',
        breakdown: pricing
      }
    });
  }

  // 8. Customer: Verify Payment & Queue Job
  if (pathname === '/api/customer/verify-payment' && method === 'POST') {
    const body = req.body || {};
    const center = mockDB.centers.find(c => c.center_code === (body.center_code || '').toUpperCase()) || mockDB.centers[0];
    const token = 'SP-' + Math.floor(1000 + Math.random() * 9000);
    const job = {
      id: 'job_' + Math.random().toString(36).substring(2, 9),
      center_id: center.id,
      customer_name: body.customer_name || 'Customer',
      customer_phone: body.customer_phone || '+91 9999999999',
      document_name: body.document_name || 'document.pdf',
      page_count: body.page_count || 1,
      color_mode: body.color_mode || 'bw',
      paper_size: body.paper_size || 'A4',
      duplex_mode: body.duplex_mode || 'single',
      copies: body.copies || 1,
      total_amount: body.total_amount || 12.0,
      payment_id: body.payment_id || 'pay_demo',
      payment_status: 'paid',
      job_status: 'queued',
      job_token: token,
      retention_hours: 24,
      created_at: new Date().toISOString()
    };
    mockDB.jobs.unshift(job);
    return res.json({
      success: true,
      message: 'Payment verified successfully. Job entered print queue.',
      job,
      job_token: token,
      receipt: {
        receipt_no: 'INV-' + token,
        center_name: center.name,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount_paid: job.total_amount,
        payment_ref: job.payment_id
      }
    });
  }

  // 9. Center: Dashboard
  if (pathname === '/api/center/dashboard') {
    const center = mockDB.centers[0];
    const queue = mockDB.jobs.filter(j => ['queued', 'printing'].includes(j.job_status));
    return res.json({
      success: true,
      center,
      subscription: mockDB.subscriptions[1],
      metrics: {
        today_revenue: 1420,
        today_jobs: 48,
        queue_count: queue.length,
        active_printers: 3,
        total_printers: 3
      },
      printers: mockDB.printers,
      queue,
      recent_history: mockDB.jobs.slice(0, 5)
    });
  }

  // 10. Center: Queue
  if (pathname === '/api/center/queue') {
    const queue = mockDB.jobs.filter(j => ['queued', 'printing'].includes(j.job_status));
    return res.json({ success: true, queue });
  }

  // 11. Center: Update Job Status
  const statusMatch = pathname.match(/^\/api\/center\/jobs\/([^/]+)\/status$/);
  if (statusMatch && (method === 'PUT' || method === 'POST')) {
    const jobId = statusMatch[1];
    const newStatus = req.body?.status || 'completed';
    const job = mockDB.jobs.find(j => j.id === jobId);
    if (job) job.job_status = newStatus;
    return res.json({ success: true, message: `Job ${jobId} updated to ${newStatus}` });
  }

  // 12. Center: History
  if (pathname === '/api/center/history') {
    return res.json({ success: true, history: mockDB.jobs });
  }

  // 13. Center: Analytics
  if (pathname === '/api/center/analytics') {
    return res.json({
      success: true,
      three_month_revenue: [
        { month: 'Month 1', revenue: 14200, jobs: 840, bw: 650, color: 190 },
        { month: 'Month 2', revenue: 18950, jobs: 1120, bw: 890, color: 230 },
        { month: 'Month 3 (Current)', revenue: 24100, jobs: 1480, bw: 1140, color: 340 }
      ],
      distribution: { bw_jobs: 320, color_jobs: 85, live_total_revenue: 24100 }
    });
  }

  // 14. SuperAdmin: Stats
  if (pathname === '/api/superadmin/stats') {
    return res.json({
      success: true,
      stats: {
        total_centers: mockDB.centers.length,
        active_centers: mockDB.centers.length,
        total_printers: mockDB.printers.length,
        active_printers: mockDB.printers.length,
        total_jobs: mockDB.jobs.length + 120,
        platform_revenue: 57250,
        active_subscriptions: mockDB.subscriptions.length
      },
      recent_centers: mockDB.centers,
      recent_jobs: mockDB.jobs.slice(0, 5)
    });
  }

  // 15. SuperAdmin: Users
  if (pathname === '/api/superadmin/users') {
    const q = ((req.query?.q || '') + '').toLowerCase();
    const filtered = mockDB.centers.filter(c => !q || c.name.toLowerCase().includes(q) || c.center_code.toLowerCase().includes(q));
    return res.json({ success: true, centers: filtered });
  }

  // 16. SuperAdmin: Subscriptions
  if (pathname === '/api/superadmin/subscriptions') {
    return res.json({ success: true, subscriptions: mockDB.subscriptions });
  }

  // 17. Agent: Handshake & Jobs
  if (pathname === '/api/agent/handshake') {
    return res.json({
      success: true,
      agent_status: 'connected',
      session_id: 'agt_sess_' + Math.random().toString(36).substring(2, 9),
      center: mockDB.centers[0],
      printers: mockDB.printers
    });
  }

  if (pathname === '/api/agent/jobs') {
    const queue = mockDB.jobs.filter(j => ['queued', 'spooling'].includes(j.job_status));
    return res.json({ success: true, center_code: 'XC-89412', queue_length: queue.length, jobs: queue });
  }

  if (pathname === '/api/agent/update-status') {
    const { job_id, status } = req.body || {};
    const job = mockDB.jobs.find(j => j.id === job_id);
    if (job) job.job_status = status;
    return res.json({ success: true, message: `Status updated to ${status}` });
  }

  // Fallback
  return res.status(404).json({ success: false, message: `Route not found: ${method} ${pathname}` });
};
