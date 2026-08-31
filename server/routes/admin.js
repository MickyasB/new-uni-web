import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res, next) => {
  try {
    const totalApps = await prisma.application.count();
    
    const awardedApps = await prisma.application.findMany({
      where: { status: 'AWARDED' },
      include: { scholarship: true }
    });
    const totalFunds = awardedApps.reduce((sum, app) => sum + (app.scholarship.amountValue || 0), 0);
    
    const pendingReviews = await prisma.application.count({
      where: { status: 'UNDER_REVIEW' }
    });
    
    const statusGroups = await prisma.application.groupBy({
      by: ['status'],
      _count: true
    });
    
    const appsByStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});
    
    res.json({
      totalApplications: totalApps,
      totalFunds,
      pendingReviews,
      applicationsByStatus: appsByStatus
    });
  } catch (error) {
    next(error);
  }
});

router.get('/kanban', async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      include: {
        user: { select: { fullName: true } },
        scholarship: { select: { title: true } }
      }
    });
    
    const columns = {
      SUBMITTED: [],
      UNDER_REVIEW: [],
      INTERVIEW: [],
      AWARDED: [],
      REJECTED: []
    };
    
    apps.forEach(app => {
      if (columns[app.status]) {
        columns[app.status].push(app);
      } else if (app.status !== 'DRAFT') {
        columns['SUBMITTED'].push(app);
      }
    });
    
    res.json(columns);
  } catch (error) {
    next(error);
  }
});

router.put('/kanban/:id/move', async (req, res, next) => {
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
        message: `Your application for ${application.scholarship.title} was moved to ${status}.`
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

router.post('/review', async (req, res, next) => {
  try {
    const { applicationId, reviewerId, academicScore, statementScore, financialScore, comments } = req.body;
    
    const totalScore = (academicScore * 0.4) + (statementScore * 0.4) + (financialScore * 0.2);
    
    const review = await prisma.review.create({
      data: {
        applicationId,
        reviewerId,
        academicScore,
        statementScore,
        financialScore,
        totalScore,
        comments
      }
    });
    
    // Update application aggregate score
    const allReviews = await prisma.review.findMany({ where: { applicationId } });
    const avgScore = allReviews.reduce((acc, r) => acc + r.totalScore, 0) / allReviews.length;
    
    await prisma.application.update({
      where: { id: applicationId },
      data: { score: avgScore }
    });
    
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.get('/reviews/:applicationId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { applicationId: req.params.applicationId },
      include: {
        reviewer: { select: { fullName: true } }
      }
    });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.get('/notifications/:userId', async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifs);
  } catch (error) {
    next(error);
  }
});

router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json(notif);
  } catch (error) {
    next(error);
  }
});

export default router;
