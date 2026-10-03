import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import express from "express";
import QRCode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import { pathToFileURL } from "url";
import { unwrapMessage, findMediaMessage } from "./lib/helpers.js";
import { buildMenuText } from "./skills/system.js";

// Load configuration with fallback to config.example.json
let config = {
  botName: "Wabot Starter",
  ownerName: "Hann",
  ownerNumber: "628xxxxxxxxxx",
  prefix: ".",
  packname: "Wabot Skills Starter",
  author: "Hann.67",
  port: 3000,
  autoRead: false,
  firstChatWelcome: true
};

const CONFIG_PATH = path.resolve("./config.json");
const CONFIG_EXAMPLE_PATH = path.resolve("./config.example.json");

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch (err) {
    console.error("⚠️ Failed to parse config.json, using defaults:", err.message);
  }
} else if (fs.existsSync(CONFIG_EXAMPLE_PATH)) {
  console.log("ℹ️ config.json not found. Using config.example.json as baseline.");
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_EXAMPLE_PATH, "utf8")) };
  } catch {}
}

const AUTH_DIR = path.resolve("./auth_info");
const PORT = config.port || process.env.PORT || 3000;

let currentQrDataUrl = "";
let isConnected = false;
let botUser = null;
const loadedSkills = new Map();

// Persistent tracking of welcomed users for private chat greeting
const WELCOMED_FILE = path.resolve("./welcomed_users.json");
let welcomedUsers = new Set();
try {
  if (fs.existsSync(WELCOMED_FILE)) {
    welcomedUsers = new Set(JSON.parse(fs.readFileSync(WELCOMED_FILE, "utf8")));
  }
} catch {
  welcomedUsers = new Set();
}

function saveWelcomedUsers() {
  try {
    fs.writeFileSync(WELCOMED_FILE, JSON.stringify(Array.from(welcomedUsers), null, 2), "utf8");
  } catch {}
}

/**
 * Dynamically load all skills from the skills/ directory
 */
