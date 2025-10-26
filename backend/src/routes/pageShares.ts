import { Router } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, authenticate } from '../middleware/auth';
import { checkPageAccess } from '../middleware/permissions';
import PageShare from '../models/PageShare';
import Page from '../models/Page';
import User from '../models/User';
import Notebook from '../models/Notebook';
import { emailService } from '../services/emailService';

const router = Router();

// Share a page via email
router.post(
  '/:pageId/share',
  authenticate,
  checkPageAccess('edit'),
  async (req: AuthRequest, res) => {
    try {
      const { email, permission = 'view' } = req.body;
      const pageId = req.params.pageId;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Email address is required',
        });
      }

      // Validate permission
      if (!['view', 'edit'].includes(permission)) {
        return res.status(400).json({
          success: false,
          error: 'Permission must be either "view" or "edit"',
        });
      }

      // Get the page
      const page = await Page.findById(pageId);
      if (!page) {
        return res.status(404).json({
          success: false,
          error: 'Page not found',
        });
      }

      // Check if user is the owner of the page
      if (page.userId.toString() !== req.user!._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Only the page owner can share pages',
        });
      }

      // Check if already shared with this email
      const existingShare = await PageShare.findOne({
        pageId,
        sharedWith: email.toLowerCase().trim(),
        status: { $in: ['pending', 'accepted'] },
      });

      if (existingShare) {
        // Update existing share
        existingShare.permission = permission;
        existingShare.status = 'pending';
        existingShare.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await existingShare.save();
      } else {
        // Create new share
        const pageShare = new PageShare({
          pageId,
          sharedBy: req.user!._id,
          sharedWith: email.toLowerCase().trim(),
          permission,
        });
        await pageShare.save();
      }

      // Send invitation email
      try {
        await emailService.sendPageShareInvitation(
          email.toLowerCase().trim(),
          page,
          req.user!,
          existingShare?.invitationToken || (await PageShare.findOne({ pageId, sharedWith: email.toLowerCase().trim() }))?.invitationToken || ''
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'Page shared successfully',
        data: {
          email: email.toLowerCase().trim(),
          permission,
          status: 'pending',
        },
      });
    } catch (error) {
      console.error('Error sharing page:', error);
      res.status(500).json({
        success: false,
        error: 'Error sharing page',
      });
    }
  }
);

// Get shared pages for current user (pages shared with them)
router.get('/shared', authenticate, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user!.email;
    
    const sharedPages = await PageShare.find({
      sharedWith: userEmail,
      status: 'accepted',
    })
      .populate('pageId')
      .populate('sharedBy', 'displayName email')
      .sort({ acceptedAt: -1 });

    res.json({
      success: true,
      data: sharedPages.map(share => ({
        id: share._id,
        page: share.pageId,
        sharedBy: share.sharedBy,
        permission: share.permission,
        acceptedAt: share.acceptedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching shared pages:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching shared pages',
    });
  }
});

// Get pending invitations for current user
router.get('/invitations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user!.email;
    
    const invitations = await PageShare.findPendingInvitations(userEmail);

    res.json({
      success: true,
      data: invitations.map(invitation => ({
        id: invitation._id,
        page: invitation.pageId,
        sharedBy: invitation.sharedBy,
        permission: invitation.permission,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching invitations',
    });
  }
});

// Accept a page share invitation
router.post('/:shareId/accept', authenticate, async (req: AuthRequest, res) => {
  try {
    const shareId = req.params.shareId;
    const userId = req.user!._id;

    const pageShare = await PageShare.findById(shareId);
    if (!pageShare) {
      return res.status(404).json({
        success: false,
        error: 'Share invitation not found',
      });
    }

    // Verify the invitation is for the current user
    if (pageShare.sharedWith !== req.user!.email) {
      return res.status(403).json({
        success: false,
        error: 'This invitation is not for you',
      });
    }

    // Check if invitation is expired
    if (pageShare.isExpired()) {
      pageShare.status = 'expired';
      await pageShare.save();
      return res.status(400).json({
        success: false,
        error: 'This invitation has expired',
      });
    }

    // Accept the invitation
    await pageShare.accept(userId);

    // Get the page and notebook info
    const page = await Page.findById(pageShare.pageId).populate('notebookId');
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Shared page not found',
      });
    }

    // Ensure user has a "Shared" notebook
    let sharedNotebook = await Notebook.findOne({
      userId,
      title: 'Shared',
      isDeleted: false,
    });

    if (!sharedNotebook) {
      // Create "Shared" notebook
      sharedNotebook = await Notebook.create({
        userId,
        title: 'Shared',
        description: 'Pages shared with you by other users',
        color: '#8B5CF6',
        icon: '📤',
        order: -1, // Put it at the top
      });
    }

    // Create a copy of the page in the user's "Shared" notebook
    const sharedPage = await Page.create({
      notebookId: sharedNotebook._id,
      userId,
      title: `${page.title} (Shared by ${pageShare.sharedBy})`,
      content: page.content,
      drawings: page.drawings,
      graphs: page.graphs,
      textBoxes: page.textBoxes,
      tags: [...(page.tags || []), 'shared'],
      order: 0,
      lastModifiedBy: userId,
    });

    // Send notification to the original sharer
    try {
      const sharer = await User.findById(pageShare.sharedBy);
      if (sharer) {
        await emailService.sendShareAcceptedNotification(
          sharer.email,
          page.title,
          req.user!.displayName
        );
      }
    } catch (emailError) {
      console.error('Failed to send acceptance notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Page share accepted successfully',
      data: {
        page: sharedPage,
        notebook: sharedNotebook,
      },
    });
  } catch (error) {
    console.error('Error accepting page share:', error);
    res.status(500).json({
      success: false,
      error: 'Error accepting page share',
    });
  }
});

