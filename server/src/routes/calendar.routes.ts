import { Router, Request, Response } from 'express';
import { MeetingModel, inMemoryMeetings } from '../models/Meeting.js';
import { QueueService } from '../services/queue.service.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_calendar_meet_2026';

function getUserFromReq(req: Request): any {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;
  if (token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  return {
    userId: 'usr_default',
    email: 'user@example.com',
    accessToken: 'mock_token',
  };
}

/**
 * Confirm a proposed meeting action and queue it for Google Calendar sync
 */
router.post('/confirm-booking', async (req: Request, res: Response) => {
  const { meetingDraft } = req.body;
  if (!meetingDraft || !meetingDraft.title || !meetingDraft.startTime || !meetingDraft.endTime) {
    return res.status(400).json({ error: 'Incomplete meeting draft details' });
  }

  const user = getUserFromReq(req);
  const meetingId = `meet_${uuidv4()}`;

  const newMeetingData = {
    _id: meetingId,
    userId: user.userId,
    title: meetingDraft.title,
    description: meetingDraft.description || '',
    startTime: new Date(meetingDraft.startTime),
    endTime: new Date(meetingDraft.endTime),
    hostEmail: meetingDraft.hostEmail || user.email,
    attendeeEmail: meetingDraft.attendeeEmail,
    attendees: [meetingDraft.hostEmail || user.email, meetingDraft.attendeeEmail],
    status: 'pending_sync' as const,
  };

  let savedMeeting;
  try {
    savedMeeting = await MeetingModel.create(newMeetingData);
  } catch {
    savedMeeting = newMeetingData;
    inMemoryMeetings.set(meetingId, savedMeeting);
  }

  // Queue BullMQ job (or direct execution)
  const jobResult = await QueueService.enqueueCalendarJob({
    action: 'CREATE_MEETING',
    meetingId,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    eventDetails: {
      title: meetingDraft.title,
      description: meetingDraft.description,
      startTime: meetingDraft.startTime,
      endTime: meetingDraft.endTime,
      hostEmail: meetingDraft.hostEmail || user.email,
      attendeeEmail: meetingDraft.attendeeEmail,
    },
  });

  // Fetch updated meeting with Google Calendar links
  let finalMeeting;
  try {
    finalMeeting = await MeetingModel.findById(meetingId);
  } catch {}

  if (!finalMeeting) {
    finalMeeting = inMemoryMeetings.get(meetingId);
  }

  res.json({
    success: true,
    meeting: finalMeeting || savedMeeting,
    googleSync: jobResult,
  });
});

/**
 * List all scheduled meetings for user
 */
router.get('/meetings', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);

  let meetings: any[] = [];
  try {
    meetings = await MeetingModel.find({
      $or: [{ userId: user.userId }, { hostEmail: user.email }],
      status: { $ne: 'cancelled' },
    }).sort({ startTime: 1 });
  } catch {
    meetings = Array.from(inMemoryMeetings.values())
      .filter((m) => (m.userId === user.userId || m.hostEmail === user.email) && m.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  res.json({ meetings });
});

/**
 * Cancel and delete meeting
 */
router.delete('/meetings/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const meetingId = req.params.id;

  let meeting: any;
  try {
    meeting = await MeetingModel.findById(meetingId);
  } catch {
    meeting = inMemoryMeetings.get(meetingId);
  }

  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  // Queue deletion job
  await QueueService.enqueueCalendarJob({
    action: 'DELETE_MEETING',
    meetingId,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    eventDetails: {
      title: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      hostEmail: meeting.hostEmail,
      attendeeEmail: meeting.attendeeEmail,
      googleEventId: meeting.googleEventId,
    },
  });

  res.json({ success: true, message: 'Meeting cancelled successfully' });
});

export default router;
