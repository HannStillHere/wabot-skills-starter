// In-memory AFK and Quiz storage
const afkUsers = new Map();
const activeQuizzes = new Map();

const QUIZ_BANK = [
  { q: "Pintu apa yang didorong oleh 10 orang pun tidak akan terbuka?", a: "pintu geser", clue: "p**** g****" },
  { q: "Benda apa yang kalau dipotong malah semakin tinggi?", a: "celana", clue: "c*****" },
  { q: "Pohon apa yang paling banyak muncul saat hari raya Lebaran?", a: "pohon maaf", clue: "p**** m***" },
  { q: "Hewan apa yang bersaudara dan selalu akur?", a: "katak beradik", clue: "k**** b******" },
  { q: "Huruf apa yang selalu kedinginan?", a: "b", clue: "huruf b (karena di tengah ac)" },
  { q: "Gajah apa yang belalainya pendek?", a: "gajah pesek", clue: "g**** p****" },
  { q: "Siapa presiden Indonesia yang paling imut?", a: "gus dur", clue: "g** d**" }
];

export default {
  name: "Interactive & Games",
  category: "games",
  commands: ["afk", "pilih", "rate", "kuis", "jawab"],
  description: "Fitur interaktif dan hiburan (AFK status, Pilih Opsi, Rate %, Kuis Asah Otak)",
  run: async ({ sock, m, rawCurrent, command, args, text, remoteJid, senderNum, senderName, isGroup }) => {
    // 1. Command: .afk <alasan>
    if (command === "afk") {
      const reason = text.trim() || "Sedang istirahat / tidak di tempat";
      afkUsers.set(senderNum, {
        name: senderName,
        reason,
        time: Date.now()
      });

      return await sock.sendMessage(
        remoteJid,
        { text: `💤 @${senderNum} sekarang berstatus *AFK*.\n📝 *Alasan:* ${reason}`, mentions: [`${senderNum}@s.whatsapp.net`] },
        { quoted: m }
      );
    }

    // 2. Command: .pilih <opsi 1> | <opsi 2>
    if (command === "pilih") {
      if (!text.includes("|")) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Format salah. Pisahkan opsi dengan tanda vertical bar `|`.\nContoh: *.pilih Kopi | Teh | Boba*" },
          { quoted: m }
        );
      }

      const options = text.split("|").map((opt) => opt.trim()).filter(Boolean);
      if (options.length < 2) {
        return await sock.sendMessage(remoteJid, { text: "❌ Masukkan minimal 2 opsi pilihan!" }, { quoted: m });
      }

      const chosen = options[Math.floor(Math.random() * options.length)];
      return await sock.sendMessage(
        remoteJid,
        { text: `🤔 *HASIL PILIHAN BOT*\n\nDari pilihan yang kamu beri, bot memilih:\n👉 *${chosen}*` },
        { quoted: m }
      );
    }

    // 3. Command: .rate <sesuatu>
    if (command === "rate") {
      const item = text.trim() || "kamu";
      const percentage = Math.floor(Math.random() * 101);

      let remark = "Biasa aja sih.";
      if (percentage > 90) remark = "Luar biasa sempurna! ⭐⭐⭐⭐⭐";
      else if (percentage > 75) remark = "Keren banget, mantap! 👍";
      else if (percentage > 50) remark = "Cukup oke lah. 👌";
      else if (percentage < 25) remark = "Agak kurang ya... 😅";

      return await sock.sendMessage(
        remoteJid,
        { text: `📊 *RATING CHECK*\n\n🎯 *Objek:* ${item}\n⭐ *Skor:* ${percentage}%\n💬 *Catatan:* ${remark}` },
        { quoted: m }
      );
    }

    // 4. Command: .kuis (Mulai Kuis)
    if (command === "kuis") {
      if (activeQuizzes.has(remoteJid)) {
        const q = activeQuizzes.get(remoteJid);
        return await sock.sendMessage(
          remoteJid,
          { text: `⚠️ Masih ada kuis yang belum terjawab!\n\n❓ *Soal:* ${q.question}\n💡 *Clue:* \`${q.clue}\`\n\nJawab dengan *.jawab <jawaban>*` },
          { quoted: m }
        );
      }

      const randomQuiz = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
      activeQuizzes.set(remoteJid, {
        question: randomQuiz.q,
        answer: randomQuiz.a.toLowerCase(),
        clue: randomQuiz.clue,
        startedAt: Date.now()
      });

      // Auto cancel after 60 seconds
      setTimeout(() => {
        if (activeQuizzes.has(remoteJid)) {
          const current = activeQuizzes.get(remoteJid);
          sock.sendMessage(remoteJid, { text: `⏰ *WAKTU KUIS HABIS!*\n\nJawaban yang benar adalah: *${current.answer.toUpperCase()}*` });
          activeQuizzes.delete(remoteJid);
        }
      }, 60000);

      return await sock.sendMessage(
        remoteJid,
        { text: `🧩 *KUIS ASAH OTAK*\n\n❓ *Pertanyaan:* ${randomQuiz.q}\n💡 *Clue:* \`${randomQuiz.clue}\`\n⏱️ *Waktu:* 60 Detik\n\nKetik *.jawab <jawaban>* untuk menjawab!` },
        { quoted: m }
      );
    }

    // 5. Command: .jawab <tebakan>
    if (command === "jawab") {
      if (!activeQuizzes.has(remoteJid)) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Saat ini tidak ada kuis aktif. Ketik *.kuis* untuk memulai kuis baru!" },
          { quoted: m }
        );
      }

      const current = activeQuizzes.get(remoteJid);
      const userAnswer = text.trim().toLowerCase();

      if (userAnswer === current.answer) {
        activeQuizzes.delete(remoteJid);
        return await sock.sendMessage(
          remoteJid,
          { text: `🎉 *SELAMAT @${senderNum}! JAWABAN BENAR!* 🎉\n\nJawaban: *${current.answer.toUpperCase()}*`, mentions: [`${senderNum}@s.whatsapp.net`] },
          { quoted: m }
        );
      } else {
        return await sock.sendMessage(
          remoteJid,
          { text: `❌ Jawaban salah! Coba tebak lagi. Clue: \`${current.clue}\`` },
          { quoted: m }
        );
      }
    }
  }
};
