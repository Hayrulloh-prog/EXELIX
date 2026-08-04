import { Request, Response } from 'express';
import { query } from '../config/database';

export const getUserAvatar = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'AVATAR_NOT_FOUND',
        message: 'Avatar not found'
      });
    }

    const { avatar_url } = result.rows[0];

    if (!avatar_url) {
      return res.status(404).json({
        success: false,
        error: 'AVATAR_NOT_FOUND',
        message: 'Avatar not found'
      });
    }

    // External URL (Supabase Storage / Google) — redirect
    if (avatar_url.startsWith('http')) {
      res.set({
        'Cache-Control': 'public, max-age=86400',
      });
      return res.redirect(302, avatar_url);
    }

    // Legacy base64 data URI fallback
    if (avatar_url.startsWith('data:')) {
      const matches = avatar_url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        res.set({
          'Content-Type': matches[1],
          'Cache-Control': 'public, max-age=86400',
          'ETag': `"${userId}-${buffer.length}"`,
        });
        return res.send(buffer);
      }
    }

    // Relative path fallback
    res.set({ 'Cache-Control': 'public, max-age=86400' });
    return res.redirect(302, avatar_url);
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Error fetching avatar'
    });
  }
};
