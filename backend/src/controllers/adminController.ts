import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { generateQRCodes } from '../services/qrService';
import { getInactiveQRCodesCount } from '../services/qrService';
import QRCode from 'qrcode';
import { createError } from '../utils/errors';

export const getStats = async (req: AuthRequest, res: Response) => {
  // Total users
  const usersResult = await query(`SELECT COUNT(*) as count FROM users`);
  const totalUsers = parseInt(usersResult.rows[0].count);

  // Total requests
  const requestsResult = await query(`SELECT COUNT(*) as count FROM notifications`);
  const totalRequests = parseInt(requestsResult.rows[0].count);

  // Successful requests (assuming all stored are successful)
  const successfulRequests = totalRequests;

  // Failed requests (we don't track these separately, but could add a status field)
  const failedRequests = 0;

  // Inactive QR codes
  const inactiveQRCodes = await getInactiveQRCodesCount();

  res.json({
    totalUsers,
    totalRequests,
    successfulRequests,
    failedRequests,
    inactiveQRCodes,
  });
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 40;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT
      id, first_name, last_name, phone, phone_country,
      telegram, avatar_url, status, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await query(`SELECT COUNT(*) as count FROM users`);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    users: result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      phoneCountry: row.phone_country,
      telegram: row.telegram,
      avatarUrl: row.avatar_url,
      status: row.status,
      createdAt: row.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const generateQR = async (req: AuthRequest, res: Response) => {
  const { count } = req.body;

  const tokens = await generateQRCodes(count);

  // Generate QR codes as SVG
  const qrCodes = await Promise.all(
    tokens.map(async (token) => {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/qr?token=${token}`;
      const svg = await QRCode.toString(url, {
        type: 'svg',
        width: 300,
        margin: 2,
      });
      return { token, svg };
    })
  );

  // Create combined SVG
  const svgContent = qrCodes
    .map((qr, index) => {
      const x = (index % 10) * 320;
      const y = Math.floor(index / 10) * 320;
      return `<g transform="translate(${x}, ${y})">${qr.svg}</g>`;
    })
    .join('\n');

  const combinedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.min(10, numCount) * 320}" height="${Math.ceil(numCount / 10) * 320}">
${svgContent}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', `attachment; filename="qr-codes-${Date.now()}.svg"`);
  res.send(combinedSVG);
};
