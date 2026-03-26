import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { handleUserMessage } from './src/handlers/conversationHandler.js';

// Inicialização do bot (Ponto de Entrada da Aplicação Telegram)
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Repassa todas as mensagens de texto para o Handler de Conversas
bot.on("text", handleUserMessage);

// Tratativas de inicialização e encerramento limpo do node (Graceful shutdown)
bot.launch(() => console.log("Bot rodando! Vá para o Telegram e mande um /start"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