async function loadSkills() {
  const skillsDir = path.resolve("./skills");
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(skillsDir).filter((file) => file.endsWith(".js"));
  loadedSkills.clear();

  for (const file of files) {
    try {
      const filePath = path.join(skillsDir, file);
      const fileUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
      const module = await import(fileUrl);
      const skill = module.default;

      if (skill && Array.isArray(skill.commands) && typeof skill.run === "function") {
        loadedSkills.set(file, skill);
        console.log(`✅ Loaded Skill: [${skill.name || file}] (${skill.commands.join(", ")})`);
      } else {
        console.warn(`⚠️ Skipped invalid skill format: ${file}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load skill ${file}:`, err.message);
    }
  }

  console.log(`📦 Total active skills: ${loadedSkills.size}`);
}

/**
 * Express Web Server for easy QR code scanning on VPS / Headless environments
 */
const app = express();

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="5">
      <title>${config.botName || "WhatsApp Bot"} - Dashboard</title>
      <style>
        * { box-sizing: border-box; }
        body { background: #090a0f; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #12141c; border: 1px solid #1f2433; padding: 32px 24px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); max-width: 460px; width: 92%; text-align: center; }
        h1 { color: #22c55e; margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .badge { background: ${isConnected ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)"}; color: ${isConnected ? "#22c55e" : "#eab308"}; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-block; font-size: 13px; margin: 12px 0 20px; border: 1px solid ${isConnected ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.3)"}; }
        .qr-box { background: #ffffff; padding: 14px; border-radius: 14px; display: inline-block; margin: 10px 0; }
        .qr-box img { display: block; max-width: 260px; width: 100%; height: auto; }
        p { color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 6px 0; }
        .stats { background: #181b26; border: 1px solid #23283a; border-radius: 12px; padding: 12px 16px; margin-top: 18px; text-align: left; font-size: 13px; }
        .stats div { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #23283a; }
        .stats div:last-child { border-bottom: none; }
        .stats span { color: #9ca3af; }
        .stats b { color: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>⚡ ${config.botName || "Wabot Starter"}</h1>
        <div class="badge">${isConnected ? "● ONLINE & SIAP DIGUNAKAN" : "⏳ MENUNGGU SCAN QR CODE"}</div>
        
        ${currentQrDataUrl && !isConnected ? `
          <div class="qr-box">
            <img src="${currentQrDataUrl}" alt="WhatsApp QR Code">
          </div>
          <p>Buka WhatsApp di ponsel > Perangkat Tertaut > Tautkan Perangkat, lalu scan kode QR di atas.</p>
        ` : ""}

        ${isConnected ? `
          <p style="color: #4ade80; font-size: 15px; font-weight: 600; margin: 10px 0;">Bot Terhubung 24/7</p>
          <div class="stats">
            <div><span>ID Akun:</span><b>${botUser?.id?.split(":")[0] || "Bot WhatsApp"}</b></div>
            <div><span>Nama Bot:</span><b>${config.botName}</b></div>
            <div><span>Prefix:</span><b>${config.prefix}</b></div>
            <div><span>Skills Aktif:</span><b>${loadedSkills.size} Modul</b></div>
            <div><span>Owner:</span><b>${config.ownerName}</b></div>
          </div>
        ` : ""}
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Web Dashboard & QR Preview aktif di: http://localhost:${PORT}`);
});

/**
 * Main Baileys Connection Handler
 */
async function startBot() {
  await loadSkills();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📱 Menggunakan WA Web v${version.join(".")} (Latest: ${isLatest})`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Desktop"),
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan QR Code di bawah atau buka browser di http://localhost:" + PORT + "\n");
      qrcodeTerminal.generate(qr, { small: true });
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr);
      } catch {}
    }

    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Koneksi terputus (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startBot, 3000);
      } else {
        console.log("❌ Sesi telah logout. Silakan hapus folder auth_info dan restart bot.");
      }
    } else if (connection === "open") {
      isConnected = true;
      botUser = sock.user;
      console.log("\n========================================");
      console.log(`🎉 ${config.botName} BERHASIL TERHUBUNG!`);
      console.log(`📞 Nomor: ${botUser?.id?.split(":")[0]}`);
      console.log(`👑 Owner: ${config.ownerName} (${config.ownerNumber})`);
      console.log("========================================\n");
    }
  });

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid === "status@broadcast" || remoteJid.endsWith("@newsletter")) continue;

      const isGroup = remoteJid.endsWith("@g.us");
      const rawCurrent = unwrapMessage(msg.message);

      // Auto Read if configured
      if (config.autoRead) {
        await sock.readMessages([msg.key]);
      }

      // Extract text content
      const text =
        rawCurrent?.conversation ||
        rawCurrent?.extendedTextMessage?.text ||
        rawCurrent?.imageMessage?.caption ||
        rawCurrent?.videoMessage?.caption ||
        "";

      const cleanText = text.trim();
      if (!cleanText) continue;

      const rawSender = isGroup ? (msg.key.participant || msg.participant || "") : remoteJid;
      const senderNum = rawSender.split("@")[0].split(":")[0].replace(/\D/g, "");
      const senderName = msg.pushName || "Pengguna";

      const cleanOwnerNum = (config.ownerNumber || "").replace(/\D/g, "");
      const isOwner = msg.key.fromMe || (cleanOwnerNum && senderNum.endsWith(cleanOwnerNum));

      // ----------------------------------------------------
      // FIRST-TIME PRIVATE CHAT AUTO-WELCOME GREETING
      // ----------------------------------------------------
      if (!isGroup && !msg.key.fromMe && config.firstChatWelcome !== false) {
        if (!welcomedUsers.has(senderNum)) {
          welcomedUsers.add(senderNum);
          saveWelcomedUsers();

          const menu = buildMenuText({ config, skills: loadedSkills });
          const welcomeGreeting =
            `👋 *HI ini adalah bot modular template yang dibuat oleh HannStillHere*\n\n` +
            `Nomor ini sekarang bertindak sebagai bot otomatis. Berikut adalah menu dan fitur apa saja yang bisa dilakukan:\n\n` +
            `${menu}`;

          await sock.sendMessage(remoteJid, { text: welcomeGreeting }, { quoted: msg });
        }
      }

      // Check prefix
      const prefix = config.prefix || ".";
      if (!cleanText.startsWith(prefix)) continue;

      const args = cleanText.slice(prefix.length).trim().split(/\s+/);
      const command = (args.shift() || "").toLowerCase();

      // Find matching skill by command name or aliases
      let matchedSkill = null;
      for (const skill of loadedSkills.values()) {
        if (skill.commands.map((c) => c.toLowerCase()).includes(command)) {
          matchedSkill = skill;
          break;
        }
      }

      if (!matchedSkill) continue;

      console.log(`[CMD] "${command}" dari @${senderNum} (${senderName}) di ${isGroup ? "Grup" : "Private"}`);

      try {
        await matchedSkill.run({
          sock,
          m: msg,
          rawCurrent,
          command,
          args,
          text: args.join(" "),
          cleanText,
          remoteJid,
          isGroup,
          isOwner,
          senderNum,
          senderName,
          config,
          skills: loadedSkills
        });
      } catch (err) {
        console.error(`[Error pada skill ${command}]:`, err);
        await sock.sendMessage(
          remoteJid,
          { text: `❌ Terjadi kesalahan saat memproses perintah *${prefix}${command}*:\n_${err.message}_` },
          { quoted: msg }
        );
      }
    }
  });
}

startBot().catch((err) => console.error("Fatal Startup Error:", err));
