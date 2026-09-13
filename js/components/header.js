// js/components/header.js — Authentic University of Edinburgh Header
import { state } from '../state.js';

export function render() {
  const user = state.getState ? state.getState().user : state.user;
  const isAuth = !!user;
  const isStaff = isAuth && (user.role === 'ADMIN' || user.role === 'REVIEWER');
  const isStudent = isAuth && user.role === 'STUDENT';
  const userLabel = user ? (user.fullName || user.email.split('@')[0]) : 'Sign In';

  return `
    <!-- Top Urgent Scholarship Deadline Bar -->
    <div class="deadline-urgent-banner">
      <span>⏳ <strong>2026/27 SCHOLARSHIPS:</strong> 6-Day Urgent Deadlines Active for Undergraduate & Masters Awards.</span>
      <a href="#/scholarships?urgent=true">Explore 6-Day Closing Grants &rarr;</a>
    </div>

    <header id="main-header" class="header">
      <!-- Global Campuses & University Top Bar -->
      <div class="header-topbar">
        <div class="topbar-content">
          <div class="topbar-left">
            <span><strong>Edinburgh Campuses:</strong></span>
            <a href="#/" title="Central Area & Old College">Central Area</a>
            <span class="topbar-divider">&bull;</span>
            <a href="#/" title="King's Buildings Science & Engineering">King's Buildings</a>
            <span class="topbar-divider">&bull;</span>
            <a href="#/" title="Edinburgh BioQuarter Health & Medicine">BioQuarter</a>
            <span class="topbar-divider">&bull;</span>
            <a href="#/" title="Easter Bush Veterinary Campus">Easter Bush</a>
          </div>
          
          <div class="topbar-right">
            <span class="topbar-badge" style="background: var(--color-secondary); color: white;">World Top 30</span>
            <a href="#/academics">Study</a>
            <a href="#/research">Research</a>
            <a href="#/campus-life">Accommodation</a>
            ${!isStaff ? `
              <span class="topbar-divider">|</span>
              <a href="#/portal" style="color: #FFF; font-weight: 600;" title="MyEd Student & Applicant Portal">
                🎓 Applicant Portal
              </a>
            ` : ''}
            ${isStaff ? `
              <span class="topbar-divider">&bull;</span>
              <a href="#/admin" style="color: var(--color-accent-gold-light); font-weight: 700;" title="EASE Staff & Reviewer Internal Access">
                🏛️ Staff Admin
              </a>
            ` : ''}
            ${isAuth ? `
              <span class="topbar-divider">|</span>
              <a href="#/${isStaff ? 'admin' : 'portal'}" style="color: var(--color-accent-gold); font-weight: 700;">
                👤 ${userLabel}
              </a>
              <a href="#/logout" style="color: rgba(255,255,255,0.7); margin-left: 4px;">Sign Out</a>
            ` : `
              <span class="topbar-divider">|</span>
              <a href="#/login" style="color: #FFF; font-weight: 600;">Sign In</a>
            `}
          </div>
        </div>
      </div>

      <!-- Main Navigation -->
      <div class="header-main">
        <div class="main-nav-container">
          
          <!-- Authentic University of Edinburgh Logo -->
          <a href="#/" class="logo" title="The University of Edinburgh">
            <svg class="logo-crest-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L8 12V32C8 48 32 60 32 60C32 60 56 48 56 32V12L32 4Z" fill="#041E42" stroke="#D50032" stroke-width="2.5"/>
              <path d="M12 16L52 48M52 16L12 48" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="32" cy="32" r="10" fill="#D50032"/>
              <path d="M28 28H36V36H28V28Z" fill="#FFFFFF"/>
              <path d="M30 26L32 23L34 26H30Z" fill="#D4AF37"/>
            </svg>
            <div class="logo-text-group">
              <span class="logo-title" style="letter-spacing: -0.02em;">THE UNIVERSITY <em>of</em> EDINBURGH</span>
              <span class="logo-sub" style="color: var(--color-secondary); font-weight: 700;">ESTABLISHED 1583 &bull; RUSSELL GROUP &bull; SCOTLAND</span>
            </div>
          </a>

          <!-- Mobile Hamburger Toggle -->
          <button id="mobile-menu-btn" class="hamburger" aria-label="Toggle Navigation Menu">
            <span></span><span></span><span></span>
          </button>

          <!-- Primary Navigation Links -->
          <nav id="main-nav" class="main-nav">
            <ul class="nav-list">
              <li><a href="#/" class="nav-link">Home</a></li>
              <li><a href="#/academics" class="nav-link">Courses & Study</a></li>
              <li><a href="#/research" class="nav-link">Research & Impact</a></li>
              <li><a href="#/campus-life" class="nav-link">Campus Life</a></li>
              <li>
                <a href="#/scholarships" class="nav-link nav-cta-scholarship">
                  <span>🎓 Scholarships</span>
                  <span class="badge badge-urgent" style="font-size: 10px; padding: 2px 6px;">6-Day Deadline</span>
                </a>
              </li>
              ${!isStaff ? `<li><a href="#/portal" class="nav-link">Applicant Portal</a></li>` : ''}
              ${isStaff ? `<li><a href="#/admin" class="nav-link" style="color: var(--color-primary); font-weight: 700;">Staff Admin</a></li>` : ''}
            </ul>

            <div class="nav-actions">
              ${isAuth ? `
                <a href="#/${isStaff ? 'admin' : 'portal'}" class="user-auth-btn">
                  <span>👤</span>
                  <span>${isStaff ? 'Admin Dashboard' : 'Applicant Portal'}</span>
                </a>
              ` : `
                <div style="display: flex; gap: 8px;">
                  <a href="#/login" class="btn btn-primary" style="font-size: 0.85rem; padding: 8px 16px; font-weight: 600;">
                    Applicant Sign In
                  </a>
                </div>
              `}
            </div>
          </nav>
        </div>
      </div>
    </header>
  `;
}

export function init() {
  const header = document.getElementById('main-header');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      mobileBtn.classList.toggle('active');
      mainNav.classList.toggle('open');
    });
  }

  const highlightActive = () => {
    const hash = window.location.hash || '#/';
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash || (href !== '#/' && hash.startsWith(href))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
      
      link.addEventListener('click', () => {
        if (mainNav && mainNav.classList.contains('open')) {
          mainNav.classList.remove('open');
          if (mobileBtn) mobileBtn.classList.remove('active');
        }
      });
    });
  };

  window.addEventListener('hashchange', highlightActive);
  highlightActive();

  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
}

export default {
  render,
  init
};
