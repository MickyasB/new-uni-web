// js/pages/scholarships.js — Comprehensive Scholarship Directory (25+ Undergraduate Fully Covered Awards)
import state from '../state.js';
import api from '../api.js';

// Calculate exact 6-day deadline from current date
const SIX_DAYS_DEADLINE = '2026-08-28';

export const SCHOLARSHIPS_DATA = [
  // 1. HEALTH INFORMATICS & DIGITAL HEALTH
  {
    id: 'sch-ug-hi-1',
    title: "Edinburgh Global Undergraduate Full Scholarship in Health Informatics & Digital Health",
    field: "Health Informatics",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Covered + £9,000 Annual Living Stipend (4 Years)",
    amountValue: 38500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Full scholarship for exceptional students entering the 4-year BSc (Hons) Health Informatics & Digital Health degree. Combines NHS Scotland digital health systems, clinical informatics, algorithms, and AI for public health.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition Fee waiver across all 4 undergraduate years",
      "£9,000 annual maintenance & living stipend (£36,000 total)",
      "Guaranteed clinical data science internship with NHS Lothian & Usher Institute"
    ]
  },

  // 2. COMPUTER SCIENCE & ARTIFICIAL INTELLIGENCE
  {
    id: 'sch-ug-cs-1',
    title: "Ada Lovelace & Alan Turing Undergraduate Full Scholarship in Computer Science & AI",
    field: "Computer Science",
    faculty: "Science",
    level: "Undergraduate",
    amount: "100% Tuition Fee Covered + £9,500 Annual Living Stipend (4 Years)",
    amountValue: 39500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Premier computer science scholarship for BSc/BEng Computer Science and AI entrants. Honoring world-renowned computing history with access to the Bayes Centre and high-performance computing clusters.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition covered for the full 4-year Scottish BSc (Hons)",
      "£9,500 yearly living stipend deposited directly each semester",
      "Dedicated GPU research workstation in the Bayes Centre Innovation Hub"
    ]
  },

  // 3. DATA SCIENCE & APPLIED ANALYTICS
  {
    id: 'sch-ug-ds-1',
    title: "Edinburgh Data-Driven Innovation (DDI) Undergraduate Full Fellowship",
    field: "Data Science",
    faculty: "Science",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £8,500 Annual Living Stipend + Hardware Grant",
    amountValue: 38000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Awarded to future data architects and analytics leaders in BSc Data Science, Big Data Analytics, and Computational Statistics. Supported by the Edinburgh Data-Driven Innovation initiative.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Complete 4-year tuition fee exemption",
      "£8,500 annual living allowance",
      "£1,500 high-performance laptop and cloud computation grant"
    ]
  },

  // 4. SOFTWARE ENGINEERING & CYBERSECURITY
  {
    id: 'sch-ug-se-1',
    title: "Edinburgh Cyber Security & Distributed Systems Undergraduate Full Scholarship",
    field: "Software Engineering",
    faculty: "Science",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,000 Annual Maintenance Grant",
    amountValue: 37500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Designed for innovators enrolled in BEng Software Engineering or BSc Cyber Security. Includes hands-on cyber defense drills, zero-trust network research, and industry security credentials.",
    eligibility: { minGPA: 3.4, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full tuition waiver for all 4 years",
      "£8,000 annual maintenance stipend",
      "Industry defense lab sponsorship and security clearance workshops"
    ]
  },

  // 5. MANAGEMENT & INTERNATIONAL BUSINESS
  {
    id: 'sch-ug-mgt-1',
    title: "Edinburgh Business School Global Undergraduate Leadership Full Scholarship",
    field: "Management",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,500 Annual Living Stipend",
    amountValue: 36500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Prestigious award for ambitious leaders accepted into MA (Hons) Business Management, International Business, or Strategic Marketing. Focuses on ethical leadership, enterprise, and global strategy.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition Fee covered across 4 years",
      "£8,500 annual living stipend",
      "Executive mentorship by Edinburgh Business School alumni in London and Edinburgh"
    ]
  },

  // 6. ACCOUNTING, FINANCE & FINTECH
  {
    id: 'sch-ug-fin-1',
    title: "Scottish Financial Centre Undergraduate Full Scholarship in Finance & Fintech",
    field: "Finance & Accounting",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "Full Tuition Coverage + £8,000 Annual Living Allowance + City Internship",
    amountValue: 36000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Supporting future financial analysts, chartered accountants, and fintech engineers in MA (Hons) Accounting and Finance. Directly linked to Scotland's renowned banking and asset management district.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 100% tuition waiver for 4 years",
      "£8,000 annual living grant",
      "Guaranteed summer internship with top Scottish financial firms"
    ]
  },

  // 7. ECONOMICS & ECONOMETRICS
  {
    id: 'sch-ug-econ-1',
    title: "Adam Smith Global Undergraduate Full Scholarship in Economics & Econometrics",
    field: "Economics",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,500 Annual Maintenance Grant",
    amountValue: 36500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "In tribute to Adam Smith, an illustrious Scottish philosopher and economist. Supports students in MA (Hons) Economics, Economics with Finance, or Quantitative Econometrics.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% 4-year tuition fee exemption",
      "£8,500 annual living allowance",
      "Junior research fellowship at the Edinburgh Experimental Economics Lab"
    ]
  },

  // 8. BIOMEDICAL SCIENCES & CLINICAL LAB SCIENCES
  {
    id: 'sch-ug-bio-1',
    title: "Edinburgh BioQuarter Undergraduate Full Scholarship in Biomedical Sciences",
    field: "Biomedical Sciences",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £9,000 Annual Living Stipend + Bench Fee Exemption",
    amountValue: 39000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Provides full funding for undergraduates in BSc Biomedical Sciences, Medical Microbiology, or Infectious Diseases. Conduct research at the state-of-the-art Edinburgh BioQuarter biomedical cluster.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year tuition fee waiver",
      "£9,000 annual living stipend",
      "Dedicated wet-lab workspace and bench fees covered at Edinburgh BioQuarter"
    ]
  },

  // 9. MEDICINE & PRE-CLINICAL SURGERY
  {
    id: 'sch-ug-med-1',
    title: "Edinburgh Medical School Pre-Clinical Foundation Full Scholarship",
    field: "Medicine",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "Full 100% Tuition (£38,000/yr) + £10,000 Annual Living Stipend",
    amountValue: 48000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Edinburgh Medical School is one of the world's most storied institutions (Est. 1726). Full scholarship covering tuition and living expenses for exceptional MBChB pre-clinical medicine entrants.",
    eligibility: { minGPA: 3.8, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 100% tuition coverage across MBChB foundation years",
      "£10,000 annual maintenance & clinical supplies stipend",
      "Clinical shadowing at the Royal Infirmary of Edinburgh & Western General"
    ]
  },

  // 10. PHARMACOLOGY & DRUG DISCOVERY
  {
    id: 'sch-ug-pharm-1',
    title: "Sir Alexander Fleming Undergraduate Full Scholarship in Pharmacology & Therapeutics",
    field: "Pharmacology",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Fee Covered + £8,500 Annual Living Allowance (4 Years)",
    amountValue: 38000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Awarded to outstanding students entering BSc Pharmacology, Medicinal Chemistry, or Drug Formulation. Prepares scholars for global pharmaceutical breakthroughs.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition waiver for 4-year BSc (Hons)",
      "£8,500 yearly living stipend",
      "High-throughput screening and molecular docking lab training"
    ]
  },

  // 11. NURSING STUDIES & PUBLIC HEALTH
  {
    id: 'sch-ug-nurs-1',
    title: "Edinburgh Royal Infirmary Undergraduate Full Scholarship in Nursing & Global Health",
    field: "Nursing & Public Health",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "Full Tuition Coverage + £9,500 Annual NHS Living Grant + Uniform Allowance",
    amountValue: 36000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Full scholarship supporting future nurse leaders and public health champions enrolled in BN (Hons) Nursing Studies at our Old Medical Quad.",
    eligibility: { minGPA: 3.3, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 100% tuition fee waiver for all 4 years",
      "£9,500 annual living and maintenance stipend",
      "Clinical simulation suite access and guaranteed NHS Scotland rotation"
    ]
  },

  // 12. VETERINARY MEDICINE & COMPARATIVE BIOLOGY
  {
    id: 'sch-ug-vet-1',
    title: "Royal (Dick) School of Veterinary Studies Global Undergraduate Full Scholarship",
    field: "Veterinary Medicine",
    faculty: "Medicine & Health Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £10,000 Annual Living Stipend + Clinical Grant",
    amountValue: 46000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "The Royal (Dick) Vet School is ranked #1 in the UK for Veterinary Medicine. Complete tuition and maintenance funding for high-achieving BVM&S veterinary medicine students.",
    eligibility: { minGPA: 3.7, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full tuition fee covered across BVM&S studies",
      "£10,000 annual maintenance & clinical equipment stipend",
      "Clinical training at Easter Bush Hospital for Small Animals & Equine Hospital"
    ]
  },

  // 13. MECHANICAL & AEROSPACE ENGINEERING
  {
    id: 'sch-ug-mech-1',
    title: "James Watt Undergraduate Full Scholarship in Mechanical & Aerospace Engineering",
    field: "Mechanical Engineering",
    faculty: "Engineering",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £8,500 Annual Living Stipend + Workshop Grant",
    amountValue: 38500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Honoring mechanical pioneer James Watt. Full coverage for BEng/MEng Mechanical Engineering, Aerospace Dynamics, or Sustainable Energy Conversion at King's Buildings campus.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% 4-year tuition fee exemption",
      "£8,500 yearly living stipend",
      "King's Buildings Aerodynamics, Wind Tunnel & CNC fabrication suite access"
    ]
  },

  // 14. ELECTRICAL & ELECTRONIC ENGINEERING
  {
    id: 'sch-ug-eee-1',
    title: "Maxwell Quantum Microelectronics & Electrical Engineering Full Scholarship",
    field: "Electrical Engineering",
    faculty: "Engineering",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,500 Annual Living Stipend",
    amountValue: 38500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "In honor of James Clerk Maxwell. Covers full tuition and living expenses for BEng Electrical & Mechanical Engineering, Robotics, or Embedded Semiconductor Systems.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year tuition covered",
      "£8,500 annual living support",
      "Semiconductor cleanroom and Scottish Microelectronics Centre access"
    ]
  },

  // 15. CIVIL & ENVIRONMENTAL ENGINEERING
  {
    id: 'sch-ug-civ-1',
    title: "Robert Stevenson Undergraduate Full Scholarship in Civil & Sustainable Infrastructure",
    field: "Civil Engineering",
    faculty: "Engineering",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £8,000 Annual Living Allowance",
    amountValue: 38000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "For innovators studying BEng Civil Engineering or Environmental Geoscience. Focused on coastal resilience, green building materials, and net-zero urban civil structures.",
    eligibility: { minGPA: 3.4, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition fee waiver across 4 years",
      "£8,000 annual maintenance stipend",
      "Structural testing wave tank and environmental geotechnics lab fellowship"
    ]
  },

  // 16. CHEMICAL & CLEAN ENERGY ENGINEERING
  {
    id: 'sch-ug-chemeng-1',
    title: "Edinburgh Carbon Neutrality & Chemical Engineering Undergraduate Full Scholarship",
    field: "Chemical Engineering",
    faculty: "Engineering",
    level: "Undergraduate",
    amount: "100% Tuition Covered + £8,500 Annual Living Stipend",
    amountValue: 38500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Supports top applicants to BEng Chemical Engineering or Sustainable Energy Systems working on carbon capture, green hydrogen, and renewable chemical processes.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition fee coverage (4 Years)",
      "£8,500 annual living stipend",
      "Direct residency at Edinburgh Carbon Capture & Hydrogen pilot plant"
    ]
  },

  // 17. BIOLOGICAL SCIENCES & GENETICS
  {
    id: 'sch-ug-bio-gen-1',
    title: "Roslin Institute Undergraduate Full Fellowship in Genetics & Biotechnology",
    field: "Biological Sciences",
    faculty: "Science",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £9,000 Annual Living Stipend + CRISPR Lab Access",
    amountValue: 39000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "World-leading scholarship from the Roslin Institute (famed for Dolly the Sheep). Fully covers BSc Biological Sciences, Molecular Genetics, or Plant Science.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year tuition fee exemption",
      "£9,000 annual maintenance stipend",
      "Roslin Institute genomics & CRISPR gene-editing research training"
    ]
  },

  // 18. MATHEMATICS & MATHEMATICAL PHYSICS
  {
    id: 'sch-ug-math-1',
    title: "James Clerk Maxwell Undergraduate Full Scholarship in Mathematics & Statistics",
    field: "Mathematics",
    faculty: "Science",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,000 Annual Living Stipend",
    amountValue: 36000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Awarded to gifted mathematicians entering BSc/MMath Mathematics, Pure Mathematics, or Financial Mathematics at the School of Mathematics, King's Buildings.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition waiver for 4-year degree",
      "£8,000 annual living allowance",
      "Junior Scholar status at International Centre for Mathematical Sciences (ICMS)"
    ]
  },

  // 19. PHYSICS, ASTRONOMY & QUANTUM SCIENCE
  {
    id: 'sch-ug-phys-1',
    title: "Peter Higgs Undergraduate Full Fellowship in Physics & Quantum Technologies",
    field: "Physics & Astronomy",
    faculty: "Science",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £9,000 Annual Living Allowance + Observatory Grant",
    amountValue: 39000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Named in honor of Nobel Laureate Prof. Peter Higgs. Full funding for BSc/MPhys Physics, Astrophysics, or Quantum Information at the School of Physics and Astronomy.",
    eligibility: { minGPA: 3.7, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year tuition coverage",
      "£9,000 annual living support",
      "Royal Observatory Edinburgh & Higgs Centre for Theoretical Physics access"
    ]
  },

  // 20. CHEMISTRY & MOLECULAR SCIENCES
  {
    id: 'sch-ug-chem-1',
    title: "Joseph Black Undergraduate Full Award in Sustainable Chemistry & Molecular Science",
    field: "Chemistry",
    faculty: "Science",
    level: "Undergraduate",
    amount: "100% Tuition Fee Covered + £8,500 Annual Living Stipend",
    amountValue: 38000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Joseph Black discovered latent heat and carbon dioxide at Edinburgh. This scholarship fully finances BSc/MChem Chemistry, Medicinal Chemistry, or Environmental Chemistry.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full tuition fee covered (4 Years)",
      "£8,500 annual living stipend",
      "Joseph Black NMR spectroscopy & automated synthesis suite training"
    ]
  },

  // 21. LAW & GLOBAL HUMAN RIGHTS
  {
    id: 'sch-ug-law-1',
    title: "Edinburgh Law School Old College Undergraduate Full Scholarship in Law",
    field: "Law",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £8,000 Annual Living Allowance + Court Residency",
    amountValue: 35500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Study law at historic Old College (Est. 1707). Full funding for LLB (Hons) Law, Law and International Relations, or Global Commercial Law.",
    eligibility: { minGPA: 3.6, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year LLB tuition fee waiver",
      "£8,000 annual living stipend",
      "Scottish Parliament, Court of Session, and Edinburgh Mooting Society immersion"
    ]
  },

  // 22. POLITICS & INTERNATIONAL RELATIONS
  {
    id: 'sch-ug-pol-1',
    title: "Edinburgh Global Governance & International Relations Undergraduate Full Award",
    field: "Politics & International Relations",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £8,000 Annual Living Stipend",
    amountValue: 35500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Empowers future diplomats, policy analysts, and NGO leaders studying MA (Hons) Politics, International Relations, or International Development.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition fee covered across 4 years",
      "£8,000 annual living allowance",
      "United Nations simulation & foreign policy research immersion fellowship"
    ]
  },

  // 23. PSYCHOLOGY & COGNITIVE NEUROSCIENCE
  {
    id: 'sch-ug-psych-1',
    title: "Edinburgh Cognitive Neuroscience & Psychology Undergraduate Full Fellowship",
    field: "Psychology",
    faculty: "Social Sciences",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £8,500 Annual Living Stipend + EEG Lab Access",
    amountValue: 37500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Full scholarship for BSc (Hons) Psychology or Cognitive Science entrants. Includes hands-on neuroimaging, experimental psycholinguistics, and cognitive testing laboratory training.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 4-year tuition fee exemption",
      "£8,500 annual living support",
      "7T fMRI, EEG, and developmental cognitive testing lab workspace"
    ]
  },

  // 24. ARCHITECTURE, URBANISM & DESIGN
  {
    id: 'sch-ug-arch-1',
    title: "Edinburgh College of Art (ECA) Undergraduate Full Scholarship in Architecture",
    field: "Architecture & Design",
    faculty: "Arts",
    level: "Undergraduate",
    amount: "Full 100% Tuition + £9,000 Annual Studio & Living Allowance",
    amountValue: 38000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Edinburgh's UNESCO World Heritage cityscape inspires architecture education. Full coverage for MA (Hons) Architecture, Architectural History, or Landscape Urbanism at ECA.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition covered (4 Years)",
      "£9,000 annual studio materials & living allowance",
      "Dedicated personal design drafting studio desk in ECA Lauriston Place"
    ]
  },

  // 25. MEDIA, DIGITAL COMMUNICATION & JOURNALISM
  {
    id: 'sch-ug-media-1',
    title: "Edinburgh Digital Media, Communication & Society Undergraduate Full Scholarship",
    field: "Media & Communication",
    faculty: "Arts",
    level: "Undergraduate",
    amount: "100% Tuition Fee Waiver + £7,500 Annual Living Allowance",
    amountValue: 34500,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "For future investigative journalists, media analysts, and digital content leaders enrolled in MA (Hons) Media, Digital Society, and Communication.",
    eligibility: { minGPA: 3.4, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "Full 100% tuition coverage for 4 years",
      "£7,500 annual maintenance allowance",
      "Edinburgh International Festival media desk and broadcast suite training"
    ]
  },

  // 26. LITERATURE, HISTORY & CREATIVE ARTS
  {
    id: 'sch-ug-arts-1',
    title: "Sir Walter Scott Undergraduate Full Scholarship in English Literature & History",
    field: "Literature & History",
    faculty: "Arts",
    level: "Undergraduate",
    amount: "100% Tuition Fee Covered + £7,500 Annual Living Stipend",
    amountValue: 34000,
    nationality: "All",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Honoring Sir Walter Scott and Edinburgh as the world's first UNESCO City of Literature. Full scholarship for MA (Hons) English Literature, Scottish History, or Classics.",
    eligibility: { minGPA: 3.5, countries: ['All'], degreeLevels: ['Undergraduate'] },
    keyFeatures: [
      "100% Tuition fee waiver across 4 years",
      "£7,500 annual living support",
      "National Library of Scotland & Edinburgh Special Collections researcher pass"
    ]
  },

  // 27. FLAGSHIP ALL-UNIVERSITY EXCELLENCE AWARD
  {
    id: 'sch-gen-1',
    title: "Vice-Chancellor's Global Excellence Full Award (UG & Masters)",
    field: "General",
    faculty: "All",
    level: "All",
    amount: "Full 100% Tuition Fee Waiver (£36,000/yr) + Global Scholar Honor",
    amountValue: 36000,
    nationality: "International",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Our premier flagship university-wide scholarship honoring extraordinary international students displaying stellar academic merit, leadership, and positive societal impact.",
    eligibility: { minGPA: 3.8, countries: ['International', 'All'], degreeLevels: ['Undergraduate', 'Postgraduate', 'Masters'] },
    keyFeatures: [
      "100% Full Tuition fee coverage across all years of study",
      "Vice-Chancellor's Global Scholar Certificate & High-Table Dinner",
      "Priority access to University of Edinburgh global research networks"
    ]
  },

  // 28. DEVELOPING SOLUTIONS FULL SCHOLARSHIP
  {
    id: 'sch-gen-2',
    title: "Developing Solutions Full Scholarship (Africa, India & Commonwealth)",
    field: "General",
    faculty: "All",
    level: "All",
    amount: "100% Tuition + £10,000 Annual Living Allowance",
    amountValue: 46000,
    nationality: "International",
    deadline: SIX_DAYS_DEADLINE,
    isUrgent6Days: true,
    description: "Supports exceptional scholars from Africa, India, and developing Commonwealth nations committed to key sustainable development goals in health, technology, and economic infrastructure.",
    eligibility: { minGPA: 3.5, countries: ['Nigeria', 'India', 'Kenya', 'Ghana', 'Bangladesh', 'Pakistan', 'Tanzania', 'Uganda', 'International'], degreeLevels: ['Undergraduate', 'Postgraduate', 'Masters'] },
    keyFeatures: [
      "Full 100% tuition coverage for full degree duration",
      "£10,000 annual maintenance & living support",
      "Global Sustainable Development alumni community & mentorship"
    ]
  }
];

