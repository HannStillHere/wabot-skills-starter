import os from "os";
import { formatDuration, formatBytes } from "../lib/helpers.js";

export default {
  name: "System & Info",
  category: "system",
  commands: ["menu", "help", "ping", "sysinfo", "runtime"],
  description: "Menampilkan daftar perintah dan status sistem bot",
  run: async ({ sock, m, command, remoteJid, config, skills }) => {
    const prefix = config.prefix || ".";

    if (command === "ping") {
      const start = Date.now();
      await sock.sendMessage(remoteJid, { text: "🏓 Pong!" }, { quoted: m });
      const latency = Date.now() - start;
      await sock.sendMessage(remoteJid, { text: `⚡ Respon Bot: *${latency} ms*` }, { quoted: m });
      return;
    }

    if (command === "sysinfo" || command === "runtime") {
      const uptimeSec = process.uptime();
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;

      const infoText =
        `💻 *INFORMASI SISTEM BOT*\n\n` +
        `🤖 *Nama Bot:* ${config.botName}\n` +
        `⏱️ *Uptime:* ${formatDuration(uptimeSec)}\n` +
        `🧠 *RAM Terpakai:* ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n` +
        `🖥️ *Platform:* ${os.type()} ${os.release()} (${os.arch()})\n` +
        `📦 *Node.js:* ${process.version}\n` +
        `👑 *Owner:* ${config.ownerName} (${config.ownerNumber})\n\n` +
        `_Ditenagai oleh @whiskeysockets/baileys (ESM)_`;

      await sock.sendMessage(remoteJid, { text: infoText }, { quoted: m });
      return;
    }

    // Command: .menu / .help
    // Group skills by category
    const categorized = {};
    for (const skill of skills.values()) {
      const cat = skill.category || "lainnya";
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(skill);
    }

    let menuText =
      `✨ *${config.botName.toUpperCase()} - MENU UTAMA* ✨\n` +
      `──────────────────────────\n` +
      `👤 *Owner:* ${config.ownerName}\n` +
      `⚡ *Prefix:* [ \`${prefix}\` ]\n` +
      `📦 *Modul:* ${skills.size} Kategori Skill\n` +
      `🕒 *Waktu Server:* ${new Date().toLocaleTimeString("id-ID")}\n` +
      `──────────────────────────\n\n`;

    const categoryIcons = {
      system: "⚙️ SISTEM & INFORMASI",
      sticker: "🎨 STIKER & GRAFIS",
      downloader: "📥 DOWNLOADER MEDIA",
      group: "👥 MANAJEMEN GRUP",
      tools: "🛠️ UTILITY & INFORMASI",
      games: "🎮 PERMAINAN & INTERAKTIF",
      lainnya: "📌 PERINTAH LAINNYA"
    };

    for (const [cat, skillList] of Object.entries(categorized)) {
      const catTitle = categoryIcons[cat] || `📁 ${cat.toUpperCase()}`;
      menuText += `*${catTitle}*\n`;
      for (const s of skillList) {
        const cmdList = s.commands.map((c) => `\`${prefix}${c}\``).join(", ");
        menuText += `• ${cmdList}\n  _${s.description || "-"}\n`;
      }
      menuText += `\n`;
    }

    menuText +=
      `──────────────────────────\n` +
      `💡 *Tips:* Ketik perintah dengan awalan prefix \`${prefix}\`\n` +
      `🚀 *Repository:* https://github.com/HannStillHere/wabot-skills-starter`;

    await sock.sendMessage(remoteJid, { text: menuText }, { quoted: m });
  }
};
