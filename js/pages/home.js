// js/pages/home.js — Official University of Edinburgh Homepage
import { state } from '../state.js';

const home = {
  render(container) {
    container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section" style="position: relative; min-height: 85vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(4, 30, 66, 0.88) 0%, rgba(2, 18, 48, 0.94) 100%), url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1920&q=85') center/cover no-repeat; color: white; padding: 4rem 1.5rem; text-align: center;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at center, rgba(213,0,50,0.12) 0%, transparent 70%); pointer-events: none;"></div>
        
        <div class="container" style="max-width: 1040px; margin: 0 auto; position: relative; z-index: 2;">
          
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(213,0,50,0.2); border: 1px solid rgba(213,0,50,0.5); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; color: #FFF; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.08em;">
            <span style="color: #FFF;">🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
            <span>Russell Group &bull; World Top 30 University &bull; Est. 1583</span>
          </div>

          <h1 style="font-family: var(--font-heading); font-size: clamp(2.4rem, 5.5vw, 4.2rem); font-weight: 700; line-height: 1.1; margin-bottom: 1.25rem; color: #FFFFFF; text-shadow: 0 4px 20px rgba(0,0,0,0.4);">
            Influencing the World <br>
            <span style="color: #FFF; border-bottom: 3px solid var(--color-secondary);">Since 1583</span>
          </h1>

          <p style="font-size: clamp(1.05rem, 2vw, 1.25rem); color: #E5E9EE; max-width: 780px; margin: 0 auto 2.25rem; line-height: 1.6; font-weight: 400;">
            Join one of the world's leading ancient universities. Explore Russell Group undergraduate degrees, world-renowned masters in Informatics &amp; Business, and urgent 2026/27 scholarship funding.
          </p>

          <!-- Search & Filter Bar -->
          <div style="background: rgba(255, 255, 255, 0.98); padding: 10px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.35); max-width: 760px; margin: 0 auto 2rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
            <form id="hero-quick-search" style="display: flex; width: 100%; gap: 8px; flex-wrap: wrap;">
              <input type="text" id="hero-search-term" placeholder="Search Informatics, Medicine, Health Data, Business..." style="flex: 2; min-width: 220px; padding: 14px 18px; border: 1px solid var(--color-medium-grey); border-radius: 8px; font-size: 0.95rem; outline: none; color: var(--color-dark);" required>
              
              <select id="hero-level-select" style="flex: 1; min-width: 140px; padding: 14px 16px; border: 1px solid var(--color-medium-grey); border-radius: 8px; font-size: 0.92rem; background: #FFF; color: var(--color-slate); outline: none;">
                <option value="all">All Degrees</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate / MSc</option>
                <option value="scholarships">Scholarships (6-Day Close)</option>
              </select>

              <button type="submit" class="btn btn-secondary" style="padding: 14px 28px; font-weight: 700; font-size: 0.95rem; border-radius: 8px; background: var(--color-secondary); color: white; border: none; cursor: pointer;">
                Search Degree &rarr;
              </button>
            </form>
          </div>

          <!-- Quick Navigation Pills -->
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; font-size: 0.85rem;">
            <span style="color: #CBD2D9; padding: 6px 0;">Popular:</span>
            <a href="#/academics?q=Health+Informatics" style="background: rgba(255,255,255,0.15); color: white; padding: 6px 14px; border-radius: 20px; text-decoration: none; border: 1px solid rgba(255,255,255,0.25);">BSc &amp; MSc Health Informatics</a>
            <a href="#/academics?q=Informatics" style="background: rgba(255,255,255,0.15); color: white; padding: 6px 14px; border-radius: 20px; text-decoration: none; border: 1px solid rgba(255,255,255,0.25);">BSc Computer Science &amp; AI</a>
            <a href="#/academics?q=Business" style="background: rgba(255,255,255,0.15); color: white; padding: 6px 14px; border-radius: 20px; text-decoration: none; border: 1px solid rgba(255,255,255,0.25);">MSc Management (Business School)</a>
            <a href="#/scholarships" style="background: var(--color-secondary); color: white; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-decoration: none;">⚡ 6-Day Closing Scholarships</a>
          </div>

        </div>
      </section>

      <!-- Urgent 6-Day Scholarship Countdown Ribbon -->
      <section style="background: var(--color-urgent); color: white; padding: 1.25rem 1rem; border-bottom: 2px solid rgba(0,0,0,0.1);">
        <div class="container" style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.6rem;">⏱️</span>
            <div>
              <strong style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">2026/27 Edinburgh Global &amp; Faculty Awards Closing:</strong>
              <div style="font-size: 0.88rem; color: #FFF; opacity: 0.95;">All Undergraduate &amp; Postgraduate scholarship applications close in exactly <strong>6 days (August 28, 2026)</strong>.</div>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="#/scholarships" class="btn" style="background: white; color: var(--color-urgent); font-weight: 800; padding: 8px 18px; border-radius: 6px; font-size: 0.88rem;">View 13 Open Scholarships &rarr;</a>
          </div>
        </div>
      </section>

      <!-- Key Edinburgh Stats -->
      <section style="background: var(--color-primary-dark); color: white; padding: 3rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: center;">
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; color: var(--color-accent-gold); font-weight: 800; margin-bottom: 4px;">Top 30</div>
              <div style="font-size: 0.9rem; color: #CBD2D9; font-weight: 500;">QS World University Rankings 2025</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; color: white; font-weight: 800; margin-bottom: 4px;">1583</div>
              <div style="font-size: 0.9rem; color: #CBD2D9; font-weight: 500;">Ancient Scottish University</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; color: var(--color-secondary-light); font-weight: 800; margin-bottom: 4px;">19</div>
              <div style="font-size: 0.9rem; color: #CBD2D9; font-weight: 500;">Nobel Prize Laureates</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; color: white; font-weight: 800; margin-bottom: 4px;">49,000+</div>
              <div style="font-size: 0.9rem; color: #CBD2D9; font-weight: 500;">Students from 160+ Nations</div>
            </div>
            <div>
              <div style="font-family: var(--font-heading); font-size: 2.75rem; color: var(--color-accent-gold); font-weight: 800; margin-bottom: 4px;">#5 in UK</div>
              <div style="font-size: 0.9rem; color: #CBD2D9; font-weight: 500;">Research Power Excellence (REF)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Three Colleges / Academic Faculties Grid -->
      <section style="padding: 5rem 1.5rem; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          
          <div style="text-align: center; max-width: 750px; margin: 0 auto 3.5rem;">
            <span class="badge" style="background: var(--color-primary); color: white; margin-bottom: 12px;">World-Leading Teaching</span>
            <h2 style="font-family: var(--font-heading); font-size: clamp(2rem, 3.5vw, 2.75rem); color: var(--color-primary); margin: 0 0 1rem;">
              Our Three Historic Colleges
            </h2>
            <p style="color: var(--color-slate); font-size: 1.05rem; line-height: 1.6;">
              Comprising 21 academic schools delivering world-leading teaching, cutting-edge laboratories, and Russell Group excellence across all disciplines.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem;">
            
            <!-- College 1: Science & Engineering -->
            <div class="card" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey); background: white; transition: transform 0.25s, box-shadow 0.25s;">
              <div style="height: 200px; background: url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80') center/cover no-repeat; position: relative;">
                <span style="position: absolute; top: 14px; left: 14px; background: var(--color-primary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700;">King's Buildings</span>
              </div>
              <div style="padding: 1.75rem;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span class="badge" style="background: #E8F4F8; color: var(--color-info);">School of Informatics</span>
                  <span class="badge" style="background: #FDF0ED; color: var(--color-secondary);">Engineering</span>
                </div>
                <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.4rem; margin: 0 0 8px;">College of Science &amp; Engineering</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  Pioneering Computer Science, Artificial Intelligence, Robotics, and Green Engineering. Home to the legendary Bayes Centre and supercomputing hubs.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; color: var(--color-slate); font-weight: 600;">BSc, MInf, MSc &amp; PhD</span>
                  <a href="#/academics?q=Informatics" style="color: var(--color-secondary); font-weight: 700; font-size: 0.9rem;">Explore Courses &rarr;</a>
                </div>
              </div>
            </div>

            <!-- College 2: Medicine & Veterinary Medicine -->
            <div class="card" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey); background: white; transition: transform 0.25s, box-shadow 0.25s;">
              <div style="height: 200px; background: url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80') center/cover no-repeat; position: relative;">
                <span style="position: absolute; top: 14px; left: 14px; background: var(--color-secondary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700;">BioQuarter &amp; Easter Bush</span>
              </div>
              <div style="padding: 1.75rem;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span class="badge" style="background: #E8F5E9; color: var(--color-success);">Health Informatics</span>
                  <span class="badge" style="background: #FFF3E0; color: var(--color-warning);">MBChB Medicine</span>
                </div>
                <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.4rem; margin: 0 0 8px;">College of Medicine &amp; Vet Medicine</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  Leading human health, digital health informatics, and veterinary sciences. Home to the Roslin Institute, MRC Human Genetics, and major NHS clinical partners.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; color: var(--color-slate); font-weight: 600;">BSc, MBChB, MSc &amp; BVM&amp;S</span>
                  <a href="#/academics?q=Health" style="color: var(--color-secondary); font-weight: 700; font-size: 0.9rem;">Explore Courses &rarr;</a>
                </div>
              </div>
            </div>

            <!-- College 3: Arts, Humanities & Social Sciences -->
            <div class="card" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey); background: white; transition: transform 0.25s, box-shadow 0.25s;">
              <div style="height: 200px; background: url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80') center/cover no-repeat; position: relative;">
                <span style="position: absolute; top: 14px; left: 14px; background: var(--color-primary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700;">Central Area &amp; George Sq</span>
              </div>
              <div style="padding: 1.75rem;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span class="badge" style="background: #E8F4F8; color: var(--color-info);">Business School</span>
                  <span class="badge" style="background: #E8F5E9; color: var(--color-success);">Law &amp; Social Sciences</span>
                </div>
                <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.4rem; margin: 0 0 8px;">College of Arts, Humanities &amp; Social Sciences</h3>
                <p style="color: var(--color-slate); font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.25rem;">
                  Triple-accredited University of Edinburgh Business School, School of Law, and Edinburgh Futures Institute driving societal transformation and global leadership.
                </p>
                <div style="border-top: 1px solid var(--color-light-grey); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; color: var(--color-slate); font-weight: 600;">MA (Hons), MSc &amp; MBA</span>
                  <a href="#/academics?q=Business" style="color: var(--color-secondary); font-weight: 700; font-size: 0.9rem;">Explore Courses &rarr;</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Interactive Edinburgh Campuses Switcher -->
      <section style="padding: 5rem 1.5rem; background: white;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          
          <div style="text-align: center; max-width: 750px; margin: 0 auto 3rem;">
            <span class="badge" style="background: var(--color-secondary); color: white; margin-bottom: 10px;">Historic Capital Estate</span>
            <h2 style="font-family: var(--font-heading); font-size: clamp(2rem, 3vw, 2.6rem); color: var(--color-primary); margin: 0 0 1rem;">
              Campuses Across Scotland's Capital
            </h2>
            <p style="color: var(--color-slate); font-size: 1.05rem; line-height: 1.6;">
              Spread throughout the stunning UNESCO World Heritage city of Edinburgh, our specialised campuses combine gothic history with futuristic laboratories.
            </p>
          </div>

          <!-- Campus Tabs -->
          <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 2.5rem;">
            <button class="campus-tab active" data-campus="central" style="padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; border: 2px solid var(--color-primary); background: var(--color-primary); color: white; cursor: pointer; transition: all 0.2s;">
              🏛️ Central Area (Old College)
            </button>
            <button class="campus-tab" data-campus="kb" style="padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; border: 1px solid var(--color-medium-grey); background: var(--color-bg-alt); color: var(--color-primary); cursor: pointer; transition: all 0.2s;">
              🔬 The King's Buildings (Science &amp; Eng)
            </button>
            <button class="campus-tab" data-campus="bioquarter" style="padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; border: 1px solid var(--color-medium-grey); background: var(--color-bg-alt); color: var(--color-primary); cursor: pointer; transition: all 0.2s;">
              🏥 Edinburgh BioQuarter (Health)
            </button>
            <button class="campus-tab" data-campus="easterbush" style="padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; border: 1px solid var(--color-medium-grey); background: var(--color-bg-alt); color: var(--color-primary); cursor: pointer; transition: all 0.2s;">
              🐑 Easter Bush (Vet &amp; Roslin)
            </button>
          </div>

          <!-- Campus Detail Panel -->
          <div id="campus-panel" class="card campus-panel-grid" style="border-radius: 16px; overflow: hidden; border: 1px solid var(--color-light-grey); background: var(--color-bg-alt); min-height: 380px;">
            <div style="padding: 2.5rem;">
              <span class="badge" style="background: var(--color-primary); color: white; margin-bottom: 10px;">Historic Heart &bull; Est. 1583</span>
              <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 2rem; margin: 0 0 1rem;">Central Area, Old College &amp; George Square</h3>
              <p style="color: var(--color-slate); font-size: 0.98rem; line-height: 1.6; margin-bottom: 1.5rem;">
                The iconic historic heart of the University in Edinburgh's Old Town. Home to the Law School in Old College, Edinburgh Futures Institute, University of Edinburgh Business School, and the University Main Library.
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 1.75rem;">
                <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid var(--color-light-grey);">
                  <div style="font-weight: 800; color: var(--color-primary); font-size: 1.3rem;">Historic Central</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate);">UNESCO World Heritage City</div>
                </div>
                <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid var(--color-light-grey);">
                  <div style="font-weight: 800; color: var(--color-secondary); font-size: 1.3rem;">35,000+</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate);">Students in Central Area</div>
                </div>
              </div>
              <a href="#/campus-life" class="btn btn-primary">Explore Edinburgh Campus Life &rarr;</a>
            </div>

            <div style="background: url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80') center/cover no-repeat; min-height: 320px; position: relative;">
              <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(4, 30, 66, 0.9); backdrop-filter: blur(6px); color: white; padding: 12px 16px; border-radius: 8px; font-size: 13px;">
                📍 <strong>Old College Quadrangle, South Bridge</strong>
              </div>
            </div>
          </div>
          <style>
            .campus-panel-grid {
              display: grid;
              grid-template-columns: 1.2fr 1fr;
            }
            @media (max-width: 840px) {
              .campus-panel-grid {
                grid-template-columns: 1fr !important;
              }
            }
          </style>

        </div>
      </section>

      <!-- Featured Scholarships Callout -->
      <section style="padding: 5rem 1.5rem; background: linear-gradient(135deg, #041E42 0%, #021230 100%); color: white;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; flex-wrap: wrap; gap: 1.5rem;">
            <div>
              <span class="badge" style="background: var(--color-secondary); color: white; margin-bottom: 12px;">⏳ 6-Day Closing Warning</span>
              <h2 style="font-family: var(--font-heading); font-size: clamp(2rem, 3.5vw, 2.75rem); color: white; margin: 0 0 8px;">
                Featured Edinburgh Scholarships
              </h2>
              <p style="color: #CBD2D9; font-size: 1.05rem; margin: 0;">
                Full tuition fee waivers and generous living stipends across BSc, BEng, and MSc programmes.
              </p>
            </div>
            <a href="#/scholarships" class="btn btn-secondary" style="font-weight: 700;">View All 13 Scholarships &rarr;</a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.75rem;">
            
            <!-- Card 1 -->
            <div class="card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1.75rem; color: white;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <span class="badge" style="background: var(--color-secondary); color: white;">⚡ 6 Days Remaining</span>
                <span style="color: var(--color-accent-gold); font-weight: 800; font-size: 1.1rem;">Full Tuition + £12k</span>
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin: 0 0 10px; color: white;">Edinburgh Global Principal's Excellence Award</h3>
              <p style="font-size: 0.9rem; color: #CBD2D9; line-height: 1.5; margin-bottom: 1.25rem;">
                Full tuition fee waiver plus £12,000 annual maintenance for exceptional international and UK applicants across all colleges.
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <span style="font-size: 0.8rem; color: #A0AEC0;">Undergraduate &amp; Masters</span>
                <a href="#/scholarships/apply/sch-ed-global-1" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px;">Apply Now &rarr;</a>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1.75rem; color: white;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <span class="badge" style="background: var(--color-secondary); color: white;">⚡ 6 Days Remaining</span>
                <span style="color: var(--color-accent-gold); font-weight: 800; font-size: 1.1rem;">50% Tuition Waiver</span>
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin: 0 0 10px; color: white;">BSc Health Informatics &amp; Data Scholarship</h3>
              <p style="font-size: 0.9rem; color: #CBD2D9; line-height: 1.5; margin-bottom: 1.25rem;">
                Dedicated award for undergraduate candidates enrolling in the new BSc Health Informatics &amp; Digital Health 3-year programme.
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <span style="font-size: 0.8rem; color: #A0AEC0;">BSc Undergraduate</span>
                <a href="#/scholarships/apply/sch-hi-ug-1" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px;">Apply Now &rarr;</a>
              </div>
            </div>

            <!-- Card 3 -->
            <div class="card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1.75rem; color: white;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <span class="badge" style="background: var(--color-secondary); color: white;">⚡ 6 Days Remaining</span>
                <span style="color: var(--color-accent-gold); font-weight: 800; font-size: 1.1rem;">£10,000 Award</span>
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin: 0 0 10px; color: white;">Edinburgh Business School Leadership Grant</h3>
              <p style="font-size: 0.9rem; color: #CBD2D9; line-height: 1.5; margin-bottom: 1.25rem;">
                Merit-based financial bursary for future business leaders enrolling in MSc Management and International Business programmes.
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <span style="font-size: 0.8rem; color: #A0AEC0;">Postgraduate Masters</span>
                <a href="#/scholarships/apply/sch-mgt-1" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 14px;">Apply Now &rarr;</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Latest Research & News -->
      <section style="padding: 5rem 1.5rem; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="text-align: center; max-width: 750px; margin: 0 auto 3.5rem;">
            <span class="badge" style="background: var(--color-primary); color: white; margin-bottom: 12px;">Research Beacons</span>
            <h2 style="font-family: var(--font-heading); font-size: clamp(2rem, 3.5vw, 2.75rem); color: var(--color-primary); margin: 0 0 1rem;">
              Pioneering Discoveries &amp; Research
            </h2>
            <p style="color: var(--color-slate); font-size: 1.05rem;">
              From cloning Dolly the Sheep at the Roslin Institute to supercomputing at the Bayes Centre, Edinburgh shapes tomorrow's solutions.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
            
            <div class="card" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey);">
              <div style="height: 180px; background: url('https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=700&q=80') center/cover no-repeat;"></div>
              <div style="padding: 1.5rem;">
                <span class="badge" style="background: #E8F4F8; color: var(--color-info); margin-bottom: 8px;">Artificial Intelligence &bull; Bayes Centre</span>
                <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.25rem; margin: 0 0 8px;">Edinburgh Informatics Unveils New Clinical AI Diagnostics</h4>
                <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin-bottom: 1rem;">
                  Researchers at the School of Informatics develop machine learning models capable of early cardiovascular prediction from NHS Scotland records.
                </p>
                <span style="font-size: 0.8rem; color: #7B8794;">August 18, 2026 &bull; School of Informatics</span>
              </div>
            </div>

            <div class="card" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey);">
              <div style="height: 180px; background: url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=700&q=80') center/cover no-repeat;"></div>
              <div style="padding: 1.5rem;">
                <span class="badge" style="background: #E8F5E9; color: var(--color-success); margin-bottom: 8px;">Genomics &bull; BioQuarter</span>
                <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.25rem; margin: 0 0 8px;">MRC Institute Secures £45M for Rare Disease Genomics</h4>
                <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin-bottom: 1rem;">
                  The Institute of Genetics and Cancer partners with NHS Lothian to expand whole-genome sequencing in pediatric medicine.
                </p>
                <span style="font-size: 0.8rem; color: #7B8794;">August 14, 2026 &bull; Edinburgh BioQuarter</span>
              </div>
            </div>

            <div class="card" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey);">
              <div style="height: 180px; background: url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=700&q=80') center/cover no-repeat;"></div>
              <div style="padding: 1.5rem;">
                <span class="badge" style="background: #FDF0ED; color: var(--color-secondary); margin-bottom: 8px;">Futures Institute &bull; Central</span>
                <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.25rem; margin: 0 0 8px;">Edinburgh Futures Institute Welcomes Inaugural Cohort</h4>
                <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin-bottom: 1rem;">
                  The landmark £120M restoration of the Old Royal Infirmary opens for interdisciplinary data, business, and policy postgraduate scholars.
                </p>
                <span style="font-size: 0.8rem; color: #7B8794;">August 10, 2026 &bull; Central Area</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  },

  init() {
    // Quick search form
    const form = document.getElementById('hero-quick-search');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const term = document.getElementById('hero-search-term').value.trim();
      const level = document.getElementById('hero-level-select').value;
      if (level === 'scholarships') {
        window.location.hash = `/scholarships`;
      } else {
        window.location.hash = `/academics?q=${encodeURIComponent(term)}`;
      }
    });

    // Campus Switcher Data (Edinburgh Campuses)
    const campuses = {
      central: {
        badge: 'Historic Heart &bull; Est. 1583',
        title: 'Central Area, Old College &amp; George Square',
        desc: 'The iconic historic heart of the University in Edinburgh’s Old Town. Home to the Law School in Old College, Edinburgh Futures Institute, University of Edinburgh Business School, and the University Main Library.',
        stat1: 'Historic Central', stat1Label: 'UNESCO World Heritage City',
        stat2: '35,000+', stat2Label: 'Students in Central Area',
        img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
        caption: 'Old College Quadrangle, South Bridge'
      },
      kb: {
        badge: 'Science, Informatics &amp; Engineering Hub',
        title: 'The King’s Buildings (KB), South Edinburgh',
        desc: 'Home to the College of Science &amp; Engineering. Features cutting-edge supercomputing facilities, the School of Informatics, robotics laboratories, and world-class quantum research centers.',
        stat1: '35 Hectares', stat1Label: 'Science &amp; Tech Campus',
        stat2: '#1 in Scotland', stat2Label: 'Computer Science &amp; AI (REF)',
        img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
        caption: 'King’s Buildings Engineering &amp; AI Hub'
      },
      bioquarter: {
        badge: 'Clinical Medicine &amp; Health Data Campus',
        title: 'Edinburgh BioQuarter, Little France',
        desc: 'Integrated with the Royal Infirmary of Edinburgh. Houses the Medical School, Health Informatics &amp; Digital Health labs, Usher Institute, and the Institute for Regeneration and Repair.',
        stat1: 'Major NHS Hub', stat1Label: 'Teaching Hospital Co-Location',
        stat2: '£250M+ Grants', stat2Label: 'Medical &amp; Data Research',
        img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
        caption: 'Edinburgh BioQuarter &amp; Royal Infirmary'
      },
      easterbush: {
        badge: 'Veterinary Medicine &amp; Genomics Hub',
        title: 'Easter Bush Campus, Midlothian',
        desc: 'Specialist veterinary campus housing the Royal (Dick) School of Veterinary Studies, Roslin Innovation Centre, and Large Animal Hospital. Worldwide birthplace of modern mammalian genetics.',
        stat1: 'World Famous', stat1Label: 'Birthplace of Dolly the Sheep',
        stat2: '#1 in UK', stat2Label: 'Veterinary Sciences',
        img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80',
        caption: 'The Roslin Institute, Easter Bush Campus'
      }
    };

    const tabs = document.querySelectorAll('.campus-tab');
    const panel = document.getElementById('campus-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.style.background = 'var(--color-bg-alt)';
          t.style.color = 'var(--color-primary)';
          t.style.borderColor = 'var(--color-medium-grey)';
          t.style.fontWeight = '600';
        });

        tab.style.background = 'var(--color-primary)';
        tab.style.color = 'white';
        tab.style.borderColor = 'var(--color-primary)';
        tab.style.fontWeight = '700';

        const data = campuses[tab.dataset.campus];
        if (data && panel) {
          panel.innerHTML = `
            <div style="padding: 2.5rem;">
              <span class="badge" style="background: var(--color-primary); color: white; margin-bottom: 10px;">${data.badge}</span>
              <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 2rem; margin: 0 0 1rem;">${data.title}</h3>
              <p style="color: var(--color-slate); font-size: 0.98rem; line-height: 1.6; margin-bottom: 1.5rem;">${data.desc}</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 1.75rem;">
                <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid var(--color-light-grey);">
                  <div style="font-weight: 800; color: var(--color-primary); font-size: 1.3rem;">${data.stat1}</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate);">${data.stat1Label}</div>
                </div>
                <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid var(--color-light-grey);">
                  <div style="font-weight: 800; color: var(--color-secondary); font-size: 1.3rem;">${data.stat2}</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate);">${data.stat2Label}</div>
                </div>
              </div>
              <a href="#/campus-life" class="btn btn-primary">Explore Edinburgh Campus Life &rarr;</a>
            </div>

            <div style="background: url('${data.img}') center/cover no-repeat; min-height: 320px; position: relative;">
              <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(4, 30, 66, 0.9); backdrop-filter: blur(6px); color: white; padding: 12px 16px; border-radius: 8px; font-size: 13px;">
                📍 <strong>${data.caption}</strong>
              </div>
            </div>
          `;
        }
      });
    });
  }
};

export default home;