export default {
  render(container, params) {
    const isUrgentFilterFromURL = window.location.hash.includes('urgent=true');

    // Extract unique fields for filter list
    const allFields = Array.from(new Set(SCHOLARSHIPS_DATA.map(s => s.field))).sort();

    container.innerHTML = `
      <div class="scholarships-page font-body">
        <!-- Hero Section -->
        <section style="background: linear-gradient(135deg, #021230 0%, #041E42 60%, #0A2E5C 100%); color: white; padding: 4rem 1.5rem; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top:0; right: 0; bottom: 0; width: 40%; background: radial-gradient(circle at center, rgba(213, 0, 50, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
          <div class="container" style="max-width: 1000px; margin: 0 auto; position: relative; z-index: 2;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(213, 0, 50, 0.2); border: 1px solid var(--color-urgent); padding: 6px 14px; border-radius: 9999px; margin-bottom: 1.25rem;">
              <span style="color: var(--color-urgent); font-size: 14px;">⏳</span>
              <span style="color: #FFD5D8; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">2026/27 Funding Cycle &bull; 6-Day Urgent Deadlines Active (Closing 28 Aug)</span>
            </div>
            
            <h1 style="font-family: var(--font-heading); color: var(--color-white); font-size: clamp(2rem, 4vw, 3.25rem); margin-bottom: 1rem; line-height: 1.15;">
              Undergraduate &amp; Masters Fully Covered Scholarships
            </h1>
            <p style="font-size: 1.15rem; max-width: 860px; margin: 0 auto 2rem; color: #CBD2D9; line-height: 1.6;">
              The University of Edinburgh awards over <strong style="color: var(--color-accent-gold-light);">£45 million annually</strong> in <strong style="color: white;">100% Fully Covered Undergraduate &amp; Postgraduate Scholarships</strong> (100% Tuition Fee Waivers + £8,000–£10,000 Annual Living Stipends) across <strong>20+ academic fields</strong>.
            </p>
            
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
              <button id="btn-filter-urgent" class="btn btn-urgent" style="border-radius: 9999px; font-size: 14px; padding: 10px 20px;">
                🔥 View 6-Day Urgent Deadlines (Closing 28 Aug)
              </button>
              <button id="btn-filter-ug-full" class="btn btn-secondary" style="border-radius: 9999px; font-size: 14px; padding: 10px 20px;">
                🎓 100% Fully Covered Undergraduate Awards (${SCHOLARSHIPS_DATA.filter(s=>s.level==='Undergraduate').length})
              </button>
            </div>
          </div>
        </section>

        <div class="container" style="max-width: 1240px; margin: 0 auto; padding: 2.5rem 1rem;">
          
          <!-- Instructions Banner -->
          <div style="background: linear-gradient(135deg, #FFF9E6, #FFF3CD); border: 1px solid #FFEBAA; border-left: 5px solid var(--color-accent-gold-dark); border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; display: flex; gap: 1rem; align-items: flex-start; box-shadow: var(--shadow-xs);">
            <div style="font-size: 1.8rem; line-height: 1;">📌</div>
            <div>
              <h4 style="margin: 0 0 4px; color: #7A5B0B; font-size: 1.05rem;">Direct Application Instructions for Candidates</h4>
              <p style="margin: 0; color: #5C4304; font-size: 0.92rem; line-height: 1.5;">
                Select your target field and award below to start the interactive <strong>5-step application wizard</strong>. You will be prompted to register using your real personal email for official correspondence and decision notifications.
              </p>
            </div>
          </div>

          <!-- Quick Eligibility Calculator -->
          <section class="card" style="margin-bottom: 2.5rem; border: 1px solid var(--color-light-grey); border-radius: 12px; overflow: hidden; background: white;">
            <div id="checker-toggle-header" style="padding: 1.25rem 1.75rem; background: var(--color-bg-alt); border-bottom: 1px solid var(--color-light-grey); display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <div>
                <h3 style="margin: 0; color: var(--color-primary); font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
                  <span>🎯</span> Quick Eligibility Calculator (20+ Fields)
                </h3>
                <p style="margin: 4px 0 0; color: var(--color-slate); font-size: 0.88rem;">Select your intended level, field, and GPA to find your matching fully funded schemes.</p>
              </div>
              <button id="toggle-checker-btn" style="background: none; border: none; font-size: 1.25rem; color: var(--color-primary); cursor: pointer;">▼</button>
            </div>
            
            <div id="checker-body-content" style="padding: 1.75rem; display: block;">
              <form id="quiz-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; align-items: end;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">1. Study Level</label>
                  <select id="quiz-level" class="form-select" style="padding: 10px;">
                    <option value="All">All Levels</option>
                    <option value="Undergraduate" selected>Undergraduate (BSc / BEng / LLB / MBChB)</option>
                    <option value="Postgraduate">Postgraduate / Masters (MSc / MA)</option>
                  </select>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label">2. Target Academic Field</label>
                  <select id="quiz-field" class="form-select" style="padding: 10px;">
                    <option value="All">All Fields (20+ Available)</option>
                    ${allFields.map(f => `<option value="${f}">${f}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label">3. Cumulative GPA (out of 4.0)</label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="quiz-gpa-slider" min="2.5" max="4.0" step="0.1" value="3.5" style="flex: 1; accent-color: var(--color-secondary);">
                    <span id="quiz-gpa-display" style="font-weight: 700; font-family: var(--font-mono); color: var(--color-primary); min-width: 40px; text-align: center; background: var(--color-bg-alt); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--color-light-grey);">3.5</span>
                  </div>
                </div>

                <div>
                  <button type="submit" class="btn btn-secondary" style="width: 100%; padding: 12px; font-weight: 700;">
                    Filter Matching Awards &rarr;
                  </button>
                </div>
              </form>
            </div>
          </section>

          <!-- Main Layout: Sidebar & Cards -->
          <div style="display: grid; grid-template-columns: 280px 1fr; gap: 2rem;" class="scholarships-grid-layout">
            
            <!-- Filter Sidebar -->
            <aside style="background: white; border-radius: 10px; border: 1px solid var(--color-light-grey); padding: 1.5rem; height: fit-content; position: sticky; top: 90px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-light-grey);">
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--color-primary);">Filter Schemes</h3>
                <button id="btn-clear-all" style="background: none; border: none; color: var(--color-secondary-dark); font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: underline;">Reset All</button>
              </div>

              <!-- Urgent Deadline Filter -->
              <div style="background: var(--color-urgent-bg); border: 1px solid var(--color-urgent-border); border-radius: 6px; padding: 10px; margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 700; color: var(--color-urgent);">
                  <input type="checkbox" id="filter-urgent-only" ${isUrgentFilterFromURL ? 'checked' : ''}>
                  <span>🔥 6-Day Deadlines (28 Aug)</span>
                </label>
              </div>

              <!-- Degree Level Filter -->
              <div style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-slate);">Study Level</label>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
                  <label style="cursor: pointer;"><input type="radio" name="filter-level" value="All" checked> All Levels (${SCHOLARSHIPS_DATA.length})</label>
                  <label style="cursor: pointer;"><input type="radio" name="filter-level" value="Undergraduate"> 🎓 Undergraduate (${SCHOLARSHIPS_DATA.filter(s=>s.level==='Undergraduate').length})</label>
                  <label style="cursor: pointer;"><input type="radio" name="filter-level" value="Postgraduate"> 🏛️ Postgraduate / Masters (${SCHOLARSHIPS_DATA.filter(s=>s.level==='Postgraduate').length})</label>
                </div>
              </div>

              <!-- Academic Field Filter Dropdown -->
              <div style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-slate);">Academic Field (20+ Fields)</label>
                <select id="filter-field-select" class="form-select" style="font-size: 0.88rem;">
                  <option value="All">All 20+ Academic Fields</option>
                  ${allFields.map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
              </div>

              <!-- Award Value -->
              <div style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-slate);">Award Coverage</label>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
                  <label style="cursor: pointer;"><input type="radio" name="filter-amount" value="All" checked> Any Value</label>
                  <label style="cursor: pointer;"><input type="radio" name="filter-amount" value="full"> 🏆 100% Full Tuition + Stipend</label>
                  <label style="cursor: pointer;"><input type="radio" name="filter-amount" value="over35k"> £35,000+ Full Coverage</label>
                </div>
              </div>

              <!-- Nationality -->
              <div style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-slate);">Student Fee Status</label>
                <select id="filter-nationality" class="form-select" style="font-size: 0.88rem;">
                  <option value="All">All Nationalities (International & UK)</option>
                  <option value="UK/EU">UK / Home Fee</option>
                  <option value="International">International Fee</option>
                </select>
              </div>
            </aside>

            <!-- Results Listing -->
            <main>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; background: white; padding: 1rem 1.25rem; border-radius: 8px; border: 1px solid var(--color-light-grey);">
                <div id="results-count-text" style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">
                  Loading scholarships...
                </div>
                
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                  <input type="text" id="filter-search-input" placeholder="Search field, degree or keyword..." style="padding: 8px 12px; border: 1px solid var(--color-medium-grey); border-radius: 6px; font-size: 0.88rem; width: 240px;">
                  <select id="sort-dropdown" class="form-select" style="padding: 8px 12px; font-size: 0.88rem; width: auto;">
                    <option value="urgent">Urgent 6-Day Deadline</option>
                    <option value="amount">Highest Award Value</option>
                    <option value="title">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              <!-- List Container -->
              <div id="scholarships-cards-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <!-- Dynamically rendered cards -->
              </div>
            </main>
          </div>
        </div>
      </div>
    `;

    this.init(isUrgentFilterFromURL);
  },

  init(initialUrgent = false) {
    const container = document.getElementById('scholarships-cards-container');
    const countEl = document.getElementById('results-count-text');
    const searchInput = document.getElementById('filter-search-input');
    const sortDropdown = document.getElementById('sort-dropdown');
    const urgentCheckbox = document.getElementById('filter-urgent-only');
    const fieldSelect = document.getElementById('filter-field-select');
    const levelRadios = document.querySelectorAll('input[name="filter-level"]');
    const nationalitySelect = document.getElementById('filter-nationality');
    const amountRadios = document.querySelectorAll('input[name="filter-amount"]');
    const clearAllBtn = document.getElementById('btn-clear-all');
    const urgentHeroBtn = document.getElementById('btn-filter-urgent');
    const ugHeroBtn = document.getElementById('btn-filter-ug-full');

    // Quiz elements
    const quizForm = document.getElementById('quiz-form');
    const quizGpaSlider = document.getElementById('quiz-gpa-slider');
    const quizGpaDisplay = document.getElementById('quiz-gpa-display');
    const toggleCheckerBtn = document.getElementById('toggle-checker-btn');
    const checkerHeader = document.getElementById('checker-toggle-header');
    const checkerBody = document.getElementById('checker-body-content');

    if (quizGpaSlider && quizGpaDisplay) {
      quizGpaSlider.addEventListener('input', (e) => {
        quizGpaDisplay.textContent = parseFloat(e.target.value).toFixed(1);
      });
    }

    if (checkerHeader && toggleCheckerBtn && checkerBody) {
      checkerHeader.addEventListener('click', () => {
        const isClosed = checkerBody.style.display === 'none';
        checkerBody.style.display = isClosed ? 'block' : 'none';
        toggleCheckerBtn.textContent = isClosed ? '▲' : '▼';
      });
    }

    if (quizForm) {
      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selLevel = document.getElementById('quiz-level').value;
        const selField = document.getElementById('quiz-field').value;

        if (selLevel !== 'All') {
          const r = document.querySelector(`input[name="filter-level"][value="${selLevel}"]`);
          if (r) r.checked = true;
        }
        if (fieldSelect) {
          fieldSelect.value = selField;
        }

        renderList();
        window.scrollTo({ top: 500, behavior: 'smooth' });
      });
    }

    if (urgentHeroBtn) {
      urgentHeroBtn.addEventListener('click', () => {
        if (urgentCheckbox) urgentCheckbox.checked = true;
        renderList();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    }

    if (ugHeroBtn) {
      ugHeroBtn.addEventListener('click', () => {
        const r = document.querySelector('input[name="filter-level"][value="Undergraduate"]');
        if (r) r.checked = true;
        renderList();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    }

    const renderList = () => {
      const isUrgentOnly = urgentCheckbox ? urgentCheckbox.checked : false;
      const selectedField = fieldSelect ? fieldSelect.value : 'All';
      const selectedLevel = document.querySelector('input[name="filter-level"]:checked')?.value || 'All';
      const selectedNationality = nationalitySelect ? nationalitySelect.value : 'All';
      const selectedAmount = document.querySelector('input[name="filter-amount"]:checked')?.value || 'All';
      const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const sortMode = sortDropdown ? sortDropdown.value : 'urgent';

      let filtered = SCHOLARSHIPS_DATA.filter(item => {
        if (isUrgentOnly && !item.isUrgent6Days) return false;
        if (selectedField !== 'All' && item.field !== selectedField) return false;
        if (selectedLevel !== 'All' && item.level !== selectedLevel && item.level !== 'All') return false;
        if (selectedNationality !== 'All') {
          if (selectedNationality === 'UK/EU' && !['All', 'UK/EU'].includes(item.nationality)) return false;
          if (selectedNationality === 'International' && !['All', 'International'].includes(item.nationality)) return false;
        }
        if (selectedAmount === 'full' && !item.amount.toLowerCase().includes('full') && !item.amount.toLowerCase().includes('100%')) return false;
        if (selectedAmount === 'over35k' && item.amountValue < 35000) return false;

        if (searchQuery) {
          const matchTitle = item.title.toLowerCase().includes(searchQuery);
          const matchDesc = item.description.toLowerCase().includes(searchQuery);
          const matchField = item.field.toLowerCase().includes(searchQuery);
          if (!matchTitle && !matchDesc && !matchField) return false;
        }

        return true;
      });

      // Sorting
      filtered.sort((a, b) => {
        if (sortMode === 'urgent') {
          if (a.isUrgent6Days && !b.isUrgent6Days) return -1;
          if (!a.isUrgent6Days && b.isUrgent6Days) return 1;
          return a.deadline.localeCompare(b.deadline);
        }
        if (sortMode === 'amount') {
          return b.amountValue - a.amountValue;
        }
        if (sortMode === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });

      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${SCHOLARSHIPS_DATA.length} Fully Funded Scholarships`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="background: white; padding: 3rem; text-align: center; border-radius: 10px; border: 1px solid var(--color-light-grey);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">🔍</div>
            <h3 style="color: var(--color-primary); margin-bottom: 8px;">No matching scholarship schemes found</h3>
            <p style="color: var(--color-slate); font-size: 0.95rem; margin-bottom: 1.5rem;">Try resetting your filters to explore all 25+ fully funded undergraduate programs.</p>
            <button id="btn-reset-empty" class="btn btn-primary">Reset Filter Options</button>
          </div>
        `;
        document.getElementById('btn-reset-empty')?.addEventListener('click', () => {
          clearAll();
        });
        return;
      }

      container.innerHTML = filtered.map(s => {
        const isUrgent = s.isUrgent6Days;
        const formattedDeadline = '28 August 2026';

        return `
          <div class="card ${isUrgent ? 'card-urgent' : ''}" style="padding: 1.5rem; transition: transform 0.2s, box-shadow 0.2s; background: white; border-radius: 10px; border: 1px solid var(--color-light-grey);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <div style="flex: 1; min-width: 280px;">
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
                  <span class="badge badge-urgent" style="font-size: 11px; padding: 3px 8px;">
                    ⏳ 6-DAY DEADLINE (${formattedDeadline})
                  </span>
                  <span class="badge badge-blue">📁 ${s.field}</span>
                  <span class="badge badge-grey">🎓 ${s.level}</span>
                  <span class="badge badge-green">🌍 ${s.nationality}</span>
                </div>
                
                <h3 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.3rem; margin: 0 0 8px; line-height: 1.25;">
                  ${s.title}
                </h3>
              </div>

              <div style="text-align: right; min-width: 170px;">
                <div style="font-size: 1.15rem; font-weight: 800; color: #8C6D1F; margin-bottom: 4px; font-family: var(--font-mono);">
                  ${s.amount}
                </div>
                <div style="font-size: 0.75rem; color: var(--color-slate);">
                  Min GPA Requirement: <strong>${s.eligibility.minGPA} / 4.0</strong>
                </div>
              </div>
            </div>

            <p style="color: var(--color-slate); font-size: 0.93rem; line-height: 1.55; margin-bottom: 1rem;">
              ${s.description}
            </p>

            ${s.keyFeatures ? `
              <div style="background: var(--color-off-white); border-radius: 6px; padding: 10px 14px; margin-bottom: 1.25rem; display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.82rem; color: var(--color-primary);">
                ${s.keyFeatures.map(feat => `<span>✓ <strong>${feat}</strong></span>`).join('')}
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-light-grey); pt: 12px; padding-top: 12px; flex-wrap: wrap; gap: 10px;">
              <div style="font-size: 0.82rem; color: var(--color-slate);">
                🏛️ <strong>Faculty:</strong> ${s.faculty} &bull; 4-Year Full Funding Award
              </div>
              <div style="display: flex; gap: 10px;">
                <a href="#/scholarships/apply/${s.id}" class="btn ${isUrgent ? 'btn-urgent' : 'btn-primary'}" style="padding: 8px 18px; font-size: 0.88rem;">
                  Apply for this Award &rarr;
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const clearAll = () => {
      if (urgentCheckbox) urgentCheckbox.checked = false;
      if (fieldSelect) fieldSelect.value = 'All';
      const allLevelRadio = document.querySelector('input[name="filter-level"][value="All"]');
      if (allLevelRadio) allLevelRadio.checked = true;
      const allAmountRadio = document.querySelector('input[name="filter-amount"][value="All"]');
      if (allAmountRadio) allAmountRadio.checked = true;
      if (nationalitySelect) nationalitySelect.value = 'All';
      if (searchInput) searchInput.value = '';
      if (sortDropdown) sortDropdown.value = 'urgent';
      renderList();
    };

    // Attach Listeners
    [urgentCheckbox, nationalitySelect, sortDropdown, fieldSelect].forEach(el => {
      if (el) el.addEventListener('change', renderList);
    });

    if (searchInput) searchInput.addEventListener('input', renderList);
    levelRadios.forEach(r => r.addEventListener('change', renderList));
    amountRadios.forEach(r => r.addEventListener('change', renderList));
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

    // Initial run
    renderList();
  }
};
