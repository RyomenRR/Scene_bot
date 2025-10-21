import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@YourPrivateChannel"; // bot must be admin here

if (!BOT_TOKEN) throw new Error("BOT_TOKEN not set!");

const bot = new Telegraf(BOT_TOKEN);

// In-memory storage of channel APKs
let apkList = [];

// --- HELPER: fetch messages from private channel ---
async function fetchApkList() {
  try {
    let offset = 0;
    let fetched = [];
    while (true) {
      const updates = await bot.telegram.getChatHistory(CHANNEL_ID, {
        limit: 100,
        offset: offset,
      });
      if (!updates || updates.length === 0) break;

      updates.forEach((msg) => {
        if (msg.document && msg.document.file_name.toLowerCase().endsWith(".apk")) {
          fetched.push({
            file_id: msg.document.file_id,
            name: msg.document.file_name,
          });
        }
      });

      offset = updates[updates.length - 1].message_id + 1;
    }

    // Sort alphabetically or by upload order
    apkList = fetched.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`📦 Fetched ${apkList.length} APKs from channel.`);
  } catch (err) {
    console.error("Error fetching channel messages:", err);
  }
}

// Fetch APKs once on startup
fetchApkList();

// --- LISTEN TO ALL MESSAGES ---
bot.on("message", async (ctx) => {
  const text = (ctx.message.text || "").toLowerCase().trim().replace(/\s+/g, "");

  if (!text) return;

  try {
    // 1️⃣ download or 下载 → latest APK
    if (text === "download" || text === "下载") {
      if (apkList.length === 0) {
        await ctx.reply("No APKs found in channel.");
        return;
      }
      const latest = apkList[apkList.length - 1];
      await ctx.telegram.sendDocument(ctx.chat.id, latest.file_id, {
        caption: `📦 Latest APK: ${latest.name}`,
      });
      return;
    }

    // 2️⃣ check if message matches any APK name
    const matched = apkList.find((apk) => apk.name.toLowerCase().replace(/\.apk$/, "").replace(/\s+/g, "").includes(text));
    if (matched) {
      await ctx.telegram.sendDocument(ctx.chat.id, matched.file_id, {
        caption: `📦 ${matched.name}`,
      });
      return;
    }
  } catch (err) {
    console.error("Error handling message:", err);
  }
});

// --- LAUNCH BOT ---
bot.launch()
  .then(() => console.log("✅ Scene Bot started!"))
  .catch((err) => console.error("Bot launch error:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
