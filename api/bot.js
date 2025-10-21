import { Telegraf } from "telegraf";
import fetch from "node-fetch";

// --- BOT CONFIG ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN not set in environment variables!");
}

const bot = new Telegraf(BOT_TOKEN);

// --- SCENE FOLDERS ---
const SCENES = {
  scene9: "http://download.omarea.com/scene9/",
};

// --- HELPER FUNCTION TO FETCH APK LINKS ---
async function fetchBuilds(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const regex = /href="(.*?\.apk)"/g;
    const builds = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const link = match[1];
      const name = decodeURIComponent(link.split("/").pop());
      const fullUrl = link.startsWith("http") ? link : url + link;
      builds.push({ name, url: fullUrl });
    }
    return builds;
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

// --- BOT COMMANDS ---

// /start
bot.start(ctx => {
  ctx.reply(
    "👋 *Welcome to Scene Bot!*\nUse /list, /latest, or /download <keyword>.",
    { parse_mode: "Markdown" }
  );
});

// /list - shows all APKs in scene9
bot.command("list", async ctx => {
  let reply = "*Available Builds in Scene 9:*\n";

  const url = SCENES.scene9;
  const builds = await fetchBuilds(url);

  if (builds.length === 0) {
    reply += "\nNo builds found in Scene 9.";
  } else {
    builds.forEach((b, idx) => {
      reply += `\n${idx + 1}. ${b.name}`;
    });
  }

  ctx.reply(reply, { parse_mode: "Markdown" });
});

// /latest - sends the latest APK in scene9
bot.command("latest", async ctx => {
  const builds = await fetchBuilds(SCENES.scene9);

  if (builds.length === 0) {
    return ctx.reply("No builds found in Scene 9.");
  }

  const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
  const latest = sorted.at(-1);

  try {
    await ctx.replyWithDocument(
      { url: latest.url, filename: latest.name },
      { caption: `🆕 Latest Build:\n📦 ${latest.name}`, parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Failed to send latest APK:", err);
    ctx.reply(`❌ Failed to send latest build: ${latest.name}`);
  }
});

// /download <keyword> - sends APK matching keyword
bot.command("download", async ctx => {
  const text = ctx.message.text;
  const parts = text.split(" ");
  if (parts.length < 2) return ctx.reply("Usage: /download <keyword>");

  const keyword = parts[1].toLowerCase();
  const builds = await fetchBuilds(SCENES.scene9);
  const foundBuild = builds.find(b => b.name.toLowerCase().includes(keyword));

  if (foundBuild) {
    try {
      await ctx.replyWithDocument(
        { url: foundBuild.url, filename: foundBuild.name },
        { caption: `📦 ${foundBuild.name}`, parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to send APK:", err);
      ctx.reply(`❌ Failed to send ${foundBuild.name}.`);
    }
  } else {
    ctx.reply(`No build found matching: *${keyword}*`, { parse_mode: "Markdown" });
  }
});

// --- LAUNCH BOT ---
bot.launch()
  .then(() => console.log("✅ Scene Bot started!"))
  .catch(err => console.error("Bot launch error:", err));

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
