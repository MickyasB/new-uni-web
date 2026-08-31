// js/pages/campus-life.js — Authentic University of Edinburgh Campus Life
const render = (container, params) => {
  container.innerHTML = `
    <div class="page-campus-life font-body">
      
      <!-- Hero Section -->
      <section style="min-height: 60vh; display: flex; align-items: center; justify-content: center; position: relative; background: linear-gradient(135deg, rgba(4,30,66,0.9) 0%, rgba(2,18,48,0.92) 100%), url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=80') center/cover no-repeat; color: white; text-align: center; padding: 4rem 1.5rem;">
        <div style="position: relative; z-index: 2; max-width: 860px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(213,0,50,0.25); border: 1px solid rgba(213,0,50,0.5); padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 14px;">
            🏴󠁧󠁢󠁳󠁣󠁴󠁿 Voted World's #1 Best City to Live (Time Out) &bull; UNESCO World Heritage
          </div>
          <h1 style="font-family: var(--font-heading); font-size: clamp(2.25rem, 4.5vw, 3.5rem); margin-bottom: 1rem; color: white;">
            Life at The University of Edinburgh
          </h1>
          <p style="font-size: 1.2rem; color: #E5E9EE; line-height: 1.6; max-width: 740px; margin: 0 auto;">
            From catered residence halls nestled under Arthur's Seat to the world's oldest student union at Teviot Row House and over 320 societies, experience student life in Scotland's historic capital.
          </p>
        </div>
      </section>

      <!-- Accommodation Section -->
      <section style="padding: 5rem 1.5rem; background-color: var(--color-off-white);">
        <div class="container" style="max-width: 1240px; margin: 0 auto;">
          
          <div style="text-align: center; margin-bottom: 3.5rem;">
            <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-secondary);">Guaranteed First-Year Accommodation</span>
            <h2 style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-primary); margin: 6px 0 12px;">University Residences</h2>
            <p style="color: var(--color-slate); font-size: 1.1rem; max-width: 700px; margin: 0 auto;">
              Choose from catered halls at Pollock Halls beside Holyrood Park or modern self-catered flats across Edinburgh city centre.
            </p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
            
            <!-- 1. Pollock Halls -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80" alt="Pollock Halls of Residence" style="width: 100%; height: 200px; object-fit: cover;">
              <div style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <h3 style="font-size: 1.3rem; color: var(--color-primary); margin: 0;">Pollock Halls</h3>
                  <span class="badge" style="background: var(--color-primary); color: white;">£195/wk</span>
                </div>
                <p style="color: var(--color-slate); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">
                  Flagship catered halls situated right at the foot of Arthur's Seat. Includes 14 meals per week, common rooms, squash courts, and 24/7 security.
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.25rem;">
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Catered Meal Plan</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Arthur's Seat Views</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">En-suite Options</span>
                </div>
                <a href="#/scholarships" class="btn btn-outline" style="width: 100%; padding: 8px; font-size: 0.88rem; text-align: center;">Explore Pollock Halls &rarr;</a>
              </div>
            </div>

            <!-- 2. Salisbury Court -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80" alt="Salisbury Court" style="width: 100%; height: 200px; object-fit: cover;">
              <div style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <h3 style="font-size: 1.3rem; color: var(--color-primary); margin: 0;">Salisbury Court</h3>
                  <span class="badge" style="background: var(--color-secondary); color: white;">£175/wk</span>
                </div>
                <p style="color: var(--color-slate); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">
                  Modern self-catered apartments in the Southside, just a 5-minute walk from George Square Central Campus and the Main Library.
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.25rem;">
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Self-Catered</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">5min to Central Area</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">High-Speed Wi-Fi</span>
                </div>
                <a href="#/scholarships" class="btn btn-outline" style="width: 100%; padding: 8px; font-size: 0.88rem; text-align: center;">Explore Salisbury Court &rarr;</a>
              </div>
            </div>

            <!-- 3. Richmond Place & Holyrood -->
            <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow-sm); background: white;">
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" alt="Richmond Place Residence" style="width: 100%; height: 200px; object-fit: cover;">
              <div style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <h3 style="font-size: 1.3rem; color: var(--color-primary); margin: 0;">Holyrood South</h3>
                  <span class="badge" style="background: var(--color-primary); color: white;">£180/wk</span>
                </div>
                <p style="color: var(--color-slate); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem;">
                  Spacious city centre apartments close to the Royal Mile, Pleasance Sports Complex, and Moray House School of Education.
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.25rem;">
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Old Town Location</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Postgrad &amp; UG Flats</span>
                  <span class="badge" style="background: var(--color-bg-alt); color: var(--color-primary);">Gym Access</span>
                </div>
                <a href="#/scholarships" class="btn btn-outline" style="width: 100%; padding: 8px; font-size: 0.88rem; text-align: center;">Explore Holyrood &rarr;</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Sports & Societies Section -->
      <section style="padding: 5rem 1.5rem; background-color: var(--color-primary); color: white;">
        <div class="container" style="max-width: 1240px; margin: 0 auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;" class="sports-grid-responsive">
            <div>
              <span class="badge" style="background: var(--color-secondary); color: white; margin-bottom: 12px;">#1 University in Scotland for Sport</span>
              <h2 style="font-family: var(--font-heading); font-size: 2.4rem; margin: 0 0 1.25rem; color: white;">
                Pleasance Sports Complex &amp; Gym
              </h2>
              <p style="color: #CBD2D9; font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.5rem;">
                Consistently ranked in the UK Top 5 for British Universities &amp; Colleges Sport (BUCS). Features Olympic lifting gyms, indoor climbing walls, archery ranges, swimming facilities, and Peffermill Playing Fields.
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 2rem;">
                <div style="background: rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                  <div style="font-weight: 800; color: var(--color-secondary); font-size: 1.5rem;">64+</div>
                  <div style="font-size: 0.85rem; color: #CBD2D9;">Sports Clubs</div>
                </div>
                <div style="background: rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                  <div style="font-weight: 800; color: var(--color-accent-gold); font-size: 1.5rem;">320+</div>
                  <div style="font-size: 0.85rem; color: #CBD2D9;">Student Societies (EUSA)</div>
                </div>
              </div>
              <a href="#/scholarships" class="btn btn-secondary" style="font-weight: 700;">Explore Sports Scholarships &rarr;</a>
            </div>

            <div>
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" alt="Edinburgh Sports & Climbing" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-xl);">
            </div>
          </div>
        </div>
      </section>

      <!-- Students' Association (EUSA) -->
      <section style="padding: 5rem 1.5rem; background: white;">
        <div class="container" style="max-width: 1240px; margin: 0 auto; text-align: center;">
          <span class="badge" style="background: var(--color-primary); color: white; margin-bottom: 10px;">Est. 1884</span>
          <h2 style="font-family: var(--font-heading); font-size: 2.4rem; color: var(--color-primary); margin: 0 0 1rem;">
            Edinburgh University Students' Association (EUSA)
          </h2>
          <p style="color: var(--color-slate); font-size: 1.05rem; max-width: 750px; margin: 0 auto 3rem; line-height: 1.6;">
            Operating landmark student union buildings across the city, including Teviot Row House (the world's oldest purpose-built student union), Potterrow, King's Buildings House, and The Pleasance.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; text-align: left;">
            <div class="card" style="background: var(--color-bg-alt); padding: 1.75rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
              <div style="font-size: 2rem; margin-bottom: 10px;">🏰</div>
              <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; margin: 0 0 8px;">Teviot Row House</h4>
              <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin: 0;">Gothic student union featuring the famous Debating Hall, Library Bar, and Loft Bar.</p>
            </div>

            <div class="card" style="background: var(--color-bg-alt); padding: 1.75rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
              <div style="font-size: 2rem; margin-bottom: 10px;">🎭</div>
              <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; margin: 0 0 8px;">Potterrow &amp; The Dome</h4>
              <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin: 0;">Home to the Advice Place, student representation, retail hubs, and major live performance events.</p>
            </div>

            <div class="card" style="background: var(--color-bg-alt); padding: 1.75rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
              <div style="font-size: 2rem; margin-bottom: 10px;">🤝</div>
              <h4 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; margin: 0 0 8px;">320+ Student Societies</h4>
              <p style="color: var(--color-slate); font-size: 0.88rem; line-height: 1.5; margin: 0;">From Edinburgh University Tech &amp; AI Society (CompSoc) to Highland Dancing and Medicine societies.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `;
};

const init = () => {};

export default { render, init };
