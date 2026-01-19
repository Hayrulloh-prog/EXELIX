import { Request, Response, NextFunction } from 'express'
import prisma from '../utils/database'
import { AppError } from '../middleware/errorHandler'
import QRCode from 'qrcode'
import archiver from 'archiver'
import { PassThrough } from 'stream'

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Calculate statistics
    const [
      totalUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      inactiveQR
    ] = await Promise.all([
      prisma.user.count(),
      prisma.notificationLog.count(),
      prisma.notificationLog.count({ where: { success: true } }),
      prisma.notificationLog.count({ where: { success: false } }),
      prisma.qRCode.count({ where: { status: 'inactive' } })
    ])

    res.json({
      success: true,
      totalUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      inactiveQR
    })
  } catch (error) {
    next(error)
  }
}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 40
    const skip = (page - 1) * limit

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        telegram: true,
        photo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      users
    })
  } catch (error) {
    next(error)
  }
}

export const generateQR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = 100

    // Generate QR tokens
    const qrTokens: string[] = []
    for (let i = 0; i < count; i++) {
      const token = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      qrTokens.push(token)
    }

    // Create QR codes in database
    await prisma.qRCode.createMany({
      data: qrTokens.map((qrToken) => ({
        qrToken,
        status: 'inactive'
      }))
    })

    // Generate QR code SVGs
    const archive = archiver('zip', { zlib: { level: 9 } })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename=exelix-qr-codes.zip')

    archive.pipe(res)

    for (const qrToken of qrTokens) {
      const url = `${process.env.FRONTEND_URL || 'https://exelix.app'}/q/${qrToken}`

      try {
        const qrSvg = await QRCode.toString(url, {
          type: 'svg',
          width: 500,
          margin: 2
        })

        archive.append(qrSvg, { name: `${qrToken}.svg` })
      } catch (error) {
        console.error(`Failed to generate QR for ${qrToken}:`, error)
      }
    }

    await archive.finalize()
  } catch (error) {
    next(error)
  }
}
