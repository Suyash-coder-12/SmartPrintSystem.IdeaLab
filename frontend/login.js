document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    initTheme();
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // Role Selector Logic
    const roleBtns = document.querySelectorAll('.role-btn');
    let currentRole = 'xerox';

    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.getAttribute('data-role');
        });
    });

    // Form Submission Logic
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        // Mock authentication validation
        let isValid = false;
        if (currentRole === 'xerox' && email === 'admin@xerox.com' && password === 'password123') {
            isValid = true;
        } else if (currentRole === 'admin' && email === 'super@admin.com' && password === 'superpassword') {
            isValid = true;
        }

        if (!isValid) {
            alert('Invalid credentials! Please use the provided test accounts.');
            return;
        }

        const btn = loginForm.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><div class="spinner" style="width:16px;height:16px;border-width:2px;animation-duration:0.6s;"></div> Authenticating...</span>`;
        btn.disabled = true;

        setTimeout(() => {
            if (currentRole === 'xerox') {
                window.location.href = 'shop_admin.html';
            } else {
                window.location.href = 'super_admin.html';
            }
        }, 1200);
    });
});
