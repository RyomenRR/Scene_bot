import { Telegraf } from "telegraf";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Scene folders
const SCENES = {
  scene5: "http://download.omarea.com/scene5/",
  scene6: "http://download.omarea.com/scene6/",
  scene7: "http://download.omarea.com/scene7/",
  scene8: "http://download.omarea.com/scene8/",
  scene9: "http://download.omarea.com/scene9/",
};

// Fetch APK links
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

// Telegram commands
bot.start((ctx) =>
  ctx.reply(
    "👋 Welcome to Scene Bot!\nUse /list, /latest, or /download <keyword>."
  )
);

bot.command("list", async (ctx) => {
  let msg = "*Available Builds:*\n";
  for (const [scene, url] of Object.entries(SCENES)) {
    const builds = await fetchBuilds(url);
    if (builds.length) {
      msg += `\n📌 *${scene.toUpperCase()}*\n`;
      builds.forEach((b) => (msg += `  ├── ${b.name}\n`));
    }
  }
  ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.command("latest", async (ctx) => {
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
    ctx.reply(`🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`, {
      parse_mode: "Markdown",
    });
  } else ctx.reply("No builds found.");
});

bot.command("download", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) return ctx.reply("Usage: /download <keyword>");
  const keyword = parts[1].toLowerCase();
  let found = null;
  outer: for (const url of Object.values(SCENES)) {
    const builds = await fetchBuilds(url);
    for (const b of builds) {
      if (b.name.toLowerCase().includes(keyword)) {
        found = b;
        break outer;
      }
    }
  }
  if (found) {
    ctx.reply(`📦 ${found.name}\n🔗 ${found.url}`);
  } else ctx.reply(`No build found matching: ${keyword}`);
});

bot.launch().then(() => console.log("Scene Bot started!"));    let match;
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

// 2️⃣ MAIN HANDLER
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("✅ Scene Bot is live");

  const update = await readBody(req);
  if (!update.message || !update.message.text) return res.status(200).send("No valid message");

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = "❌ Command not recognized. Use /start.";

  if (text === "/start") {
    reply = "👋 *Welcome to Scene Bot!*\nUse /list, /latest, or /download <keyword>.";
  } else if (text === "/list") {
    reply = "*Available Builds:*\n";
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
        // Send document
        await fetch(`${TELEGRAM_API}/sendDocument`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: foundBuild.url,
            caption: `📦 *${foundBuild.name}*`,
            parse_mode: "Markdown",
          }),
        });
        return res.status(200).send("Document sent attempt complete.");
      } else {
        reply = `No build found matching: *${keyword}*`;
      }
    }
  } else if (text === "/latest") {
    let latest = null;
    for (const url of Object.values(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        const sorted = builds.sort((a,b) => a.name.localeCompare(b.name));
        const currentLatest = sorted.at(-1);
        if (!latest || currentLatest.name > latest.name) latest = currentLatest;
      }
    }
    reply = latest ? `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}` : "No builds found.";
  }

  // Send reply if text response
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
}    const builds = [];
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

// 2. MAIN HANDLER
export default async function handler(req, res) {
  // Only process POST requests from the webhook
  if (req.method !== "POST") {
    return res.status(200).send("✅ Scene Bot is live!");
  }

  // Use the manual body reader
  let update;
  try {
    update = await readBody(req); 
  } catch (e) {
    console.error("Error parsing request body:", e);
    return res.status(400).send("Invalid JSON body");
  }

  // Basic message validation
  if (!update.message || !update.message.text) {
    return res.status(200).send("No valid message");
  }

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = null; // Use null to indicate we need to check the command logic

  // --- COMMAND LOGIC ---

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
    if (parts.length < 2) {
      reply = "Usage: /download <keyword>";
    } else {
      const keyword = parts[1];
      let foundBuild = null;
      
      // 1. Search for the build
      outer: for (const url of Object.values(SCENES)) {
        const builds = await fetchBuilds(url);
        for (const b of builds) {
          if (b.name.toLowerCase().includes(keyword)) {
            foundBuild = b;
            break outer;
          }
        }
      }

      // 2. Process the result
      if (foundBuild) {
        // --- THIS IS THE CRITICAL CHANGE: Use sendDocument ---
        
        const documentUrl = `${TELEGRAM_API}/sendDocument`;
        
        const documentResponse = await fetch(documentUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                // Pass the public URL of the APK as the 'document' parameter
                document: foundBuild.url, 
                caption: `📦 *${foundBuild.name}*`,
                parse_mode: "Markdown",
            }),
        });

        // Check if the document sending failed (e.g., file too large, URL invalid)
        if (!documentResponse.ok) {
            console.error("sendDocument failed:", await documentResponse.text());
            reply = `❌ Failed to send ${foundBuild.name}. (Check file size/access.)`;
        }
        
        // Since we already sent the document (or a failure message), we return early
        // to avoid calling sendMessage later.
        return res.status(200).send("Document sent attempt complete."); 

      } else {
        reply = `No build found matching: *${keyword}*`;
      }
    }
  } else if (text === "/latest") {
    let latest = null;
    for (const url of Object.values(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
        const currentLatest = sorted.at(-1);

        if (!latest || currentLatest.name > latest.name) {
          latest = currentLatest;
        }
      }
    }
    reply = latest
      ? `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`
      : "No builds found.";
  }
  
  // 3. SEND REPLY (Only if 'reply' is not null, meaning a text response is needed)
  if (reply !== null) {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          parse_mode: "Markdown",
        }),
      });
  }

  res.status(200).send("OK");
}
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

// 2. MAIN HANDLER
export default async function handler(req, res) {
  // Only process POST requests from the webhook
  if (req.method !== "POST") {
    return res.status(200).send("✅ Scene Bot is live!");
  }

  // Use the manual body reader
  let update;
  try {
    update = await readBody(req); 
  } catch (e) {
    console.error("Error parsing request body:", e);
    return res.status(400).send("Invalid JSON body");
  }

  // Basic message validation
  if (!update.message || !update.message.text) {
    return res.status(200).send("No valid message");
  }

  const text = update.message.text.toLowerCase();
  const chatId = update.message.chat.id;

  let reply = "❌ Command not recognized. Use /start.";

  // --- COMMAND LOGIC ---

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
      if (!reply.startsWith("📦")) reply = `No build found matching: *${keyword}*`;
    }
  } else if (text === "/latest") {
    let latest = null;
    // Iterate through all scenes to find the overall latest build
    for (const url of Object.values(SCENES)) {
      const builds = await fetchBuilds(url);
      if (builds.length) {
        // Simple sort based on string comparison (works for version numbers like v1.0.1 < v1.0.10)
        const sorted = builds.sort((a, b) => a.name.localeCompare(b.name));
        const currentLatest = sorted.at(-1);

        if (!latest || currentLatest.name > latest.name) {
          latest = currentLatest;
        }
      }
    }
    reply = latest
      ? `🆕 *Latest Build:*\n📦 ${latest.name}\n🔗 ${latest.url}`
      : "No builds found.";
  }

  // 3. SEND REPLY
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
