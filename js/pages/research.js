// js/pages/research.js — Authentic University of Edinburgh Research & Impact Showcase
const render = (container, params) => {
  container.innerHTML = `
    <div class="page-research font-body">
      
      <!-- Hero Section -->
      <section style="min-height: 60vh; display: flex; align-items: center; justify-content: center; position: relative; background: linear-gradient(135deg, rgba(4,30,66,0.92) 0%, rgba(2,18,48,0.95) 100%), url('https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1800&q=80') center/cover no-repeat; color: white; text-align: center; padding: 4.5rem 1.5rem;">
        <div style="position: relative; z-index: 2; max-width: 900px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(213,0,50,0.25); border: 1px solid rgba(213,0,50,0.5); padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem; color: #FFF;">
            🏴󠁧󠁢󠁳󠁣󠁴󠁿 #5 in UK for Research Power (REF) &bull; 19 Nobel Prize Laureates
          </div>
          <h1 style="font-family: var(--font-heading); font-size: clamp(2.25rem, 5vw, 3.75rem); margin-bottom: 1.25rem; color: white;">
            Research That Shapes the Modern World
          </h1>
          <p style="font-size: 1.2rem; color: #E5E9EE; line-height: 1.6; max-width: 780px; margin: 0 auto 2rem;">
            From the discovery of the <strong>Higgs Boson</strong> by Nobel Laureate Prof. Peter Higgs and cloning Dolly the Sheep to pioneering generative AI at the Bayes Centre and genomic medicine at the BioQuarter.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="#/scholarships" class="btn btn-secondary" style="font-weight: 700;">Explore 6-Day Postgraduate Research Scholarships &rarr;</a>
          </div>
        </div>
      </section>

      <!-- Key Research Metrics -->
      <section style="background: var(--color-primary-dark); color: white; padding: 3rem 1.5rem; border-bottom: 3px solid var(--color-secondary);">
        <div class="container" style="max-width: 1240px; margin: 0 auto;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; text-align: center;">
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; font-weight: 800; color: var(--color-secondary);">#5 in UK</div>
              <div style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase; color: #CBD2D9;">Research Power &amp; Excellence (REF)</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; font-weight: 800; color: var(--color-accent-gold);">19</div>
              <div style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase; color: #CBD2D9;">Nobel Prize Laureates</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; font-weight: 800; color: white;">£400M+</div>
              <div style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase; color: #CBD2D9;">Annual New Research Grants</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; font-weight: 800; color: var(--color-secondary);">#1 in UK</div>
              <div style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase; color: #CBD2D9;">Computer Science &amp; Informatics (REF)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Research Beacons with Laboratory Photos -->
      <section style="padding: 5rem 1.5rem; background: var(--color-off-white);">
        <div class="container" style="max-width: 1240px; margin: 0 auto;">
          
          <div style="text-align: center; margin-bottom: 3.5rem;">
            <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-secondary);">Interdisciplinary Beacons</span>
            <h2 style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-primary); margin: 6px 0 12px;">Pioneering Research Institutes</h2>
            <p style="color: var(--color-slate); font-size: 1.1rem; max-width: 720px; margin: 0 auto;">Collaborative science advancing human health, artificial intelligence, climate sustainability, and society.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
            
            <!-- Beacon 1: Bayes Centre & Informatics -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80" alt="Bayes Centre AI & Data" style="width: 100%; height: 210px; object-fit: cover;">
              <div style="padding: 1.75rem;">
                <span class="badge" style="background: var(--color-bg-alt); color: var(--color-info); margin-bottom: 8px;">Artificial Intelligence &bull; Informatics</span>
                <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--color-primary); margin: 0 0 10px;">The Bayes Centre &amp; Data-Driven Innovation</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  The central hub for Data Science and Artificial Intelligence. Houses 500+ world-leading computational mathematicians, AI theorists, and high-tech spinout accelerators.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 10px; font-size: 0.85rem; color: var(--color-slate);">
                  📍 <strong>Central Area Campus</strong> &bull; King's Buildings AI Labs
                </div>
              </div>
            </div>

            <!-- Beacon 2: Roslin Institute -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80" alt="Roslin Institute" style="width: 100%; height: 210px; object-fit: cover;">
              <div style="padding: 1.75rem;">
                <span class="badge" style="background: var(--color-bg-alt); color: var(--color-success); margin-bottom: 8px;">Genomics &bull; Animal Bioscience</span>
                <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--color-primary); margin: 0 0 10px;">The Roslin Institute &amp; Royal Dick Vet</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  Worldwide birthplace of mammalian cloning (Dolly the Sheep). Leads international research into livestock genetics, avian influenza resistance, and one-health zoonotic disease prevention.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 10px; font-size: 0.85rem; color: var(--color-slate);">
                  📍 <strong>Easter Bush Campus</strong> &bull; Midlothian Science Hub
                </div>
              </div>
            </div>

            <!-- Beacon 3: BioQuarter & Usher Institute -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80" alt="BioQuarter Medical Sciences" style="width: 100%; height: 210px; object-fit: cover;">
              <div style="padding: 1.75rem;">
                <span class="badge" style="background: var(--color-bg-alt); color: var(--color-secondary); margin-bottom: 8px;">Health Data &bull; Precision Medicine</span>
                <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--color-primary); margin: 0 0 10px;">Usher Institute &amp; Edinburgh BioQuarter</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  Co-located with the Royal Infirmary of Edinburgh. Analyzing nationwide electronic health records, population cohort genomics, and digital clinical trial pipelines.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 10px; font-size: 0.85rem; color: var(--color-slate);">
                  📍 <strong>Edinburgh BioQuarter</strong> &bull; Little France Medical Campus
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Nobel Laureate Spotlight -->
      <section style="padding: 5rem 1.5rem; background: white; border-top: 1px solid var(--color-light-grey);">
        <div class="container" style="max-width: 1240px; margin: 0 auto;">
          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; align-items: center;" class="nobel-grid-responsive">
            <div>
              <span class="badge" style="background: var(--color-secondary); color: white; margin-bottom: 12px;">Nobel Heritage</span>
              <h2 style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-primary); margin: 0 0 1.25rem;">
                Prof. Peter Higgs &amp; The Higgs Boson
              </h2>
              <p style="color: var(--color-slate); font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.5rem;">
                In 1964 at the University of Edinburgh, Professor Peter Higgs predicted the existence of the fundamental subatomic particle that gives all matter mass. In 2012, the particle was confirmed at CERN, leading to the 2013 Nobel Prize in Physics.
              </p>
              <div style="display: flex; gap: 2rem; border-left: 4px solid var(--color-secondary); padding-left: 1.25rem;">
                <div>
                  <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--color-primary);">1964</div>
                  <div style="font-size: 0.85rem; color: var(--color-slate);">Theoretical Discovery</div>
                </div>
                <div>
                  <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--color-secondary);">2013</div>
                  <div style="font-size: 0.85rem; color: var(--color-slate);">Nobel Prize in Physics</div>
                </div>
              </div>
            </div>

            <div>
              <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80" alt="Quantum Physics Laboratory" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-xl);">
            </div>
          </div>
        </div>
      </section>

    </div>
  `;
};

const init = () => {};

export default { render, init };
