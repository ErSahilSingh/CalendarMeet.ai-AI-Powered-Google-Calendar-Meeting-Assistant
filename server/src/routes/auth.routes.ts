import { Router, Request, Response } from 'express';
import { GoogleCalendarService } from '../services/googleCalendar.service.js';
import { UserModel, inMemoryUsers } from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_calendar_meet_2026';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Initiates the Google OAuth2 flow
 */
router.get('/google', (req: Request, res: Response) => {
  const url = GoogleCalendarService.getAuthUrl();
  if (!url) {
    return res.status(400).json({
      error: 'Google OAuth credentials not configured in server .env. Use /api/auth/dev-login for dev testing.',
    });
  }
  res.redirect(url);
});

/**
 * Handles the Google OAuth2 callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.redirect(`${CLIENT_URL}?auth_error=no_code`);
  }

  try {
    const { tokens, profile } = await GoogleCalendarService.getTokensFromCode(code);

    let user;
    try {
      user = await UserModel.findOneAndUpdate(
        { googleId: profile.googleId },
        {
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
        { upsert: true, new: true }
      );
    } catch {
      // In-memory fallback
      user = {
        _id: `usr_${profile.googleId}`,
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };
      inMemoryUsers.set(user._id, user);
    }

    const token = jwt.sign(
      {
        userId: user._id || user.googleId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: false,
      secure: false, // development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${CLIENT_URL}?auth=success&token=${token}`);
  } catch (err: any) {
    console.error('[Auth Callback] Error:', err.message);
    res.redirect(`${CLIENT_URL}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * One-click simulated Google Login for immediate developer testing
 */
router.post('/dev-login', async (req: Request, res: Response) => {
  const email = req.body.email || 'sahil.developer@gmail.com';
  const name = req.body.name || 'Sahil Sharma';
  const avatar = req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

  const mockUser = {
    _id: 'usr_mock_123',
    googleId: 'g_mock_123',
    email,
    name,
    avatar,
    accessToken: 'mock_google_access_token',
    refreshToken: 'mock_google_refresh_token',
  };

  inMemoryUsers.set(mockUser._id, mockUser);

  const token = jwt.sign(
    {
      userId: mockUser._id,
      email: mockUser.email,
      name: mockUser.name,
      avatar: mockUser.avatar,
      accessToken: mockUser.accessToken,
      refreshToken: mockUser.refreshToken,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    user: {
      id: mockUser._id,
      email: mockUser.email,
      name: mockUser.name,
      avatar: mockUser.avatar,
      connectedToGoogle: true,
    },
    token,
  });
});

/**
 * Returns current authenticated user
 */
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    res.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.avatar,
        connectedToGoogle: true,
      },
    });
  } catch {
    res.status(401).json({ authenticated: false, user: null });
  }
});

/**
 * Logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
