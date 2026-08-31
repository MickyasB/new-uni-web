import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { level, faculty, nationality, status, search } = req.query;
    
    let where = {};
    if (level) where.level = level;
    if (faculty) where.faculty = faculty;
    if (nationality) where.nationality = { in: ['All', nationality] };
    if (status) where.status = status;
    if (search) where.title = { contains: search };
    
    const scholarships = await prisma.scholarship.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(scholarships);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
    if (!scholarship) return res.status(404).json({ error: 'Scholarship not found' });
    res.json(scholarship);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const scholarship = await prisma.scholarship.create({
      data: {
        ...data,
        deadline: new Date(data.deadline),
        amountValue: parseFloat(data.amountValue || 0)
      }
    });
    res.status(201).json(scholarship);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = req.body;
    const scholarship = await prisma.scholarship.update({
      where: { id: req.params.id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        amountValue: data.amountValue !== undefined ? parseFloat(data.amountValue) : undefined
      }
    });
    res.json(scholarship);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.scholarship.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/check-eligibility', async (req, res, next) => {
  try {
    const { level, gpa, country } = req.body;
    const numGpa = parseFloat(gpa || 0);
    
    const scholarships = await prisma.scholarship.findMany({
      where: { status: 'OPEN' }
    });
    
    const eligibleIds = scholarships.filter(s => {
      if (s.level !== 'All' && s.level !== level) return false;
      if (s.nationality !== 'All' && s.nationality !== country) {
         // Add some flex for regions if needed, but strict check here for simplicity
         if (!s.nationality.includes(country)) return false;
      }
      
      const elig = JSON.parse(s.eligibility || '{}');
      if (elig.minGpa && numGpa < parseFloat(elig.minGpa)) return false;
      return true;
    }).map(s => s.id);
    
    res.json(eligibleIds);
  } catch (error) {
    next(error);
  }
});

export default router;
