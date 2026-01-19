import webpush from 'web-push'
import TelegramBot from 'node-telegram-bot-api'
import prisma from '../utils/database'

// Initialize Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@exelix.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Initialize Telegram Bot
let telegramBot: TelegramBot | null = null
if (process.env.TELEGRAM_BOT_TOKEN) {
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
}

export const sendPushNotification = async (
  user: any,
  message: string
): Promise<void> => {
  // In a real implementation, you would store user's push subscription
  // For now, this is a placeholder
  // TODO: Store and retrieve push subscriptions from database
}

export const sendTelegramNotification = async (
  telegramUsername: string,
  message: string,
  lang: string = 'ru'
): Promise<void> => {
  if (!telegramBot || !telegramUsername) {
    return
  }

  const greetings = {
    ru: 'Здравствуйте!\nВам отправлено уведомление:',
    en: 'Hello!\nYou have received a notification:',
    kg: 'Саламатсызбы!\nСизге билдирүү жөнөтүлдү:'
  }
  const greeting = greetings[lang as keyof typeof greetings] || greetings.ru

  const fullMessage = `${greeting}\n🚨 ${message}`

  try {
    // Remove @ if present
    const username = telegramUsername.replace('@', '')

    // Send via Telegram Bot API
    // Note: You might need to get chat_id first through a separate mechanism
    // For MVP, we'll use a direct message approach
    if (process.env.TELEGRAM_CHAT_ID) {
      await telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, fullMessage)
    }
  } catch (error) {
    console.error('Telegram notification error:', error)
    throw error
  }
}
