import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";

// --- BOT CONFIG ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN not set in env!");
const bot = new Telegraf(BOT_TOKEN);

// --- APK DB STORAGE ---
const DB_PATH = path.join(process.cwd(), "apkDB.json");

// Load or initialize APK DB
let apkDB = {};
if (fs.existsSync(DB_PATH)) {
  try {
    apkDB = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    apkDB = {};
  }
} else {
  fs.writeFileSync(DB_PATH, JSON.stringify(apkDB, null, 2));
}

// Helper: Save DB
function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(apkDB, null, 2));
}

// --- BOT LOGIC ---

// Listen to all messages
bot.on("message", async (ctx) => {
  try {
    const text = (ctx.message.text || "").toLowerCase();

    // 1️⃣ If message is an APK upload to the bot itself
    if (ctx.message.document && ctx.chat.type === "private") {
      const doc = ctx.message.document;
      const name = doc.file_name;
      const file_id = doc.file_id;

      // Save in DB
      apkDB[name.toLowerCase()] = file_id;
      saveDB();

      return ctx.reply(`✅ APK saved: ${name}`);
    }

    // 2️⃣ Check triggers in groups
    const triggerDownload = ["download", "下载"];
    let sent = false;

    // Match download/latest
    if (triggerDownload.includes(text)) {
      // Get latest APK by filename sorting
      const apkNames = Object.keys(apkDB).sort();
      if (apkNames.length === 0) return;

      const latest = apkNames[apkNames.length - 1];
      const file_id = apkDB[latest];

      await ctx.telegram.sendDocument(ctx.chat.id, file_id, {
        caption: `📦 Latest APK: ${latest}`,
      });
      sent = true;
    } else {
      // Match any APK keyword
      for (const [name, file_id] of Object.entries(apkDB)) {
        if (text.includes(name)) {
          await ctx.telegram.sendDocument(ctx.chat.id, file_id, {
            caption: `📦 ${name}`,
          });
          sent = true;
          break;
        }
      }
    }

    // Optional: if not found
    if (!sent && text.length > 0) {
      // ctx.reply("❌ No matching APK found.");
    }

  } catch (err) {
    console.error("Error handling message:", err);
  }
});

// --- LAUNCH BOT ---
bot.launch().then(() => console.log("✅ Scene Bot started!"));

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
