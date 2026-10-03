import { isGroupAdmin, isBotAdmin } from "../lib/helpers.js";

export default {
  name: "Group Suite",
  category: "group",
  commands: ["tagall", "everyone", "hidetag", "ht", "kick", "promote", "demote", "group", "del", "hapus"],
  description: "Moderasi dan administrasi grup (Tagall, Hidetag, Kick, Promote, Demote, Buka/Tutup Grup, Hapus Pesan)",
  run: async ({ sock, m, rawCurrent, command, args, text, remoteJid, isGroup, isOwner, senderNum }) => {
    // Command: .del / .hapus can work in private or group
    if (command === "del" || command === "hapus") {
      const quoted = rawCurrent?.extendedTextMessage?.contextInfo;
      if (!quoted?.stanzaId) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Balas (reply) pesan yang ingin dihapus dengan perintah *.del*" },
          { quoted: m }
        );
      }

      const deleteKey = {
        remoteJid,
        fromMe: quoted.participant ? false : true,
        id: quoted.stanzaId,
        participant: quoted.participant
      };

      try {
        await sock.sendMessage(remoteJid, { delete: deleteKey });
      } catch (err) {
        await sock.sendMessage(
          remoteJid,
          { text: `❌ Gagal menghapus pesan: Pastikan bot adalah Admin grup jika menghapus pesan orang lain.` },
          { quoted: m }
        );
      }
      return;
    }

    // All subsequent commands are Group-Only
    if (!isGroup) {
      return await sock.sendMessage(
        remoteJid,
        { text: "❌ Perintah ini hanya dapat digunakan di dalam Grup WhatsApp." },
        { quoted: m }
      );
    }

    const groupMeta = await sock.groupMetadata(remoteJid);
    const participants = groupMeta.participants || [];
    const senderJid = `${senderNum}@s.whatsapp.net`;
    const senderIsAdmin = isOwner || (await isGroupAdmin(sock, remoteJid, senderJid));
    const botIsAdmin = await isBotAdmin(sock, remoteJid);

    // 1. Tagall / Everyone
    if (command === "tagall" || command === "everyone") {
      if (!senderIsAdmin) {
        return await sock.sendMessage(
          remoteJid,
          { text: "❌ Hanya Admin grup yang dapat menggunakan perintah ini." },
          { quoted: m }
        );
      }

      const customMsg = text || "Panggilan untuk semua anggota grup!";
      let tagText = `📢 *TAGALL / PANGGILAN ANGGOTA*\n💬 *Pesan:* ${customMsg}\n👥 *Total:* ${participants.length} Anggota\n──────────────────────────\n`;
      const mentions = [];

      for (const p of participants) {
        const num = p.id.split("@")[0].split(":")[0];
        tagText += `• @${num}\n`;
        mentions.push(p.id);
      }

      return await sock.sendMessage(remoteJid, { text: tagText, mentions }, { quoted: m });
    }

    // 2. Hidetag / HT
    if (command === "hidetag" || command === "ht") {
      if (!senderIsAdmin) {
        return await sock.sendMessage(
          remoteJid,
          { text: "❌ Hanya Admin grup yang dapat menggunakan perintah ini." },
          { quoted: m }
        );
      }

      const broadcastMsg = text || "Pengumuman penting untuk seluruh anggota.";
      const mentions = participants.map((p) => p.id);
      return await sock.sendMessage(remoteJid, { text: broadcastMsg, mentions });
    }

    // 3. Kick
    if (command === "kick") {
      if (!senderIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Hanya Admin grup yang dapat mengeluarkan anggota." }, { quoted: m });
      }
      if (!botIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Bot belum menjadi Admin di grup ini." }, { quoted: m });
      }

      const quoted = rawCurrent?.extendedTextMessage?.contextInfo;
      const targetJid = quoted?.participant || (rawCurrent?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]);

      if (!targetJid) {
        return await sock.sendMessage(remoteJid, { text: "ℹ️ Tag (@user) atau balas (reply) pesan anggota yang ingin dikeluarkan." }, { quoted: m });
      }

      await sock.groupParticipantsUpdate(remoteJid, [targetJid], "remove");
      return await sock.sendMessage(remoteJid, { text: `👋 Anggota @${targetJid.split("@")[0]} berhasil dikeluarkan.`, mentions: [targetJid] });
    }

    // 4. Promote / Demote
    if (command === "promote" || command === "demote") {
      if (!senderIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Hanya Admin grup yang dapat mengubah hak akses admin." }, { quoted: m });
      }
      if (!botIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Bot belum menjadi Admin di grup ini." }, { quoted: m });
      }

      const quoted = rawCurrent?.extendedTextMessage?.contextInfo;
      const targetJid = quoted?.participant || (rawCurrent?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]);

      if (!targetJid) {
        return await sock.sendMessage(remoteJid, { text: `ℹ️ Tag (@user) atau balas (reply) pesan anggota yang ingin di-${command}.` }, { quoted: m });
      }

      const action = command === "promote" ? "promote" : "demote";
      await sock.groupParticipantsUpdate(remoteJid, [targetJid], action);
      const actionText = command === "promote" ? "diangkat menjadi Admin 🎉" : "diturunkan dari Admin 📉";

      return await sock.sendMessage(
        remoteJid,
        { text: `✅ Berhasil: @${targetJid.split("@")[0]} telah ${actionText}`, mentions: [targetJid] }
      );
    }

    // 5. Group open / close
    if (command === "group") {
      if (!senderIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Hanya Admin grup yang dapat mengatur grup." }, { quoted: m });
      }
      if (!botIsAdmin) {
        return await sock.sendMessage(remoteJid, { text: "❌ Bot belum menjadi Admin di grup ini." }, { quoted: m });
      }

      const action = (args[0] || "").toLowerCase();
      if (action === "open" || action === "buka") {
        await sock.groupSettingUpdate(remoteJid, "not_announcement");
        return await sock.sendMessage(remoteJid, { text: "🔓 *Grup telah dibuka!* Semua anggota sekarang dapat mengirim pesan." });
      } else if (action === "close" || action === "tutup") {
        await sock.groupSettingUpdate(remoteJid, "announcement");
        return await sock.sendMessage(remoteJid, { text: "🔒 *Grup telah ditutup!* Hanya Admin yang dapat mengirim pesan." });
      } else {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Format salah. Gunakan: *.group open* (buka grup) atau *.group close* (tutup grup)" },
          { quoted: m }
        );
      }
    }
  }
};
