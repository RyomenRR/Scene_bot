export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing
  },
};

import fetch from "node-fetch";

// Load the bot token from Vercel environment
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Scene folders
const SCENES = {
  scene5: "http://download.omarea.com/scene5/",
  scene6: "http://download.omarea.com/scene6/",
  scene7: "http://download.omarea.com/scene7/",
  scene8: "http://download.omarea.com/scene8/",
  scene9: "http://download.omarea.com/scene9/",
};

// Helper: read body safely
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// Fetch APK list
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

// Main Vercel API route
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Scene Bot is live!");
  }

  const update = await readBody(req);
  if (!update.message || !update.message.text) {
    return res.status(200).send("No valid message");
  }

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = "❌ Command not recognized.";

  if (text === "/start") {
    reply = "👋 *Welcome to Scene Bot!*\nUse /list, /latest, or /download <keyword>.";
  } else if (text === "/list") {
    reply = "*Available Builds:*\n";
    for (const [scene, url] of Object.entries(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        reply += `\n📌 *${scene.toUpperCase()}*\n`;
        builds.forEach((b) => (reply += `  ├── ${b.name}\n`));
      }
    }
  } else if (text.startsWith("/download")) {
    const parts = text.split(" ");
    if (parts.length < 2) reply = "Usage: /download <keyword>";
    else {
      const keyword = parts[1];
      outer: for (const url of Object.values(SCENES)) {
        const builds = await fetchBuilds(url);
        for (const b of builds) {
          if (b.name.toLowerCase().includes(keyword)) {
            reply = `📦 ${b.name}\n🔗 ${b.url}`;
            break outer;
          }
        }
      }
    }
  } else if (text === "/latest") {
    let latest = null;
    for (const url of Object.values(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
        if (!latest || sorted.at(-1).name > latest.name)
          latest = sorted.at(-1);
      }
    }
    reply = latest
      ? `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`
      : "No builds found.";
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply,
      parse_mode: "Markdown",
    }),
  });

  res.status(200).send("OK");
}// Vercel function handler
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("Scene Bot is live ✅");

  const update = req.body;
  if (!update.message || !update.message.text)
    return res.status(200).send("No message");

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = "❌ Command not recognized.";

  if (text === "/list") {
    reply = "*Available Builds:*\n";
    for (const [scene, url] of Object.entries(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        reply += `\n📌 *${scene.toUpperCase()}*\n`;
        builds.forEach((b) => (reply += `  ├── ${b.name}\n`));
      }
    }
  } else if (text.startsWith("/download")) {
    const parts = text.split(" ");
    if (parts.length < 2) reply = "Usage: /download <keyword>";
    else {
      const keyword = parts[1];
      outer: for (const url of Object.values(SCENES)) {
        const builds = await fetchBuilds(url);
        for (const b of builds) {
          if (b.name.toLowerCase().includes(keyword)) {
            reply = `📦 ${b.name}\n🔗 ${b.url}`;
            break outer;
          }
        }
      }
    }
  } else if (text === "/latest") {
    let latest = null;
    for (const url of Object.values(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
        if (!latest || sorted.at(-1).name > latest.name)
          latest = sorted.at(-1);
      }
    }
    if (latest)
      reply = `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`;
    else reply = "No builds found.";
  }

  // Send reply to Telegram
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply,
      parse_mode: "Markdown",
    }),
  });

  res.status(200).send("OK");
}
