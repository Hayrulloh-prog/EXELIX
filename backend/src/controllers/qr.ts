import { Request, Response, NextFunction } from 'express'
import prisma from '../utils/database'
import { AppError } from '../middleware/errorHandler'

export const getQRInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken } = req.params

    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            telegram: true,
            photo: true,
            profileType: true
          }
        }
      }
    })

    if (!qrCode) {
      return next(new AppError(404, 'QR code not found'))
    }

    const owner = qrCode.status === 'active' && qrCode.user ? qrCode.user : null

    res.json({
      success: true,
      qrToken: qrCode.qrToken,
      status: qrCode.status,
      owner
    })
  } catch (error) {
    next(error)
  }
}
