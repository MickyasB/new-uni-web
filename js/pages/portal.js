// js/pages/portal.js — Candidate & Student Application Management Portal
import state from '../state.js';
import api from '../api.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const fallbackNotifications = [
  { id: 1, type: 'info', title: 'Application Registered', message: 'Your application for the Undergraduate Full Scholarship has been recorded in the Edinburgh admissions system.', time: 'Just now', read: false },
  { id: 2, type: 'success', title: 'Document Verification Complete', message: 'Academic transcript and passport identity verified by Admissions Office.', time: '1 day ago', read: true },
  { id: 3, type: 'info', title: 'Faculty Committee Review Stage', message: 'Your application has been assigned to the Faculty Board for scoring and interview scheduling.', time: '2 days ago', read: true }
];

const STAGES = ['Submitted', 'Eligibility Check', 'Faculty Review', 'Committee Decision', 'Awarded/Decision'];

function getStatusBadge(status) {
  const badgeMap = {
    'SUBMITTED': '<span class="badge badge-info" style="font-size: 12px; padding: 4px 10px;">SUBMITTED</span>',
    'UNDER_REVIEW': '<span class="badge badge-warning" style="font-size: 12px; padding: 4px 10px; color: #10263B;">UNDER REVIEW</span>',
    'ACTION_REQUIRED': '<span class="badge badge-danger" style="font-size: 12px; padding: 4px 10px;">ACTION REQUIRED</span>',
    'AWARDED': '<span class="badge badge-success" style="font-size: 12px; padding: 4px 10px;">AWARDED 🏆</span>',
    'REJECTED': '<span class="badge badge-grey" style="font-size: 12px; padding: 4px 10px;">DECLINED</span>'
  };
  return badgeMap[status] || '<span class="badge badge-info">SUBMITTED</span>';
}

function getTimeline(status) {
  let currentStep = 1;
  if (status === 'SUBMITTED') currentStep = 1;
  if (status === 'UNDER_REVIEW') currentStep = 3;
  if (status === 'ACTION_REQUIRED') currentStep = 2;
  if (status === 'AWARDED' || status === 'REJECTED') currentStep = 5;

  let html = '<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 11px;">';
  STAGES.forEach((stage, idx) => {
    const isPast = idx < currentStep;
    const isCurrent = idx === currentStep - 1;
    const bg = isPast ? 'var(--color-success)' : isCurrent ? 'var(--color-secondary)' : 'var(--color-light-grey)';
    const textCol = isPast || isCurrent ? 'var(--color-primary)' : 'var(--color-slate)';

    html += `
      <div style="display: flex; flex-direction: column; align-items: center; width: 20%; text-align: center;">
        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; margin-bottom: 4px;">
          ${isPast ? '✓' : idx + 1}
        </div>
        <span style="color: ${textCol}; font-weight: ${isCurrent ? '700' : '500'}; line-height: 1.2;">${stage}</span>
      </div>
    `;
    if (idx < STAGES.length - 1) {
      const lineBg = idx < currentStep - 1 ? 'var(--color-success)' : 'var(--color-light-grey)';
      html += `<div style="flex: 1; height: 3px; background: ${lineBg}; margin: 0 4px 14px;"></div>`;
    }
  });
  html += '</div>';
  return html;
}

