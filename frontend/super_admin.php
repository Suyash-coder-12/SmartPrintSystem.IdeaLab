<?php
session_start();
// Super Admin Dashboard (luckystrike)
if (!isset($_SESSION['logged_in']) || $_SESSION['user_type'] !== 'superadmin') {
    header('Location: login.php');
    exit;
}
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuperAdmin Portal | Smart Print</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <!-- Chart.js for beautiful analytics -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        /* SUPER ADMIN UNIQUE THEME - TOP NAVIGATION */
        :root {
            --sa-primary: #5e3fc9;
            --sa-light: #f3f0ff;
            --sa-accent: #facc15;
            --text-main: #000000;
            --text-muted: #000000;
        }
        
        body {
            background-color: #f8f9fc;
            background-image: radial-gradient(at 0% 0%, rgba(94, 63, 201, 0.1) 0px, transparent 50%),
                              radial-gradient(at 100% 0%, rgba(250, 204, 21, 0.1) 0px, transparent 50%);
            display: block;
            overflow-y: auto;
        }
        
        .sa-header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(94, 63, 201, 0.1);
            padding: 15px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }

        .sa-brand {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 24px;
            font-weight: 800;
            color: var(--sa-primary);
        }

        .sa-nav {
            display: flex;
            gap: 10px;
        }

        .sa-nav-item {
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: 600;
            color: var(--text-muted);
            text-decoration: none;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sa-nav-item:hover, .sa-nav-item.active {
            background: var(--sa-primary);
            color: white;
            box-shadow: 0 10px 20px rgba(94, 63, 201, 0.3);
            transform: translateY(-2px);
        }

        .sa-container {
            max-width: 1400px;
            margin: 40px auto;
            padding: 0 20px;
            animation: slideUpFade 0.6s ease;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 30px;
            padding: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 15px 35px rgba(94, 63, 201, 0.05);
            border: 1px solid rgba(255,255,255,0.5);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(94, 63, 201, 0.1); }

        .stat-info h3 { color: var(--text-muted); font-size: 15px; margin-bottom: 8px; font-weight: 600; }
        .stat-info .value { font-size: 36px; font-weight: 800; color: var(--text-main); }
        .stat-info .trend { color: #10b981; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 4px; margin-top: 5px; }

        .stat-icon {
            width: 70px; height: 70px;
            border-radius: 20px;
            background: var(--sa-light);
            color: var(--sa-primary);
            display: flex; align-items: center; justify-content: center;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }

        .sa-panel {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(15px);
            border-radius: 30px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.5);
            box-shadow: 0 15px 35px rgba(94, 63, 201, 0.05);
        }

        .sa-panel h3 { font-size: 20px; font-weight: 800; margin-bottom: 25px; color: var(--text-main); }

        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        th { color: var(--text-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 0 15px 10px 15px; border: none; }
        td { background: white; padding: 20px 15px; }
        td:first-child { border-radius: 15px 0 0 15px; font-weight: 700; color: var(--sa-primary); }
        td:last-child { border-radius: 0 15px 15px 0; }
        tr { box-shadow: 0 5px 15px rgba(0,0,0,0.02); transition: transform 0.2s; }
        tr:hover { transform: scale(1.01); box-shadow: 0 8px 20px rgba(94,63,201,0.08); }

        .badge-active { background: #d1fae5; color: #059669; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; }
        
        @media (max-width: 900px) {
            .sa-header { flex-direction: column; gap: 20px; padding: 20px; }
            .sa-nav { flex-wrap: wrap; justify-content: center; }
            .dashboard-grid { grid-template-columns: 1fr; }
        }

        .view-section { display: none; animation: slideUpFade 0.4s ease; }
        .view-section.active-view { display: block; }
    </style>
</head>
<body>
    <!-- Top Navigation for Global Platform Control -->
    <header class="sa-header">
        <div class="sa-brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            SuperAdmin Portal
        </div>
        
        <nav class="sa-nav">
            <a href="#overview" class="sa-nav-item active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Overview</a>
            <a href="#shops" class="sa-nav-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> Shops</a>
            <a href="#revenue" class="sa-nav-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Revenue</a>
            <a href="#settings" class="sa-nav-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</a>
        </nav>

        <div style="display:flex; align-items:center; gap:15px;">
            <div style="text-align:right;">
                <div style="font-weight:700; color:var(--text-main);">Platform Root</div>
                <div style="font-size:12px; color:var(--sa-primary); font-weight:600;">System Online</div>
            </div>
            <img src="https://ui-avatars.com/api/?name=Root+Admin&background=5e3fc9&color=fff&rounded=true" width="45" alt="Admin">
            <a href="?logout=1" style="background:#fef2f2; color:#ef4444; padding:10px; border-radius:50%; margin-left:10px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </a>
        </div>
    </header>

    <main class="sa-container">
        
        <!-- OVERVIEW SECTION -->
        <div id="view-overview" class="view-section active-view">
        <!-- High-level stats -->
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Active Xerox Shops</h3>
                    <div class="value">142</div>
                    <div class="trend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +12% this month</div>
                </div>
                <div class="stat-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></div>
            </div>

            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Global Prints</h3>
                    <div class="value">845.2K</div>
                    <div class="trend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +5.4% this week</div>
                </div>
                <div class="stat-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
            </div>

            <div class="stat-card">
                <div class="stat-info">
                    <h3>Platform Revenue</h3>
                    <div class="value">₹12.4M</div>
                    <div class="trend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +22% this year</div>
                </div>
                <div class="stat-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Left Panel: Manage Admins -->
            <div class="sa-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>Manage Shop Admins</h3>
                </div>
                
                <div style="background: var(--sa-light); padding: 20px; border-radius: 20px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: var(--sa-primary);">Register New Shop</h4>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" placeholder="Shop Name" style="flex:1; padding:10px; border-radius:10px; border:1px solid #ddd; outline:none;">
                        <input type="email" placeholder="Admin Email" style="flex:1; padding:10px; border-radius:10px; border:1px solid #ddd; outline:none;">
                        <button style="background:var(--sa-primary); color:white; border:none; padding:10px 20px; border-radius:10px; font-weight:700; cursor:pointer;">Create</button>
                    </div>
                </div>

                <div>
                    <h4 style="margin-bottom: 15px; color: var(--text-muted);">Quick Actions</h4>
                    <div style="display: flex; gap: 10px;">
                        <button style="background: white; border: 1px solid #ddd; padding: 10px 15px; border-radius: 10px; font-weight: 600; cursor: pointer;">Suspend a Shop</button>
                        <button style="background: white; border: 1px solid #ddd; padding: 10px 15px; border-radius: 10px; font-weight: 600; cursor: pointer;">Reset Passwords</button>
                    </div>
                </div>
            </div>

            <!-- Right List -->
            <div class="sa-panel">
                <h3>Top Performing Shops</h3>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:white; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.02);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:40px; height:40px; background:#fef3c7; color:#d97706; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">1</div>
                            <div>
                                <div style="font-weight:700;">City Print Hub</div>
                                <div style="font-size:12px; color:var(--text-muted);">Mumbai • 12k prints</div>
                            </div>
                        </div>
                        <div style="font-weight:800; color:var(--sa-primary);">₹4.2L</div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:white; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.02);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:40px; height:40px; background:#e0f2fe; color:#0369a1; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">2</div>
                            <div>
                                <div style="font-weight:700;">Quick Xerox</div>
                                <div style="font-size:12px; color:var(--text-muted);">Delhi • 9.4k prints</div>
                            </div>
                        </div>
                        <div style="font-weight:800; color:var(--sa-primary);">₹3.1L</div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:white; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.02);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:40px; height:40px; background:#f3f4f6; color:#4b5563; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">3</div>
                            <div>
                                <div style="font-weight:700;">Campus Printers</div>
                                <div style="font-size:12px; color:var(--text-muted);">Pune • 8.1k prints</div>
                            </div>
                        </div>
                        <div style="font-weight:800; color:var(--sa-primary);">₹2.8L</div>
                    </div>

                </div>
            </div>
        </div>

        <div class="sa-panel" style="margin-top: 30px;">
            <h3>Recent Shop Registrations</h3>
            <table>
                <thead>
                    <tr>
                        <th>Shop ID</th>
                        <th>Owner Name</th>
                        <th>Location</th>
                        <th>Subscription Plan</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#SP-1092</td>
                        <td>Rahul Sharma</td>
                        <td>Andheri East, Mumbai</td>
                        <td><span style="background:var(--sa-light); color:var(--sa-primary); padding:4px 10px; border-radius:10px; font-weight:700; font-size:12px;">Enterprise</span></td>
                        <td><span class="badge-active">Verified</span></td>
                        <td><button onclick="openManageModal('#SP-1092', 'Rahul Sharma')" style="background:none; border:none; color:var(--sa-primary); font-weight:700; cursor:pointer;">Manage</button></td>
                    </tr>
                    <tr>
                        <td>#SP-1091</td>
                        <td>Priya Patel</td>
                        <td>Koramangala, Blr</td>
                        <td><span style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:10px; font-weight:700; font-size:12px;">Basic</span></td>
                        <td><span class="badge-active">Verified</span></td>
                        <td><button onclick="openManageModal('#SP-1091', 'Priya Patel')" style="background:none; border:none; color:var(--sa-primary); font-weight:700; cursor:pointer;">Manage</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        </div> <!-- End Overview -->

        <!-- SHOPS SECTION -->
        <div id="view-shops" class="view-section">
            <div class="sa-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>All Registered Shops</h3>
                    <input type="text" placeholder="Search shops..." style="padding:10px 15px; border-radius:10px; border:1px solid #ddd; outline:none; width:250px;">
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Shop ID</th>
                            <th>Owner Name</th>
                            <th>Location</th>
                            <th>Subscription Plan</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#SP-1092</td>
                            <td>Rahul Sharma</td>
                            <td>Andheri East, Mumbai</td>
                            <td><span style="background:var(--sa-light); color:var(--sa-primary); padding:4px 10px; border-radius:10px; font-weight:700; font-size:12px;">Enterprise</span></td>
                            <td><span class="badge-active">Verified</span></td>
                            <td><button onclick="openManageModal('#SP-1092', 'Rahul Sharma')" style="background:none; border:none; color:var(--sa-primary); font-weight:700; cursor:pointer;">Manage</button></td>
                        </tr>
                        <tr>
                            <td>#SP-1091</td>
                            <td>Priya Patel</td>
                            <td>Koramangala, Blr</td>
                            <td><span style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:10px; font-weight:700; font-size:12px;">Basic</span></td>
                            <td><span class="badge-active">Verified</span></td>
                            <td><button onclick="openManageModal('#SP-1091', 'Priya Patel')" style="background:none; border:none; color:var(--sa-primary); font-weight:700; cursor:pointer;">Manage</button></td>
                        </tr>
                        <tr>
                            <td>#SP-1088</td>
                            <td>Amit Kumar</td>
                            <td>Connaught Place, Delhi</td>
                            <td><span style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:10px; font-weight:700; font-size:12px;">Basic</span></td>
                            <td><span class="badge-active" style="background:#fef2f2; color:#ef4444;">Suspended</span></td>
                            <td><button onclick="openManageModal('#SP-1088', 'Amit Kumar')" style="background:none; border:none; color:var(--sa-primary); font-weight:700; cursor:pointer;">Manage</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- REVENUE SECTION -->
        <div id="view-revenue" class="view-section">
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>This Month</h3>
                        <div class="value">₹1.2M</div>
                        <div class="trend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +15% vs last month</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>Pending Payouts</h3>
                        <div class="value">₹345K</div>
                        <div class="trend" style="color:var(--text-muted);">To be cleared by Friday</div>
                    </div>
                </div>
            </div>
            <div class="sa-panel">
                <h3>Recent Transactions</h3>
                <div style="text-align:center; padding:40px; color:var(--text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px; opacity:0.5;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <p>No transactions yet for today.</p>
                </div>
            </div>
        </div>

        <!-- SETTINGS SECTION -->
        <div id="view-settings" class="view-section">
            <div class="sa-panel" style="max-width: 600px;">
                <h3>Platform Settings</h3>
                <div style="display:flex; flex-direction:column; gap:20px; margin-top:20px;">
                    <div>
                        <label style="display:block; font-weight:600; margin-bottom:8px; color:var(--text-muted);">Base Commission Rate (%)</label>
                        <input type="number" value="15" style="width:100%; padding:12px 15px; border-radius:10px; border:1px solid #ddd; outline:none; font-weight:700;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:600; margin-bottom:8px; color:var(--text-muted);">Default Plan for New Shops</label>
                        <select style="width:100%; padding:12px 15px; border-radius:10px; border:1px solid #ddd; outline:none; font-weight:700; background:white;">
                            <option>Basic</option>
                            <option>Pro</option>
                            <option>Enterprise</option>
                        </select>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" id="auto_approve" checked style="width:18px; height:18px;">
                        <label for="auto_approve" style="font-weight:600; color:var(--text-main);">Auto-approve new shop registrations</label>
                    </div>
                    <button style="background:var(--sa-primary); color:white; border:none; padding:15px; border-radius:15px; font-weight:700; font-size:16px; cursor:pointer; margin-top:10px;">Save Changes</button>
                </div>
            </div>
        </div>
    </main>

    <!-- Manage Subscription Modal -->
    <div id="manageModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; justify-content:center; align-items:center; backdrop-filter:blur(5px);">
        <div style="background:white; padding:30px; border-radius:20px; width:400px; box-shadow:0 20px 40px rgba(0,0,0,0.2); animation:slideUpFade 0.3s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-weight:800; font-size:20px;">Manage Subscription</h3>
                <button onclick="closeManageModal()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom:20px;">
                <div style="font-weight:700; color:var(--text-main);" id="modalShopName">Shop Name</div>
                <div style="font-size:12px; color:var(--text-muted);" id="modalShopId">#SP-0000</div>
            </div>

            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:600; margin-bottom:8px; color:var(--text-muted);">Change Plan</label>
                <select style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd; outline:none; font-weight:700; background:white;">
                    <option value="Basic">Basic (₹999/mo)</option>
                    <option value="Pro">Pro (₹1999/mo)</option>
                    <option value="Enterprise">Enterprise (₹4999/mo)</option>
                </select>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button style="flex:1; background:#fef2f2; color:#ef4444; border:none; padding:12px; border-radius:10px; font-weight:700; cursor:pointer;">Suspend</button>
                <button style="flex:1; background:var(--sa-primary); color:white; border:none; padding:12px; border-radius:10px; font-weight:700; cursor:pointer;" onclick="closeManageModal()">Save</button>
            </div>
        </div>
    </div>

    <script>
        function openManageModal(shopId, shopName) {
            document.getElementById('modalShopId').innerText = shopId;
            document.getElementById('modalShopName').innerText = shopName;
            document.getElementById('manageModal').style.display = 'flex';
        }
        
        function closeManageModal() {
            document.getElementById('manageModal').style.display = 'none';
        }

        // Navigation Logic
        document.querySelectorAll('.sa-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent jump to top
                
                // Remove active from all nav items
                document.querySelectorAll('.sa-nav-item').forEach(n => n.classList.remove('active'));
                
                // Add active to clicked nav item
                e.currentTarget.classList.add('active');
                
                // Get target view id
                const targetId = e.currentTarget.getAttribute('href').replace('#', 'view-');
                
                // Hide all views
                document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
                
                // Show target view
                const targetView = document.getElementById(targetId);
                if(targetView) {
                    targetView.classList.add('active-view');
                }
            });
        });
    </script>
</body>
</html>
