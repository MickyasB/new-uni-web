// js/pages/academics.js — Official University of Edinburgh Course & Degree Directory
const courses = [
  {
    title: 'BSc Health Informatics & Digital Health',
    slug: 'bsc-health-informatics',
    faculty: 'Medicine & Veterinary Medicine',
    college: 'College of Medicine & Veterinary Medicine',
    level: 'Undergraduate',
    duration: '4 years full-time (Scottish BSc Hons)',
    ucas: 'I140',
    entry: 'AAA–ABB including Mathematics, Computing, or Biology',
    feesUK: '£9,250 (RUK) / £1,820 (Home Scotland)',
    feesInt: '£34,800',
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    description: 'An innovative undergraduate degree delivered jointly by the Usher Institute at Edinburgh BioQuarter and the School of Informatics. Prepares leaders to build AI systems, clinical data pipelines, and electronic health record infrastructures for modern healthcare.',
    whyEdinburgh: 'Study at the world-renowned Usher Institute adjacent to the Royal Infirmary of Edinburgh. Benefit from direct collaboration with NHS Scotland, Public Health Scotland, and the Data-Driven Innovation (DDI) initiative.',
    requirements: {
      alevel: 'AAA–ABB including Mathematics, Computing, Biology, or Chemistry.',
      gcse: 'English Language and Mathematics at grade 5 (B) or above.',
      english: 'IELTS 6.5 (minimum 6.0 in each band)'
    },
    modules: {
      core: ['Foundations of Health Informatics & EHR', 'Programming for Health Data Science (Python/R)', 'Human Biology & Clinical Systems', 'Information Governance & Healthcare Ethics', 'Machine Learning for Health Data', 'Undergraduate Honours Dissertation Project'],
      optional: ['AI in Medical Imaging', 'Biomedical Signal Analytics', 'Public Health Epidemiology', 'Health Economics & Digital Policy']
    }
  },
  {
    title: 'MSc Health Informatics & Applied Data Science',
    slug: 'msc-health-informatics',
    faculty: 'Medicine & Veterinary Medicine',
    college: 'College of Medicine & Veterinary Medicine',
    level: 'Postgraduate',
    duration: '1 year full-time',
    ucas: 'N/A',
    entry: '2:1 honours degree in healthcare, computing, mathematics, or related sciences',
    feesUK: '£15,600',
    feesInt: '£33,500',
    img: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    description: 'Equips clinicians, scientists, and data specialists with computational expertise to deploy predictive machine learning models, analyze population health cohorts, and modernize electronic patient records.',
    whyEdinburgh: 'Based at the Edinburgh BioQuarter with access to high-performance supercomputers and synthetic NHS Scotland real-world clinical datasets.',
    requirements: {
      alevel: 'N/A (Postgraduate entry)',
      gcse: 'Mathematics & English Language grade 4 (C) or higher.',
      english: 'IELTS 7.0 (minimum 6.5 in all components)'
    },
    modules: {
      core: ['Electronic Health Records & Data Standards', 'Applied Healthcare Machine Learning', 'Epidemiological & Observational Data Methods', 'Ethics, Security & Governance in Health Tech', 'Master of Science Research Dissertation'],
      optional: ['Precision Medicine & Genomics', 'Natural Language Processing for Clinical Notes', 'Health Economics']
    }
  },
  {
    title: 'BSc Computer Science & Artificial Intelligence',
    slug: 'bsc-computer-science',
    faculty: 'Science & Engineering',
    college: 'College of Science & Engineering',
    level: 'Undergraduate',
    duration: '4 years full-time (BSc Hons)',
    ucas: 'G400',
    entry: 'A*AA including Mathematics at grade A*',
    feesUK: '£9,250 (RUK) / £1,820 (Scotland)',
    feesInt: '£34,800',
    img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    description: 'Delivered by the University of Edinburgh School of Informatics — the largest and top-rated computer science research institute in the UK. Covers software engineering, machine learning, algorithms, and cognitive robotics.',
    whyEdinburgh: 'Ranked #1 in the UK for Computer Science & Informatics research power (REF). Located at the Appleton Tower and Bayes Centre.',
    requirements: {
      alevel: 'A*AA including Mathematics at grade A*. Further Maths recommended.',
      gcse: 'Physics or Computer Science grade 6 (B).',
      english: 'IELTS 6.5 (min 6.0 in each band)'
    },
    modules: {
      core: ['Informatics 1: Functional Programming (Haskell) & Computation', 'Object-Oriented Programming (Java)', 'Algorithms & Data Structures', 'Artificial Intelligence & Machine Learning', 'Honours Large-Scale Software Project'],
      optional: ['Robotics & Autonomous Systems', 'Quantum Computing', 'Computer Graphics & Vision', 'Cyber Security']
    }
  },
  {
    title: 'MSc Artificial Intelligence',
    slug: 'msc-artificial-intelligence',
    faculty: 'Science & Engineering',
    college: 'College of Science & Engineering',
    level: 'Postgraduate',
    duration: '1 year full-time',
    ucas: 'N/A',
    entry: 'First-class or 2:1 honours degree in Informatics, Maths, Physics, or Engineering',
    feesUK: '£18,200',
    feesInt: '£40,900',
    img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80',
    description: 'The oldest and most prestigious AI masters in the UK, established in 1963. Deeply explores reinforcement learning, deep neural architectures, natural language processing, and probabilistic reasoning.',
    whyEdinburgh: 'Home to the UK National Robotarium and Bayes Centre. Unrivalled industry placement pipeline with Edinburgh AI spinouts and global tech giants.',
    requirements: {
      alevel: 'N/A (Postgraduate entry)',
      gcse: 'N/A',
      english: 'IELTS 7.0 (min 6.5 in each band)'
    },
    modules: {
      core: ['Probabilistic Machine Learning', 'Deep Learning & Neural Architectures', 'Natural Language Understanding', 'AI Ethics & Safe Intelligence', 'MSc AI Research Dissertation'],
      optional: ['Robotic Vision', 'Automated Reasoning', 'Bioinformatics & Computational Biology']
    }
  },
  {
    title: 'MSc Management',
    slug: 'msc-management',
    faculty: 'Arts, Humanities & Social Sciences',
    college: 'College of Arts, Humanities & Social Sciences',
    level: 'Postgraduate',
    duration: '1 year full-time',
    ucas: 'N/A',
    entry: '2:1 honours degree in any discipline',
    feesUK: '£18,500',
    feesInt: '£33,800',
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    description: 'Delivered by the triple-accredited University of Edinburgh Business School (AACSB, AMBA, EQUIS). Equips ambitious graduates with strategic acumen, business analytics, financial leadership, and global sustainability management.',
    whyEdinburgh: 'Located in the heart of Edinburgh’s financial sector — the UK’s 2nd largest financial centre. Includes Edinburgh Consultancy Project working directly with corporate clients.',
    requirements: {
      alevel: 'N/A (Postgraduate entry)',
      gcse: 'Mathematics at grade 5 (B) or higher.',
      english: 'IELTS 7.0 (min 6.0 in each section)'
    },
    modules: {
      core: ['Strategic Management in Global Markets', 'Corporate Finance & Accounting', 'Operations & Supply Chain Excellence', 'Leadership & Organizational Dynamics', 'Capstone Edinburgh Consulting Project'],
      optional: ['Digital Business Transformation', 'Sustainable Entrepreneurship', 'Marketing Strategy & Brand Management']
    }
  },
  {
    title: 'BSc International Business',
    slug: 'bsc-international-business',
    faculty: 'Arts, Humanities & Social Sciences',
    college: 'College of Arts, Humanities & Social Sciences',
    level: 'Undergraduate',
    duration: '4 years full-time (MA Hons)',
    ucas: 'N120',
    entry: 'AAA–AAB including Mathematics',
    feesUK: '£9,250 (RUK) / £1,820 (Scotland)',
    feesInt: '£30,400',
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    description: 'A 4-year Scottish MA (Hons) degree combining international business strategy, cross-border economics, financial markets, and mandatory study abroad year with global partner universities.',
    whyEdinburgh: 'Study in Scotland’s capital with triple-crown business accreditation and a 3rd-year international exchange at partner institutions in Singapore, USA, Europe, or Canada.',
    requirements: {
      alevel: 'AAA–AAB at A Level.',
      gcse: 'Mathematics grade 6 (B) and English Language grade 5 (B).',
      english: 'IELTS 6.5 (min 6.0 in each band)'
    },
    modules: {
      core: ['Global Business Environment', 'Managerial Economics', 'International Financial Institutions', 'Cross-Cultural Business Dynamics', 'Honours Business Dissertation'],
      optional: ['Business Chinese/Spanish', 'Emerging Market Strategies', 'Fintech Innovations']
    }
  },
  {
    title: 'MBChB Medicine',
    slug: 'mbchb-medicine',
    faculty: 'Medicine & Veterinary Medicine',
    college: 'College of Medicine & Veterinary Medicine',
    level: 'Undergraduate',
    duration: '5 years full-time',
    ucas: 'A100',
    entry: 'A*AA including Chemistry and Biology',
    feesUK: '£9,250 (RUK) / £1,820 (Scotland)',
    feesInt: '£49,900',
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    description: 'One of the world’s oldest and most prestigious medical schools (founded 1726). Integrates early clinical contact, precision diagnostics, and anatomy with teaching at the Royal Infirmary and Western General.',
    whyEdinburgh: 'Historic medical pedigree (Joseph Lister, Arthur Conan Doyle). Direct clinical rotations across major NHS Scotland tertiary trauma hospitals.',
    requirements: {
      alevel: 'A*AA in one sitting, including Chemistry and Biology/Human Biology.',
      gcse: 'Biology, Chemistry, Mathematics, English grade 7 (A).',
      english: 'IELTS 7.5 (min 7.0 in each band)'
    },
    modules: {
      core: ['Biomedical Sciences & Human Systems', 'Clinical Skills & Doctor-Patient Communication', 'Pathology & Pharmacology', 'Clinical Specialty Rotations', 'Senior Hospital Apprenticeship'],
      optional: ['Global Health Elective', 'Intercalated Honours Degree', 'Surgical Innovation']
    }
  },
  {
    title: 'MSc Precision Oncology & Cancer Genomics',
    slug: 'msc-biomedical-sciences',
    faculty: 'Medicine & Veterinary Medicine',
    college: 'College of Medicine & Veterinary Medicine',
    level: 'Postgraduate',
    duration: '1 year full-time',
    ucas: 'N/A',
    entry: '2:1 honours degree in biomedical sciences, biology, medicine, or genetics',
    feesUK: '£15,200',
    feesInt: '£34,800',
    img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    description: 'Based at the Institute of Genetics and Cancer (IGC) at Western General Hospital. Explores next-generation sequencing, molecular therapeutics, tumor biology, and biomarker discovery.',
    whyEdinburgh: 'Work directly within world-renowned CRUK Scotland Centre laboratories with access to clinical trial tissue biobanks.',
    requirements: {
      alevel: 'N/A',
      gcse: 'Science subjects grade 6 (B).',
      english: 'IELTS 7.0 (min 6.5 in all sections)'
    },
    modules: {
      core: ['Cancer Biology & Target Discovery', 'Genomic Technologies & Bioinformatics', 'Translational Clinical Trial Design', 'Laboratory Wet-Lab Dissertation Project'],
      optional: ['Immunotherapy Innovations', 'Epigenetics in Disease', 'Cell Signaling Pathways']
    }
  },
  {
    title: 'MEng Mechanical Engineering',
    slug: 'meng-mechanical-engineering',
    faculty: 'Science & Engineering',
    college: 'College of Science & Engineering',
    level: 'Undergraduate',
    duration: '5 years full-time (Integrated MEng)',
    ucas: 'H300',
    entry: 'A*AA including Mathematics and Physics',
    feesUK: '£9,250 (RUK) / £1,820 (Scotland)',
    feesInt: '£34,800',
    img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'An accredited 5-year Scottish master of engineering degree emphasizing renewable marine energy, aerospace thermodynamics, robotics, and advanced computational mechanics.',
    whyEdinburgh: 'Home to the FloWave Ocean Energy Research Facility — the world’s most sophisticated wave and current simulation tank.',
    requirements: {
      alevel: 'A*AA including Maths (A*) and Physics (A).',
      gcse: 'English Language grade 5 (B).',
      english: 'IELTS 6.5 (min 6.0 in each band)'
    },
    modules: {
      core: ['Engineering Mathematics & Computing', 'Fluid Dynamics & Thermodynamics', 'Structural Mechanics & Materials', 'Group Design Industrial Project', 'MEng Master Thesis'],
      optional: ['Marine Energy Technology', 'Robotics & Control', 'Aerospace Propulsion']
    }
  }
];

