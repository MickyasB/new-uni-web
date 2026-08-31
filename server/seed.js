// server/seed.js — Comprehensive University of Edinburgh Database Seeder
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting University of Edinburgh database seed...');

  // Clean existing records
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.user.deleteMany();

  // Create Verified Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ed.ac.uk',
      fullName: 'Dr. Alistair Macleod',
      role: 'ADMIN',
      country: 'United Kingdom',
      password: 'password123'
    }
  });

  const reviewer1 = await prisma.user.create({
    data: {
      email: 'reviewer@ed.ac.uk',
      fullName: 'Prof. Fiona Campbell (School of Informatics)',
      role: 'REVIEWER',
      country: 'United Kingdom',
      password: 'password123'
    }
  });

  const reviewer2 = await prisma.user.create({
    data: {
      email: 'reviewer2@ed.ac.uk',
      fullName: 'Dr. Callum Fraser (Usher Institute)',
      role: 'REVIEWER',
      country: 'United Kingdom',
      password: 'password123'
    }
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student@ed.ac.uk',
      fullName: 'Aisha Patel',
      role: 'STUDENT',
      country: 'India',
      password: 'password123'
    }
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'marcus.johnson@gmail.com',
      fullName: 'Marcus Johnson',
      role: 'STUDENT',
      country: 'Nigeria',
      password: 'password123'
    }
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'eleanor.vance@yahoo.co.uk',
      fullName: 'Eleanor Vance',
      role: 'STUDENT',
      country: 'United Kingdom',
      password: 'password123'
    }
  });

  console.log('Verified users seeded.');

  // Exact 6-day deadline from current date
  const urgent6DayDeadline = new Date('2026-08-26T23:59:59Z');
  const standardDeadline = new Date('2026-09-30T23:59:59Z');

  const scholarshipsData = [
    // --- MANAGEMENT & BUSINESS ---
    {
      title: "Nottingham University Business School (NUBS) Dean's Global Excellence Scholarship",
      description: "Prestigious award for outstanding candidates accepted onto MSc Management, MBA, International Business, or MSc Finance programmes.",
      amount: "£10,000 Tuition Fee Award",
      amountValue: 10000,
      faculty: "Social Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.6, field: "Management" })
    },
    {
      title: "International Strategic Management & Leadership Undergraduate Award",
      description: "Designed for ambitious international undergraduates entering BSc International Management, BSc Finance, or Business Management.",
      amount: "50% Tuition Fee Waiver (3 Years)",
      amountValue: 14000,
      faculty: "Social Sciences",
      level: "Undergraduate",
      nationality: "International",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.7, field: "Management" })
    },
    {
      title: "MSc Business Analytics & Supply Chain Management Innovation Grant",
      description: "Encouraging data-driven future leaders studying MSc Business Analytics or Logistics at our Jubilee Campus.",
      amount: "£8,500 Direct Bursary",
      amountValue: 8500,
      faculty: "Social Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: standardDeadline,
      eligibility: JSON.stringify({ minGpa: 3.4, field: "Management" })
    },

    // --- COMPUTER SCIENCE & AI ---
    {
      title: "Ada Lovelace & Alan Turing Computer Science Excellence Scholarship",
      description: "Flagship scholarship for premier applicants to BSc/MSci Computer Science, AI, and Software Engineering.",
      amount: "Full Tuition Fee Waiver + £5,000 Annual Stipend",
      amountValue: 33500,
      faculty: "Science",
      level: "Undergraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.8, field: "Computer Science" })
    },
    {
      title: "MSc Artificial Intelligence & Machine Learning Global Fellowship",
      description: "Targeted at top-tier international graduates entering MSc Computer Science (Artificial Intelligence) or Data Science.",
      amount: "£12,000 Merit Fellowship",
      amountValue: 12000,
      faculty: "Science",
      level: "Postgraduate",
      nationality: "International",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.7, field: "Computer Science" })
    },
    {
      title: "Cyber Security & Software Engineering Undergraduate Bursary",
      description: "Supporting talented UK/EU students in BSc Computer Science with Cyber Security and Distributed Systems modules.",
      amount: "£6,000 Study Support Grant",
      amountValue: 6000,
      faculty: "Science",
      level: "Undergraduate",
      nationality: "UK/EU",
      deadline: standardDeadline,
      eligibility: JSON.stringify({ minGpa: 3.4, field: "Computer Science" })
    },

    // --- HEALTH INFORMATICS & DIGITAL HEALTH ---
    {
      title: "Digital Health & Health Informatics Global Leaders Scholarship",
      description: "Premier award for applicants to MSc Health Informatics, MSc Applied Health Data Science, or Clinical AI degrees.",
      amount: "Full Tuition Fee Waiver (£28,000)",
      amountValue: 28000,
      faculty: "Medicine & Health Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.7, field: "Health Informatics" })
    },
    {
      title: "NHS & Global Precision Medicine Health Data Science Fellowship",
      description: "Supports multidisciplinary researchers and practitioners translating electronic health records, genomic data, and epidemiological models into clinical decision tools.",
      amount: "£12,000 Stipend + £5,000 Travel Grant",
      amountValue: 17000,
      faculty: "Medicine & Health Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.5, field: "Health Informatics" })
    },

    // --- LAB & HEALTH RELATED SCIENCES ---
    {
      title: "Biomedical Sciences & Clinical Laboratory Research Scholarship",
      description: "For MSc Clinical Microbiology, MSc Immunology & Immunotherapy, or MSc Cancer Immunology students working directly in research wet labs.",
      amount: "Full Tuition + £8,000 Laboratory Materials Fund",
      amountValue: 36000,
      faculty: "Medicine & Health Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.8, field: "Lab & Health" })
    },
    {
      title: "Pharmacy & Pharmaceutical Sciences World Scholars Award",
      description: "Offered by the world top-10 School of Pharmacy for outstanding students enrolled in the 4-year MPharm Pharmacy.",
      amount: "50% Tuition Waiver (4-Year MPharm)",
      amountValue: 14500,
      faculty: "Science",
      level: "Undergraduate",
      nationality: "International",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.6, field: "Lab & Health" })
    },
    {
      title: "Molecular Oncology & Cancer Sciences Laboratory Studentship",
      description: "Dedicated to advancing cancer therapeutics and molecular diagnostics at the Nottingham Biodiscovery Institute.",
      amount: "£10,000 Living Allowance + Bench Fee",
      amountValue: 10000,
      faculty: "Medicine & Health Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: standardDeadline,
      eligibility: JSON.stringify({ minGpa: 3.5, field: "Lab & Health" })
    },
    {
      title: "Advanced Clinical Healthcare & Nursing Practice Leadership Award",
      description: "Empowers healthcare practitioners undertaking MSc Advanced Clinical Practice or Public Health.",
      amount: "£6,500 Tuition Reduction",
      amountValue: 6500,
      faculty: "Medicine & Health Sciences",
      level: "Postgraduate",
      nationality: "All",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.3, field: "Lab & Health" })
    },
    {
      title: "Vice-Chancellor's International Excellence Award (UG & Masters)",
      description: "University-wide flagship award honoring extraordinary global students displaying stellar academic merit and extracurricular leadership.",
      amount: "Full Tuition Fee Waiver (£28,600)",
      amountValue: 28600,
      faculty: "All",
      level: "Postgraduate",
      nationality: "International",
      deadline: urgent6DayDeadline,
      eligibility: JSON.stringify({ minGpa: 3.8, field: "General" })
    }
  ];

  const createdScholarships = [];
  for (const s of scholarshipsData) {
    createdScholarships.push(await prisma.scholarship.create({ data: s }));
  }

  console.log(`Created ${createdScholarships.length} scholarships.`);

  // Sample Applications
  await prisma.application.create({
    data: {
      userId: student1.id,
      scholarshipId: createdScholarships[0].id, // NUBS Management
      status: 'SUBMITTED',
      personalDetails: JSON.stringify({ fullName: 'Aisha Patel', email: 'student@nottingham.ac.uk', phone: '+91 9876543210', country: 'India' }),
      academicInfo: JSON.stringify({ degree: 'MSc Management', institution: 'University of Delhi', gpa: '3.85' }),
      statement: 'My ambition is to lead sustainable fintech initiatives in developing economies through Nottingham Business School.',
      financialInfo: JSON.stringify({ incomeRange: '£25,000 - £45,000' })
    }
  });

  await prisma.application.create({
    data: {
      userId: student2.id,
      scholarshipId: createdScholarships[6].id, // Digital Health & Health Informatics
      status: 'UNDER_REVIEW',
      personalDetails: JSON.stringify({ fullName: 'Marcus Johnson', email: 'marcus.johnson@gmail.com', phone: '+234 8012345678', country: 'Nigeria' }),
      academicInfo: JSON.stringify({ degree: 'MSc Health Informatics', institution: 'University of Ibadan', gpa: '3.90' }),
      statement: 'I aim to deploy predictive clinical analytics and electronic health record integration across sub-Saharan hospital networks.',
      financialInfo: JSON.stringify({ incomeRange: 'Under £25,000' })
    }
  });

  await prisma.application.create({
    data: {
      userId: student3.id,
      scholarshipId: createdScholarships[8].id, // Biomedical & Clinical Lab
      status: 'AWARDED',
      score: 9.4,
      personalDetails: JSON.stringify({ fullName: 'Eleanor Vance', email: 'eleanor.vance@yahoo.co.uk', phone: '+44 7700 900888', country: 'United Kingdom' }),
      academicInfo: JSON.stringify({ degree: 'MSc Immunology & Immunotherapy', institution: 'University of Bristol', gpa: '3.95' }),
      statement: 'Conducting translational wet-lab oncology assays targeting resistant tumor microenvironments at Queen Medical Centre.',
      financialInfo: JSON.stringify({ incomeRange: '£25,000 - £45,000' })
    }
  });

  // Seed Review
  const awardedApp = await prisma.application.findFirst({ where: { status: 'AWARDED' } });
  if (awardedApp) {
    await prisma.review.create({
      data: {
        applicationId: awardedApp.id,
        reviewerId: reviewer1.id,
        academicScore: 9.5,
        statementScore: 9.2,
        financialScore: 9.0,
        totalScore: 9.4,
        comments: "Outstanding laboratory background and clear research vision in immunology."
      }
    });
  }

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: 'info',
      title: 'Application Received',
      message: 'Your application for the NUBS Dean\'s Global Excellence Scholarship has been successfully logged.',
      read: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: student2.id,
      type: 'warning',
      title: '6-Day Deadline Reminder',
      message: 'Your MSc Health Informatics scholarship review is scheduled. Please ensure all transcript records are verified.',
      read: false
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
