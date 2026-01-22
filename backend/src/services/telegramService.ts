import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

let bot: TelegramBot | null = null;

if (botToken) {
  bot = new TelegramBot(botToken, { polling: false });
}

export const sendTelegramNotification = async (
  telegramUsername: string,
  message: string
): Promise<void> => {
  if (!bot) {
    console.warn('Telegram bot not configured');
    return;
  }

  try {
    // Remove @ if present
    const username = telegramUsername.replace('@', '');

    // Try to send message (requires user to have started conversation with bot)
    // In production, you might want to store chat_id instead of username
    await bot.sendMessage(username as any, message, {
      parse_mode: 'HTML',
    });
  } catch (error: any) {
    if (error.response?.errorCode === 403) {
      console.log(`User ${telegramUsername} has not started conversation with bot`);
    } else {
      console.error('Telegram notification error:', error);
    }
  }
};

export const getTelegramBot = (): TelegramBot | null => {
  return bot;
};
