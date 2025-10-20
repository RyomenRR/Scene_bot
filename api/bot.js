import { Telegraf } from "telegraf";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN; // set in Vercel env
const bot = new Telegraf(BOT_TOKEN);

// Scene folders
const SCENES = {
  scene5: "http://download.omarea.com/scene5/",
  scene6: "http://download.omarea.com/scene6/",
  scene7: "http://download.omarea.com/scene7/",
  scene8: "http://download.omarea.com/scene8/",
  scene9: "http://download.omarea.com/scene9/"
};

// Fetch APK links
async function fetchBuilds(url) {
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
}

// Vercel function handler
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const update = req.body;
  if (!update.message || !update.message.text) return res.status(200).send("OK");

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = "❌ Command not recognized.";

  if (text === "/list") {
    reply = "**Available Builds:**\n";
    for (const [scene, url] of Object.entries(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        reply += `\n📌 *${scene.toUpperCase()}*\n`;
        builds.forEach(b => (reply += `  ├── ${b.name}\n`));
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
        if (!latest || sorted[sorted.length - 1].name > latest.name) latest = sorted[sorted.length - 1];
      }
    }
    if (latest) reply = `🆕 Latest Build:\n📦 ${latest.name}\n🔗 ${latest.url}`;
    else reply = "No builds found.";
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: "Markdown" })
  });

  res.status(200).send("OK");
}
