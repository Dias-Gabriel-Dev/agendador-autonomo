import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Telegraf } from "telegraf";
import { validateEnviroment } from "./config/validateEnv.js";
import { handleUserMessage } from "./handlers/conversationHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const env = validateEnviroment();

// Inicialização do bot (Ponto de Entrada da Aplicação Telegram)
const bot = new Telegraf(env.TELEGRAM_TOKEN);

// Repassa todas as mensagens de texto para o Handler de Conversas
bot.on("text", async (ctx) => {
  try {
    await handleUserMessage(ctx);
  } catch (error) {
    console.error("Erro ao processar a mensagem do usuário:", error);
    await ctx.reply(
      "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.",
    );
  }
});

bot.launch()
  .then(() => console.log("Bot rodando!"))
  .catch((erro) => {
  console.error("Erro ao iniciar o bot:", erro.message);
  process.exit(1);
});



process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
