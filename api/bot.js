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
bot.start(ctx =>
  ctx.reply(
    "👋 *Welcome to Scene Bot!*\nUse /list, /latest, or /download <keyword>.",
    { parse_mode: "Markdown" }
  )
);

// /list
bot.command("list", async ctx => {
  let reply = "*Available Builds:*\n";
  let hasBuilds = false;

  for (const [scene, url] of Object.entries(SCENES)) {
    let builds = [];
    try {
      builds = await fetchBuilds(url);
    } catch (err) {
      console.error(`Failed to fetch ${scene}:`, err);
      reply += `\n📌 *${scene.toUpperCase()}* — ❌ Failed to fetch builds.\n`;
      continue;
    }

    if (builds.length) {
      hasBuilds = true;
      reply += `\n📌 *${scene.toUpperCase()}*\n`;
      builds.forEach(b => (reply += `  ├── ${b.name}\n`));
    } else {
      reply += `\n📌 *${scene.toUpperCase()}* — No builds found.\n`;
    }
  }

  if (!hasBuilds) reply = "No builds available at the moment.";

  // Telegram message limit safeguard
  if (reply.length > 4000) reply = reply.slice(0, 3990) + "\n...and more";

  try {
    await ctx.reply(reply, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Telegram reply error:", err);
  }
});

// /latest
bot.command("latest", async ctx => {
  let latest = null;

  for (const url of Object.values(SCENES)) {
    const builds = await fetchBuilds(url);
    if (builds.length) {
      const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
      const currentLatest = sorted.at(-1);
      if (!latest || currentLatest.name > latest.name) latest = currentLatest;
    }
  }

  if (latest) {
    ctx.reply(
      `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply("No builds found.");
  }
});

// /download <keyword>
bot.command("download", async ctx => {
  const text = ctx.message.text;
  const parts = text.split(" ");
  if (parts.length < 2) return ctx.reply("Usage: /download <keyword>");

  const keyword = parts[1].toLowerCase();
  let foundBuild = null;

  outer: for (const url of Object.values(SCENES)) {
    const builds = await fetchBuilds(url);
    for (const b of builds) {
      if (b.name.toLowerCase().includes(keyword)) {
        foundBuild = b;
        break outer;
      }
    }
  }

  if (foundBuild) {
    ctx.reply(
      `📦 ${foundBuild.name}\n🔗 ${foundBuild.url}`,
      { parse_mode: "Markdown" }
    );
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
