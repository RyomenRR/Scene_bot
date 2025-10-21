import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN not set");

const CHANNEL_ID = "@kachrapetihai";
const FETCH_LIMIT = 100;

const bot = new Telegraf(BOT_TOKEN);

// Helper: get APKs from channel
async function getChannelApks(ctx) {
  try {
    const messages = await ctx.telegram.getChatHistory(CHANNEL_ID, { limit: FETCH_LIMIT });
    return messages
      .filter(msg => msg.document && msg.document.file_name.endsWith(".apk"))
      .map(msg => ({ file_name: msg.document.file_name, message_id: msg.message_id }));
  } catch (err) {
    console.error("Error fetching channel messages:", err);
    return [];
  }
}

// Listen for any text
bot.on("text", async ctx => {
  const text = ctx.message.text.toLowerCase().trim();
  const apks = await getChannelApks(ctx);

  if (!apks.length) return ctx.reply("No APKs found in channel.");

  // If user types '下载' or 'download', send latest
  if (text === "下载" || text === "download") {
    const latest = apks[apks.length - 1]; // last uploaded APK
    await ctx.telegram.copyMessage(ctx.chat.id, CHANNEL_ID, latest.message_id);
    return;
  }

  // Otherwise, try to match by name (alpha3, beta2, etc)
  const found = apks.find(a => a.file_name.toLowerCase().includes(text));
  if (found) {
    await ctx.telegram.copyMessage(ctx.chat.id, CHANNEL_ID, found.message_id);
  } else {
    ctx.reply("No APK found matching: *" + text + "*", { parse_mode: "Markdown" });
  }
});

// Start the bot
bot.launch().then(() => console.log("✅ Scene Bot started!"));

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