const academics = {
  render(container, params = {}) {
    const slug = params.slug;

    if (slug) {
      this.renderDetail(container, slug);
    } else {
      this.renderList(container);
    }
  },

  renderList(container) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const query = urlParams.get('q') || '';
    const levelFilter = urlParams.get('level') || 'all';

    container.innerHTML = `
      <div style="background: var(--color-primary); color: white; padding: 4rem 1.5rem 3rem;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(213,0,50,0.25); border: 1px solid rgba(213,0,50,0.6); padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem;">
            🏴󠁧󠁢󠁳󠁣󠁴󠁿 Degree Finder 2026/27 &bull; Russell Group
          </div>
          <h1 style="font-family: var(--font-heading); font-size: clamp(2.2rem, 4vw, 3.2rem); margin: 0 0 1rem; color: white;">
            Explore Our Programmes
          </h1>
          <p style="color: #CBD2D9; font-size: 1.1rem; max-width: 750px; line-height: 1.6; margin-bottom: 2rem;">
            Discover undergraduate, postgraduate, and research degrees across the University of Edinburgh's three prestigious colleges.
          </p>

          <!-- Search & Filter Controls -->
          <div style="background: white; border-radius: 12px; padding: 12px; display: flex; flex-wrap: wrap; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
            <input type="text" id="course-search-input" value="${query}" placeholder="Search by course title, keyword, or faculty..." style="flex: 2; min-width: 240px; padding: 12px 16px; border: 1px solid var(--color-medium-grey); border-radius: 8px; font-size: 0.95rem; outline: none; color: var(--color-dark);">
            
            <select id="course-level-filter" style="flex: 1; min-width: 160px; padding: 12px 14px; border: 1px solid var(--color-medium-grey); border-radius: 8px; font-size: 0.92rem; background: white; color: var(--color-dark); outline: none;">
              <option value="all" ${levelFilter === 'all' ? 'selected' : ''}>All Levels</option>
              <option value="Undergraduate" ${levelFilter === 'Undergraduate' ? 'selected' : ''}>Undergraduate (BSc/BEng/MA)</option>
              <option value="Postgraduate" ${levelFilter === 'Postgraduate' ? 'selected' : ''}>Postgraduate (MSc/MBChB)</option>
            </select>

            <select id="course-faculty-filter" style="flex: 1; min-width: 180px; padding: 12px 14px; border: 1px solid var(--color-medium-grey); border-radius: 8px; font-size: 0.92rem; background: white; color: var(--color-dark); outline: none;">
              <option value="all">All Colleges</option>
              <option value="Science & Engineering">Science &amp; Engineering</option>
              <option value="Medicine & Veterinary Medicine">Medicine &amp; Veterinary Medicine</option>
              <option value="Arts, Humanities & Social Sciences">Arts, Humanities &amp; Social Sciences</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Course Listing Grid -->
      <div style="background: var(--color-bg-alt); padding: 4rem 1.5rem; min-height: 60vh;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div id="course-count-display" style="font-weight: 700; color: var(--color-primary); font-size: 1.1rem;">
              Showing ${courses.length} Programmes
            </div>
            <div style="font-size: 0.88rem; color: var(--color-slate);">
              ⚡ All programmes qualify for <strong>6-Day Closing Scholarships</strong>
            </div>
          </div>

          <div id="courses-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
            ${this.buildCourseCards(courses)}
          </div>

        </div>
      </div>
    `;
  },

  buildCourseCards(items) {
    if (!items.length) {
      return `
        <div style="grid-column: 1/-1; background: white; padding: 3rem; text-align: center; border-radius: 12px; border: 1px solid var(--color-light-grey);">
          <h3>No matching programmes found</h3>
          <p style="color: var(--color-slate);">Try clearing your search terms or filters.</p>
        </div>
      `;
    }

    return items.map(c => `
      <div class="card course-card" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-light-grey); display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">
        <div style="height: 180px; background: url('${c.img}') center/cover no-repeat; position: relative;">
          <span style="position: absolute; top: 12px; left: 12px; background: var(--color-primary); color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${c.level}</span>
          <span style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.75); color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">⏱️ ${c.duration}</span>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-secondary); text-transform: uppercase; margin-bottom: 6px;">
            ${c.college || c.faculty}
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin: 0 0 10px; color: var(--color-primary); line-height: 1.3;">
            <a href="#/courses/${c.slug}" style="color: inherit; text-decoration: none;">${c.title}</a>
          </h3>
          <p style="font-size: 0.88rem; color: var(--color-slate); line-height: 1.55; margin-bottom: 1.25rem; flex: 1;">
            ${c.description.substring(0, 140)}...
          </p>

          <div style="background: var(--color-bg-alt); padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--color-slate);">Entry Standard:</span>
              <strong style="color: var(--color-primary);">${c.entry.split(' ')[0]}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--color-slate);">UCAS / Code:</span>
              <strong style="color: var(--color-secondary);">${c.ucas}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 8px; border-top: 1px solid var(--color-light-grey); padding-top: 1rem;">
            <a href="#/courses/${c.slug}" class="btn btn-outline" style="flex: 1; text-align: center; font-size: 0.88rem; padding: 8px 12px;">Course Details</a>
            <a href="#/scholarships" class="btn btn-secondary" style="font-size: 0.88rem; padding: 8px 14px;" title="View 6-day closing scholarship for this course">🎓 Scholarship</a>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderDetail(container, slug) {
    const course = courses.find(c => c.slug === slug) || courses[0];

    container.innerHTML = `
      <div style="background: var(--color-primary); color: white; padding: 3.5rem 1.5rem 2.5rem;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <a href="#/academics" style="color: #CBD2D9; font-size: 0.88rem; text-decoration: none; display: inline-block; margin-bottom: 1rem;">
            &larr; Back to all programmes
          </a>
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <span class="badge" style="background: var(--color-secondary); color: white;">${course.level}</span>
            <span style="color: var(--color-accent-gold-light); font-size: 0.9rem; font-weight: 600;">${course.college || course.faculty}</span>
          </div>
          <h1 style="font-family: var(--font-heading); font-size: clamp(2rem, 3.5vw, 3rem); margin: 0 0 1rem; color: white;">
            ${course.title}
          </h1>
          <p style="color: #CBD2D9; font-size: 1.1rem; max-width: 800px; line-height: 1.6;">
            ${course.description}
          </p>
        </div>
      </div>

      <!-- Detail Body -->
      <div style="background: var(--color-bg-alt); padding: 4rem 1.5rem;">
        <div class="container" style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr; gap: 3rem;">
          
          <!-- Left Column -->
          <div>
            <!-- Why Edinburgh -->
            <div class="card" style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid var(--color-light-grey); margin-bottom: 2rem;">
              <h2 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; margin: 0 0 1rem;">
                Why Study at The University of Edinburgh?
              </h2>
              <p style="color: var(--color-slate); font-size: 1rem; line-height: 1.65; margin: 0;">
                ${course.whyEdinburgh}
              </p>
            </div>

            <!-- Modules -->
            <div class="card" style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid var(--color-light-grey); margin-bottom: 2rem;">
              <h2 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; margin: 0 0 1.25rem;">
                What You Will Study (Core Modules)
              </h2>
              
              <h4 style="color: var(--color-primary); margin: 0 0 10px; font-size: 1.05rem;">Compulsory Coursework:</h4>
              <ul style="list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: 8px;">
                ${course.modules.core.map(m => `
                  <li style="display: flex; gap: 10px; align-items: center; color: var(--color-dark); font-size: 0.95rem;">
                    <span style="color: var(--color-success); font-weight: bold;">✓</span>
                    <span>${m}</span>
                  </li>
                `).join('')}
              </ul>

              <h4 style="color: var(--color-primary); margin: 0 0 10px; font-size: 1.05rem;">Electives &amp; Specialisations:</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                ${course.modules.optional.map(m => `
                  <li style="display: flex; gap: 10px; align-items: center; color: var(--color-slate); font-size: 0.92rem;">
                    <span style="color: var(--color-secondary);">•</span>
                    <span>${m}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Entry Requirements -->
            <div class="card" style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid var(--color-light-grey);">
              <h2 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; margin: 0 0 1rem;">
                Entry Requirements
              </h2>
              <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem;">
                <div>
                  <strong>Academic Standard:</strong> <span style="color: var(--color-slate);">${course.requirements.alevel}</span>
                </div>
                <div>
                  <strong>GCSE / National 5:</strong> <span style="color: var(--color-slate);">${course.requirements.gcse}</span>
                </div>
                <div>
                  <strong>English Language:</strong> <span style="color: var(--color-slate);">${course.requirements.english}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column / Sticky Sidebar -->
          <div>
            <div class="card" style="background: white; border-radius: 12px; padding: 2rem; border: 1px solid var(--color-light-grey); position: sticky; top: 100px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
              <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin: 0 0 1.25rem; color: var(--color-primary);">
                Key Course Facts
              </h3>

              <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.92rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-light-grey); padding-bottom: 8px;">
                  <span style="color: var(--color-slate);">Duration</span>
                  <strong>${course.duration}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-light-grey); padding-bottom: 8px;">
                  <span style="color: var(--color-slate);">UCAS Code</span>
                  <strong>${course.ucas}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-light-grey); padding-bottom: 8px;">
                  <span style="color: var(--color-slate);">Home Tuition</span>
                  <strong>${course.feesUK}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-light-grey); padding-bottom: 8px;">
                  <span style="color: var(--color-slate);">International Fee</span>
                  <strong>${course.feesInt}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--color-slate);">Scholarship</span>
                  <span class="badge" style="background: var(--color-secondary); color: white;">6-Day Deadline</span>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="#/scholarships" class="btn btn-secondary" style="width: 100%; text-align: center; padding: 12px; font-weight: 700;">
                  Apply for Scholarship &rarr;
                </a>
                <a href="#/portal" class="btn btn-outline" style="width: 100%; text-align: center; padding: 10px; font-weight: 600;">
                  Start Direct Application
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  init() {
    const searchInput = document.getElementById('course-search-input');
    const levelFilter = document.getElementById('course-level-filter');
    const facultyFilter = document.getElementById('course-faculty-filter');
    const grid = document.getElementById('courses-grid');
    const countDisplay = document.getElementById('course-count-display');

    const filterHandler = () => {
      const q = searchInput?.value.toLowerCase().trim() || '';
      const lvl = levelFilter?.value || 'all';
      const fac = facultyFilter?.value || 'all';

      const filtered = courses.filter(c => {
        const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || (c.faculty && c.faculty.toLowerCase().includes(q)) || (c.college && c.college.toLowerCase().includes(q));
        const matchesLevel = lvl === 'all' || c.level === lvl;
        const matchesFac = fac === 'all' || c.faculty === fac;
        return matchesQuery && matchesLevel && matchesFac;
      });

      if (grid) grid.innerHTML = this.buildCourseCards(filtered);
      if (countDisplay) countDisplay.textContent = `Showing ${filtered.length} Programmes`;
    };

    searchInput?.addEventListener('input', filterHandler);
    levelFilter?.addEventListener('change', filterHandler);
    facultyFilter?.addEventListener('change', filterHandler);
  }
};

export default academics;