const Portal = {
  render: function (container, params) {
    const user = state.getState ? state.getState().user : (state.user || null);

    if (!user) {
      container.innerHTML = `
        <div style="min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔒</div>
          <h2 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 2rem; margin-bottom: 8px;">Applicant Authentication Required</h2>
          <p style="color: var(--color-slate); font-size: 1rem; max-width: 480px; margin: 0 auto 1.5rem;">Please sign into your candidate account to track your submitted scholarship applications.</p>
          <a href="#/login" class="btn btn-primary" style="padding: 10px 24px;">Sign In to MyEd Portal</a>
        </div>
      `;
      return;
    }

    const defaultApps = [
      {
        id: 'ED-SCH-2026-9182',
        title: 'Ada Lovelace & Alan Turing Undergraduate Full Scholarship in CS & AI',
        amount: '100% Tuition + £9,500/yr Living Stipend',
        submitted: '25 August 2026',
        status: 'SUBMITTED',
        score: null,
        faculty: 'Science',
        field: 'Computer Science'
      },
      {
        id: 'ED-SCH-2026-8841',
        title: 'Edinburgh Data-Driven Innovation (DDI) Full Fellowship',
        amount: '100% Tuition + £8,500/yr Stipend',
        submitted: '24 August 2026',
        status: 'UNDER_REVIEW',
        score: null,
        faculty: 'Science',
        field: 'Data Science'
      }
    ];

    let userApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('all_applications') || '[]');
      const userEmail = (user?.email || '').toLowerCase();
      userApps = stored
        .filter(a => !userEmail || (a.email && a.email.toLowerCase() === userEmail))
        .map(a => ({
          id: a.id || ('ED-SCH-' + Date.now().toString().slice(-4)),
          title: a.subtitle || a.title || 'Scholarship Application',
          amount: '100% Tuition Waiver + Stipend',
          submitted: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
          status: 'SUBMITTED',
          score: null,
          faculty: 'Faculty Board',
          field: a.subtitle || 'Scholarship'
        }));
    } catch(e){}

    const applications = [...userApps, ...defaultApps];

    const unreadCount = fallbackNotifications.filter(n => !n.read).length;
    const displayName = user.fullName || user.name || (user.email ? user.email.split('@')[0] : 'Applicant');

    container.innerHTML = `
      <div class="portal-page font-body" style="background: var(--color-bg-alt); min-height: 100vh; padding: 2.5rem 1rem 5rem;">
        <div class="container" style="max-width: 1100px; margin: 0 auto;">
          
          <!-- Portal Header -->
          <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1.25rem;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,163,136,0.15); border: 1px solid var(--color-secondary); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: var(--color-secondary-dark); margin-bottom: 8px;">
                Verified Student ID: ${user.studentId || 'ED-2026-8841'} &bull; ${user.country || 'International'}
              </div>
              <h1 style="font-family: var(--font-heading); color: var(--color-primary); font-size: clamp(1.8rem, 3vw, 2.5rem); margin: 0 0 4px;">
                Welcome back, ${displayName}
              </h1>
              <p style="color: var(--color-slate); font-size: 1rem; margin: 0;">
                MyEd Official Scholarship & Admission Status Tracker &bull; 2026/27 Academic Year
              </p>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="#/scholarships" class="btn btn-secondary" style="padding: 10px 20px; font-size: 0.9rem;">
                + Apply for Another Award
              </a>
              <a href="#/logout" class="btn btn-outline" style="padding: 10px 16px; font-size: 0.9rem;">
                Sign Out
              </a>
            </div>
          </header>

          <!-- Notifications Section -->
          <div class="card" style="background: white; border-radius: 10px; border: 1px solid var(--color-light-grey); margin-bottom: 2rem; overflow: hidden;">
            <div id="notification-toggle" style="padding: 1rem 1.25rem; background: var(--color-bg-alt); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--color-light-grey);">
              <h3 style="margin: 0; font-size: 1.05rem; color: var(--color-primary); display: flex; align-items: center; gap: 8px;">
                <span>🔔 Admissions Notifications</span>
                ${unreadCount > 0 ? `<span class="badge badge-urgent" style="font-size: 11px; padding: 2px 8px;">${unreadCount} New</span>` : ''}
              </h3>
              <span id="notification-icon" style="color: var(--color-slate); font-size: 12px; transition: transform 0.2s;">▼</span>
            </div>

            <div id="notification-list" style="display: block;">
              ${fallbackNotifications.map(notif => `
                <div class="notification-item" data-id="${notif.id}" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-light-grey); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; ${!notif.read ? 'background: #FFFDF5;' : ''}">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="font-size: 1.3rem;">${notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '✅' : 'ℹ️'}</div>
                    <div>
                      <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">${notif.title}</div>
                      <p style="margin: 4px 0 0; color: var(--color-slate); font-size: 0.88rem; line-height: 1.4;">${notif.message}</p>
                      <span style="font-size: 0.75rem; color: #9AA5B1; margin-top: 4px; display: inline-block;">${notif.time}</span>
                    </div>
                  </div>
                  <div>
                    ${!notif.read ? `<button class="mark-read-btn" style="background: none; border: none; color: var(--color-secondary-dark); font-size: 0.8rem; font-weight: 600; cursor: pointer; text-decoration: underline;">Mark read</button>` : `<span style="font-size: 0.75rem; color: var(--color-success); font-weight: 700;">Read ✓</span>`}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Active Applications Grid -->
          <h2 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.4rem; margin-bottom: 1rem;">
            Active Scholarship Applications (${applications.length})
          </h2>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
            ${applications.map(app => `
              <div class="card" id="card-${app.id}" style="background: white; border-radius: 10px; border: 1px solid var(--color-light-grey); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px;">
                    <span class="badge badge-blue">Faculty of ${app.faculty}</span>
                    ${getStatusBadge(app.status)}
                  </div>

                  <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.15rem; margin: 4px 0 6px; line-height: 1.3;">
                    ${app.title}
                  </h3>

                  <div style="font-weight: 700; color: var(--color-accent-gold-dark); font-size: 0.95rem; font-family: var(--font-mono); margin-bottom: 12px;">
                    ${app.amount}
                  </div>

                  <div style="font-size: 0.82rem; color: var(--color-slate); margin-bottom: 1rem;">
                    Application Reference: <strong>${app.id}</strong> &bull; Submitted ${app.submitted}
                  </div>

                  <div style="background: var(--color-bg-alt); padding: 12px; border-radius: 8px; border: 1px solid var(--color-light-grey); margin-bottom: 1.25rem;">
                    <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--color-slate); margin-bottom: 6px;">Evaluation Progress</div>
                    ${getTimeline(app.status)}
                  </div>
                </div>

                <div style="display: flex; gap: 8px; border-top: 1px solid var(--color-light-grey); pt: 12px; padding-top: 12px;">
                  <button class="btn btn-outline view-details-btn" data-id="${app.id}" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                    View Summary &bull; ID
                  </button>
                  <button class="btn btn-primary upload-doc-btn" data-id="${app.id}" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                    Submit Documents
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </div>
    `;

    this.init();
  },

  init: function () {
    const toggle = document.getElementById('notification-toggle');
    const list = document.getElementById('notification-list');
    const icon = document.getElementById('notification-icon');

    if (toggle && list) {
      toggle.addEventListener('click', () => {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        if (icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    }

    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.notification-item');
        if (item) item.style.background = 'white';
        e.target.outerHTML = '<span style="font-size: 0.75rem; color: var(--color-success); font-weight: 700;">Read ✓</span>';
        showToast('Notification marked as read', 'success');
      });
    });

    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal({
          title: `Application Reference: ${id}`,
          content: `
            <div style="font-size: 0.92rem; line-height: 1.6; color: var(--color-primary);">
              <p><strong>Candidate Status:</strong> Active &bull; Under Faculty Review</p>
              <p><strong>University:</strong> The University of Edinburgh</p>
              <p><strong>Cycle:</strong> 2026/27 Academic Year</p>
              <p style="margin-top: 12px; color: var(--color-slate); font-size: 0.85rem;">
                Official committee evaluation outcomes and award notification letters will be sent directly to your registered email address and updated in this MyEd portal.
              </p>
            </div>
          `,
          footer: `<button class="btn btn-primary modal-close-btn" style="padding: 8px 20px;">Close Window</button>`
        });

        document.querySelector('.modal-close-btn')?.addEventListener('click', () => closeModal());
      });
    });

    document.querySelectorAll('.upload-doc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        showModal({
          title: 'Supplementary Document Upload',
          content: `
            <div style="font-size: 0.9rem;">
              <p style="color: var(--color-slate); margin-bottom: 12px;">Upload updated transcripts, certificates, or recommendation letters for committee review.</p>
              <div style="border: 2px dashed var(--color-medium-grey); border-radius: 8px; padding: 1.5rem; text-align: center; background: var(--color-bg-alt); cursor: pointer; transition: all 0.2s;" id="modal-dropzone">
                <div style="font-size: 2rem; margin-bottom: 6px;">📁</div>
                <p style="margin: 0; font-weight: 600; color: var(--color-primary);" id="modal-file-status">Click or Drag & Drop Supplementary PDF Files</p>
                <p style="margin: 4px 0 0; font-size: 0.78rem; color: var(--color-slate);">Accepted: PDF, PNG, JPG (Max 10MB)</p>
                <input type="file" id="modal-file-input" accept=".pdf,.png,.jpg,.jpeg" style="display:none;">
              </div>
            </div>
          `,
          footer: `
            <button class="btn btn-outline modal-close-btn" style="padding: 8px 16px;">Cancel</button>
            <button class="btn btn-secondary" id="btn-modal-upload-confirm" style="padding: 8px 20px;">Submit to Committee</button>
          `
        });

        const dropzone = document.getElementById('modal-dropzone');
        const fileInput = document.getElementById('modal-file-input');
        const statusText = document.getElementById('modal-file-status');
        let selectedFile = null;

        if (dropzone && fileInput) {
          dropzone.addEventListener('click', () => fileInput.click());
          fileInput.addEventListener('change', (ev) => {
            if (ev.target.files.length) {
              selectedFile = ev.target.files[0];
              statusText.textContent = `Selected: ${selectedFile.name} (${(selectedFile.size/1024/1024).toFixed(2)} MB)`;
            }
          });
          dropzone.addEventListener('dragover', (ev) => {
            ev.preventDefault();
            dropzone.style.borderColor = 'var(--color-secondary)';
            dropzone.style.background = '#E8F4F8';
          });
          dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'var(--color-medium-grey)';
            dropzone.style.background = 'var(--color-bg-alt)';
          });
          dropzone.addEventListener('drop', (ev) => {
            ev.preventDefault();
            dropzone.style.borderColor = 'var(--color-medium-grey)';
            dropzone.style.background = 'var(--color-bg-alt)';
            if (ev.dataTransfer.files.length) {
              selectedFile = ev.dataTransfer.files[0];
              statusText.textContent = `Selected: ${selectedFile.name} (${(selectedFile.size/1024/1024).toFixed(2)} MB)`;
            }
          });
        }

        document.querySelector('.modal-close-btn')?.addEventListener('click', () => closeModal());
        document.getElementById('btn-modal-upload-confirm')?.addEventListener('click', () => {
          closeModal();
          showToast(selectedFile ? `Supplementary document "${selectedFile.name}" received by Faculty Board ✓` : 'Supplementary documents received by Faculty Board ✓', 'success');
        });
      });
    });
  }
};

export default Portal;
