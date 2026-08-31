import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({ dest: 'uploads/' });

router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};
    
    const applications = await prisma.application.findMany({
      where,
      include: {
        scholarship: true,
        user: { select: { fullName: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        scholarship: true,
        user: { select: { fullName: true, email: true, country: true } },
        reviews: {
          include: { reviewer: { select: { fullName: true } } }
        }
      }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { userId, scholarshipId } = req.body;
    const application = await prisma.application.create({
      data: { userId, scholarshipId }
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { personalDetails, academicInfo, statement, financialInfo, adminNotes } = req.body;
    const data = {};
    if (personalDetails !== undefined) data.personalDetails = typeof personalDetails === 'string' ? personalDetails : JSON.stringify(personalDetails);
    if (academicInfo !== undefined) data.academicInfo = typeof academicInfo === 'string' ? academicInfo : JSON.stringify(academicInfo);
    if (statement !== undefined) data.statement = statement;
    if (financialInfo !== undefined) data.financialInfo = typeof financialInfo === 'string' ? financialInfo : JSON.stringify(financialInfo);
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/submit', async (req, res, next) => {
  try {
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: 'SUBMITTED' },
      include: { scholarship: true }
    });
    
    const notif = await prisma.notification.create({
      data: {
        userId: application.userId,
        type: 'STATUS_UPDATE',
        title: 'Application Submitted',
        message: `Your application for ${application.scholarship.title} has been submitted successfully.`
      }
    });
    
    if (req.sendToUser) {
      req.sendToUser(application.userId, { type: 'NOTIFICATION', data: notif });
    }
    
    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/documents', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    const docs = JSON.parse(app.documents || '[]');
    
    const newDoc = {
      name: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    };
    
    docs.push(newDoc);
    
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { documents: JSON.stringify(docs) }
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/documents/:docName', async (req, res, next) => {
  try {
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    let docs = JSON.parse(app.documents || '[]');
    docs = docs.filter(d => d.name !== req.params.docName);
    
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { documents: JSON.stringify(docs) }
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status },
      include: { scholarship: true }
    });
    
    const notif = await prisma.notification.create({
      data: {
        userId: application.userId,
        type: 'STATUS_UPDATE',
        title: 'Application Status Updated',
        message: `Your application for ${application.scholarship.title} is now ${status}.`
      }
    });
    
    if (req.sendToUser) {
      req.sendToUser(application.userId, { type: 'NOTIFICATION', data: notif });
    }
    
    res.json(application);
  } catch (error) {
    next(error);
  }
});

export default router;
