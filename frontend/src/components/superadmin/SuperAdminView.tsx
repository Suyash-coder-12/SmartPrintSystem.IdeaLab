import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { XeroxCenter, SubscriptionPlan, PrintJob } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield,
  Building,
  Printer,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Lock,
  User,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'subscriptions' | 'settings' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_centers: 0,
    active_centers: 0,
    total_printers: 0,
    active_printers: 0,
    total_jobs: 0,
    platform_revenue: 0,
    active_subscriptions: 0
  });
  const [centers, setCenters] = useState<XeroxCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);

  // Subscriptions Modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionPlan | null>(null);
  const [subForm, setSubForm] = useState({
    name: '',
    price: 499,
    printer_limit: 2,
    max_jobs: 2000,
    offers_text: '',
    has_analytics: 1,
    has_agent: 1
  });

  // Password & Profile
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileName, setProfileName] = useState(user?.name || 'Super Administrator');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@smartprint.com');
  const [profileContact, setProfileContact] = useState(user?.contact_no || '+91 9876543210');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.superAdmin.getStats();
      if (res.success) {
        setStats(res.stats);
        setRecentJobs(res.recent_jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.superAdmin.getUsers(searchQuery, statusFilter);
      if (res.success) {
        setCenters(res.centers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.superAdmin.getSubscriptions();
      if (res.success) {
        setSubscriptions(res.subscriptions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [searchQuery, statusFilter, activeTab]);

  const handleStatusToggle = async (centerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.superAdmin.updateCenterStatus(centerId, nextStatus);
      fetchUsers();
      fetchDashboard();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await api.superAdmin.updateSubscription(editingSub.id, subForm);
      } else {
        await api.superAdmin.createSubscription(subForm);
      }
      setIsSubModalOpen(false);
      setEditingSub(null);
      fetchSubscriptions();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.superAdmin.deleteSubscription(id);
      fetchSubscriptions();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.auth.changePassword({ old_password: oldPassword, new_password: newPassword });
      setFeedbackMsg(res.message);
      setOldPassword('');
      setNewPassword('');
    } catch (e) {
      setFeedbackMsg('Error: ' + (e as Error).message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.auth.updateProfile({
        name: profileName,
        email: profileEmail,
        contact_no: profileContact
      });
      setFeedbackMsg(res.message);
    } catch (e) {
      setFeedbackMsg('Error: ' + (e as Error).message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Super Admin Executive Header */}
      <div className="glass-panel-elevated p-6 bg-gradient-to-r from-white via-slate-50/80 to-purple-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center pr-1">
            <Shield className="w-9 h-9 text-slate-900" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Super Admin Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                Root Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Tenant Xerox Network Monitoring, Subscriptions & Center Provisioning
            </p>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-medium w-full md:w-auto overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'users', label: 'Users Details', icon: Users },
            { id: 'subscriptions', label: 'Subscription Setup', icon: CreditCard },
            { id: 'settings', label: 'Settings', icon: Lock },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setFeedbackMsg(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-700 font-semibold shadow-xs'
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

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 bg-white/85">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Xerox Centers
                </span>
                <Building className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.total_centers}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  {stats.active_centers} Active
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Network coverage active
              </div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Connected Printers
                </span>
                <Printer className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.total_printers}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  {stats.active_printers} Online
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Spooling agents connected
              </div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Print Jobs
                </span>
                <TrendingUp className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.total_jobs}
                </span>
                <span className="text-xs font-medium text-purple-600">Processed</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Encrypted & auto-trashed
              </div>
            </div>

            <div className="glass-panel p-5 bg-white/85">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Platform Volume
                </span>
                <CreditCard className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  ₹{stats.platform_revenue.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-amber-600">INR</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Via Razorpay Gateway
              </div>
            </div>
          </div>

          {/* Quick Overview Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Print Jobs */}
            <div className="glass-panel p-5 bg-white/85">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Recent Platform Print Jobs</span>
                <button
                  onClick={fetchDashboard}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </h3>
              <div className="space-y-2.5">
                {recentJobs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No recent jobs logged</p>
                ) : (
                  recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{job.job_token}</span>
                          <span className="text-slate-500 font-medium truncate max-w-[180px]">
                            {job.document_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {job.customer_name} • {job.page_count} pgs • {job.color_mode.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">₹{job.total_amount}</span>
                        <div className="mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              job.job_status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : job.job_status === 'printing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {job.job_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Subscriptions Snapshot */}
            <div className="glass-panel p-5 bg-white/85">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Active Subscription Tiers</span>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="text-xs text-purple-600 hover:underline font-semibold"
                >
                  Manage Plans &rarr;
                </button>
              </h3>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        {sub.offers_text && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {sub.offers_text}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Up to {sub.printer_limit} Printers • {sub.max_jobs} Jobs/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">₹{sub.price}</span>
                      <span className="text-[10px] text-slate-500 block">/{sub.billing_cycle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS DETAILS */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 bg-white/90 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Xerox Centers & Vendors Directory</h3>
              <p className="text-xs text-slate-500">
                Manage stores, monitor activity, and toggle live platform verification
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search store, email, code..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input text-slate-800"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="p-3.5">Center Code</th>
                  <th className="p-3.5">Store / Business Name</th>
                  <th className="p-3.5">Owner & Contact</th>
                  <th className="p-3.5">Pricing (B/W / Color)</th>
                  <th className="p-3.5">Jobs Total</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No Xerox Centers matching search query
                    </td>
                  </tr>
                ) : (
                  centers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">
                        {c.center_code}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-xs">{c.address}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 block">{c.owner_name}</span>
                        <span className="text-[11px] text-slate-500">{c.email}</span>
                      </td>
                      <td className="p-3.5 font-mono">
                        ₹{c.bw_price} / ₹{c.color_price}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {c.total_jobs_count || 0}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleStatusToggle(c.id, c.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            c.status === 'active'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {c.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION SETUP */}
      {activeTab === 'subscriptions' && (
        <div className="glass-panel p-6 bg-white/90 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subscription Plans & Vendor Tier Setup</h3>
              <p className="text-xs text-slate-500">
                Configure SaaS pricing tiers, hardware limitations, and promotional offers
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSub(null);
                setSubForm({
                  name: '',
                  price: 599,
                  printer_limit: 2,
                  max_jobs: 2000,
                  offers_text: '',
                  has_analytics: 1,
                  has_agent: 1
                });
                setIsSubModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {subscriptions.map((plan) => (
              <div
                key={plan.id}
                className="relative p-5 rounded-2xl glass-panel-interactive bg-white/80 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{plan.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                      {plan.billing_cycle}
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-2xl font-extrabold text-slate-900">₹{plan.price}</span>
                    <span className="text-xs text-slate-500"> /month</span>
                  </div>

                  {plan.offers_text && (
                    <div className="mb-3 p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{plan.offers_text}</span>
                    </div>
                  )}

                  <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Max {plan.printer_limit} Physical Printers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Up to {plan.max_jobs} Print Jobs / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Local Print Agent Connector</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>3-Month Revenue Analytics</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Subscribers: <strong className="text-slate-700">{plan.subscribers_count || 0}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSub(plan);
                        setSubForm({
                          name: plan.name,
                          price: plan.price,
                          printer_limit: plan.printer_limit,
                          max_jobs: plan.max_jobs,
                          offers_text: plan.offers_text || '',
                          has_analytics: plan.has_analytics ? 1 : 0,
                          has_agent: plan.has_agent ? 1 : 0
                        });
                        setIsSubModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubscription(plan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Plan Modal */}
          {isSubModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-md glass-panel-elevated p-6 bg-white text-slate-800 shadow-2xl">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  {editingSub ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <form onSubmit={handleSaveSubscription} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={subForm.name}
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                      placeholder="e.g. Campus Network Hub"
                      className="w-full p-2.5 rounded-xl glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Price (₹/mo)</label>
                      <input
                        type="number"
                        required
                        value={subForm.price}
                        onChange={(e) => setSubForm({ ...subForm, price: parseFloat(e.target.value) })}
                        className="w-full p-2.5 rounded-xl glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Max Printers</label>
                      <input
                        type="number"
                        value={subForm.printer_limit}
                        onChange={(e) => setSubForm({ ...subForm, printer_limit: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-xl glass-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Offers / Badge Text</label>
                    <input
                      type="text"
                      value={subForm.offers_text}
                      onChange={(e) => setSubForm({ ...subForm, offers_text: e.target.value })}
                      placeholder="e.g. Free Acrylic Standee on signup"
                      className="w-full p-2.5 rounded-xl glass-input"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSubModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    >
                      Save Plan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS (Password Change) */}
      {activeTab === 'settings' && (
        <div className="glass-panel p-6 bg-white/90 max-w-xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Password Settings</h3>
            <p className="text-xs text-slate-500">
              Update root administrative credentials and security tokens
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-6 bg-white/90 max-w-xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Super Administrator Profile</h3>
            <p className="text-xs text-slate-500">
              Primary administrative contact details
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Admin Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={profileContact}
                onChange={(e) => setProfileContact(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