// Decline a page share invitation
router.post('/:shareId/decline', authenticate, async (req: AuthRequest, res) => {
  try {
    const shareId = req.params.shareId;

    const pageShare = await PageShare.findById(shareId);
    if (!pageShare) {
      return res.status(404).json({
        success: false,
        error: 'Share invitation not found',
      });
    }

    // Verify the invitation is for the current user
    if (pageShare.sharedWith !== req.user!.email) {
      return res.status(403).json({
        success: false,
        error: 'This invitation is not for you',
      });
    }

    // Decline the invitation
    await pageShare.decline();

    res.json({
      success: true,
      message: 'Page share declined',
    });
  } catch (error) {
    console.error('Error declining page share:', error);
    res.status(500).json({
      success: false,
      error: 'Error declining page share',
    });
  }
});

// Get share status for a page (for the page owner)
router.get('/:pageId/share-status', authenticate, async (req: AuthRequest, res) => {
  try {
    const pageId = req.params.pageId;

    // Verify user owns the page
    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found',
      });
    }

    if (page.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the page owner can view share status',
      });
    }

    const shares = await PageShare.find({ pageId })
      .populate('sharedBy', 'displayName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: shares.map(share => ({
        id: share._id,
        sharedWith: share.sharedWith,
        permission: share.permission,
        status: share.status,
        sharedBy: share.sharedBy,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        acceptedAt: share.acceptedAt,
        declinedAt: share.declinedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching share status:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching share status',
    });
  }
});

// Revoke a page share
router.delete('/:shareId', authenticate, async (req: AuthRequest, res) => {
  try {
    const shareId = req.params.shareId;

    const pageShare = await PageShare.findById(shareId).populate('pageId');
    if (!pageShare) {
      return res.status(404).json({
        success: false,
        error: 'Share not found',
      });
    }

    // Verify user owns the page
    const page = pageShare.pageId as any;
    if (page.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the page owner can revoke shares',
      });
    }

    await PageShare.findByIdAndDelete(shareId);

    res.json({
      success: true,
      message: 'Page share revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking page share:', error);
    res.status(500).json({
      success: false,
      error: 'Error revoking page share',
    });
  }
});

// Handle invitation token (for email links)
router.get('/invitation/:token', async (req: AuthRequest, res) => {
  try {
    const token = req.params.token;

    const pageShare = await PageShare.findOne({ invitationToken: token })
      .populate('pageId', 'title notebookId')
      .populate('sharedBy', 'displayName email');

    if (!pageShare) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invitation link',
      });
    }

    if (pageShare.isExpired()) {
      pageShare.status = 'expired';
      await pageShare.save();
      return res.status(400).json({
        success: false,
        error: 'This invitation has expired',
      });
    }

    if (pageShare.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'This invitation has already been processed',
      });
    }

    res.json({
      success: true,
      data: {
        id: pageShare._id,
        page: pageShare.pageId,
        sharedBy: pageShare.sharedBy,
        permission: pageShare.permission,
        expiresAt: pageShare.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching invitation',
    });
  }
});

export default router;

