// js/components/footer.js — Official University of Edinburgh Footer
export function render() {
  return `
    <footer style="background-color: var(--color-primary-dark); color: #CBD2D9; padding-top: 4rem; border-top: 4px solid var(--color-secondary);">
      <div class="container" style="max-width: 1240px; margin: 0 auto; padding: 0 1.5rem 3rem;">
        
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr; gap: 3rem; margin-bottom: 3.5rem;" class="footer-main-grid">
          
          <!-- Col 1: Brand & Russell Group -->
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem;">
              <svg style="width: 38px; height: 38px;" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 4L8 12V32C8 48 32 60 32 60C32 60 56 48 56 32V12L32 4Z" fill="#041E42" stroke="#D50032" stroke-width="2"/>
                <path d="M12 16L52 48M52 16L12 48" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                <circle cx="32" cy="32" r="8" fill="#D50032"/>
                <path d="M28 28H36V36H28V28Z" fill="#FFFFFF"/>
              </svg>
              <div>
                <h3 style="font-family: var(--font-heading); color: white; font-size: 1.25rem; margin: 0; line-height: 1.1;">The University of Edinburgh</h3>
                <span style="font-size: 0.72rem; letter-spacing: 0.1em; color: var(--color-accent-gold-light); font-weight: 600; text-transform: uppercase;">A Russell Group &amp; Ancient Scottish University</span>
              </div>
            </div>
            
            <p style="font-size: 0.9rem; line-height: 1.6; color: #9AA5B1; margin-bottom: 1.5rem;">
              Old College, South Bridge, Edinburgh, EH8 9YL, Scotland, UK<br>
              Tel: +44 (0) 131 650 1000 &bull; Influencing the world since 1583
            </p>

            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; color: #FFF;">
              <span>🏆</span>
              <span><strong>QS World Top 30</strong> &bull; #5 in UK Research Power (REF)</span>
            </div>
          </div>

          <!-- Col 2: Colleges & Study -->
          <div>
            <h4 style="color: white; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem; font-family: var(--font-body); font-weight: 700;">Colleges &amp; Study</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
              <li><a href="#/academics?level=Undergraduate" style="color: #CBD2D9;">Undergraduate Degrees</a></li>
              <li><a href="#/academics?level=Postgraduate" style="color: #CBD2D9;">Postgraduate &amp; Masters</a></li>
              <li><a href="#/scholarships" style="color: var(--color-accent-gold-light); font-weight: 600;">Scholarships &amp; Funding (6-Day Close)</a></li>
              <li><a href="#/academics?q=Informatics" style="color: #CBD2D9;">School of Informatics &amp; AI</a></li>
              <li><a href="#/academics?q=Business" style="color: #CBD2D9;">University of Edinburgh Business School</a></li>
            </ul>
          </div>

          <!-- Col 3: Edinburgh Campuses -->
          <div>
            <h4 style="color: white; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem; font-family: var(--font-body); font-weight: 700;">Edinburgh Campuses</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
              <li><a href="#/" style="color: #CBD2D9;">Central Area (Old College &amp; George Sq)</a></li>
              <li><a href="#/" style="color: #CBD2D9;">The King's Buildings (Science &amp; Eng)</a></li>
              <li><a href="#/" style="color: #CBD2D9;">Edinburgh BioQuarter (Health Sciences)</a></li>
              <li><a href="#/" style="color: #CBD2D9;">Easter Bush (Veterinary Medicine)</a></li>
            </ul>
          </div>

          <!-- Col 4: Key Portals & Access -->
          <div>
            <h4 style="color: white; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem; font-family: var(--font-body); font-weight: 700;">Portals &amp; Services</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
              <li><a href="#/portal" style="color: #CBD2D9;">MyEd Applicant &amp; Student Portal</a></li>
              <li><a href="#/scholarships" style="color: #CBD2D9;">Edinburgh Global Scholarship Portal</a></li>
              <li><a href="#/campus-life" style="color: #CBD2D9;">Pollock Halls &amp; Accommodation</a></li>
              <li><a href="#/research" style="color: #CBD2D9;">Bayes Centre &amp; Research Institutes</a></li>
            </ul>
          </div>

        </div>

        <!-- Footer Bottom Bar -->
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem; color: #7B8794;">
          <div>
            &copy; 2026 The University of Edinburgh. All rights reserved. Scottish Charity No. SC005336.
          </div>
          <div style="display: flex; gap: 1.5rem;">
            <a href="#/privacy" style="color: #7B8794;">Privacy Statement</a>
            <a href="#/cookies" style="color: #7B8794;">Cookie Preferences</a>
            <a href="#/accessibility" style="color: #7B8794;">Accessibility Statement</a>
            <a href="#/terms" style="color: #7B8794;">Terms &amp; Conditions</a>
          </div>
        </div>

      </div>
    </footer>

    <style>
      @media (max-width: 900px) {
        .footer-main-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 2rem !important;
        }
      }
      @media (max-width: 600px) {
        .footer-main-grid {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
}

export default {
  render
};
