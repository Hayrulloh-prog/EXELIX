import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../utils/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const generateToken = (userId: string, role?: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken } = req.params
    const { firstName, lastName, phone, telegram, profileType } = req.body

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return next(new AppError(400, 'First name, last name, and phone are required'))
    }

    // Check if QR exists and is inactive
    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken }
    })

    if (!qrCode) {
      return next(new AppError(404, 'QR code not found'))
    }

    if (qrCode.status === 'active') {
      return next(new AppError(400, 'QR code already registered'))
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return next(new AppError(400, 'Phone number already registered'))
    }

    // Handle photo upload
    let photoPath: string | undefined
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        telegram: telegram || null,
        photo: photoPath,
        profileType: profileType || 'closed',
        qrToken
      }
    })

    // Update QR status
    await prisma.qRCode.update({
      where: { qrToken },
      data: {
        status: 'active',
        userId: user.id
      }
    })

    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegram: user.telegram,
        photo: user.photo,
        profileType: user.profileType,
        activeNow: user.activeNow
      },
      token
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return next(new AppError(400, 'Phone is required'))
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      return next(new AppError(404, 'User not found'))
    }

    const token = generateToken(user.id)

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegram: user.telegram,
        photo: user.photo,
        profileType: user.profileType,
        activeNow: user.activeNow
      },
      token
    })
  } catch (error) {
    next(error)
  }
}

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return next(new AppError(401, 'Unauthorized'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return next(new AppError(404, 'User not found'))
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegram: user.telegram,
        photo: user.photo,
        profileType: user.profileType,
        activeNow: user.activeNow
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return next(new AppError(401, 'Unauthorized'))
    }

    const { firstName, lastName, phone, telegram } = req.body

    // Handle photo upload
    let photoPath: string | undefined
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`
    }

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (phone) updateData.phone = phone
    if (telegram !== undefined) updateData.telegram = telegram || null
    if (photoPath) updateData.photo = photoPath

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegram: user.telegram,
        photo: user.photo,
        profileType: user.profileType,
        activeNow: user.activeNow
      }
    })
  } catch (error) {
    next(error)
  }
}

export const setActiveNow = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    const { active } = req.body

    if (!userId) {
      return next(new AppError(401, 'Unauthorized'))
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { activeNow: active ?? true }
    })

    res.json({
      success: true,
      activeNow: user.activeNow,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegram: user.telegram,
        photo: user.photo,
        profileType: user.profileType,
        activeNow: user.activeNow
      }
    })
  } catch (error) {
    next(error)
  }
}
