from pyrogram import Client, filters
import json
import os

# --- CONFIG ---
API_ID = int(os.environ.get("API_ID"))   # from my.telegram.org
API_HASH = os.environ.get("API_HASH")   # from my.telegram.org
BOT_TOKEN = os.environ.get("BOT_TOKEN")

# File storage
APK_DB = "apks.json"
if os.path.exists(APK_DB):
    with open(APK_DB, "r") as f:
        apk_db = json.load(f)
else:
    apk_db = {}  # { "Alpha3": "file_id", ... }

app = Client("scene_bot", api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN)

# --- Listen to messages in your groups and channels ---
@app.on_message(filters.group | filters.channel | filters.private)
async def handle_message(client, message):
    global apk_db

    # --- Store APKs if sent to private channel ---
    if message.chat.username == "kachrapetihai" and message.document:
        file_name = message.document.file_name
        apk_db[file_name.lower()] = message.document.file_id
        with open(APK_DB, "w") as f:
            json.dump(apk_db, f)
        return

    # --- Commands from users ---
    text = message.text
    if not text:
        return

    text_lower = text.lower().replace(" ", "").replace("-", "")
    
    # Check download / 下载 → send latest
    if text_lower in ["download", "下载"]:
        if not apk_db:
            await message.reply("❌ No APKs found.")
            return
        # latest = last alphabetically
        latest_name = sorted(apk_db.keys())[-1]
        await client.send_document(message.chat.id, apk_db[latest_name])
        return

    # Check for APK names
    for name, file_id in apk_db.items():
        name_clean = name.lower().replace(" ", "").replace("-", "")
        if name_clean in text_lower:
            await client.send_document(message.chat.id, file_id)
            return

app.run()
