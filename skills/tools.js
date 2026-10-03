import { getWeather, getCryptoPrice, getExchangeRate, getQuranAyah, getWordDefinition } from "../lib/public_apis.js";

/**
 * Native Google Translate TTS (Zero-Auth, Fast MP3 Stream)
 */
async function fetchGoogleTts(text, lang = "id") {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) throw new Error("Gagal mengunduh audio TTS dari Google");
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export default {
  name: "Utility Tools",
  category: "tools",
  commands: ["cuaca", "kripto", "kurs", "quran", "arti", "tts"],
  description: "Utilitas cuaca, harga kripto, kurs mata uang, Al-Qur'an, kamus, dan voice note TTS (100% Free & No-Auth)",
  run: async ({ sock, m, command, args, text, remoteJid }) => {
    // 1. Cuaca
    if (command === "cuaca") {
      const city = text.trim() || "Jakarta";
      await sock.sendMessage(remoteJid, { text: `⏳ Mengambil data cuaca untuk *${city}*...` }, { quoted: m });
      const result = await getWeather(city);
      return await sock.sendMessage(remoteJid, { text: result }, { quoted: m });
    }

    // 2. Kripto
    if (command === "kripto") {
      const coin = text.trim() || "btc";
      await sock.sendMessage(remoteJid, { text: `⏳ Memeriksa harga kripto *${coin.toUpperCase()}*...` }, { quoted: m });
      const result = await getCryptoPrice(coin);
      return await sock.sendMessage(remoteJid, { text: result }, { quoted: m });
    }

    // 3. Kurs
    if (command === "kurs") {
      const curr = text.trim() || "USD";
      await sock.sendMessage(remoteJid, { text: `⏳ Memeriksa kurs mata uang *${curr.toUpperCase()}*...` }, { quoted: m });
      const result = await getExchangeRate(curr);
      return await sock.sendMessage(remoteJid, { text: result }, { quoted: m });
    }

    // 4. Quran
    if (command === "quran") {
      const target = text.trim() || "2:255";
      await sock.sendMessage(remoteJid, { text: `⏳ Mengambil ayat Al-Qur'an *${target}*...` }, { quoted: m });
      const result = await getQuranAyah(target);
      return await sock.sendMessage(remoteJid, { text: result }, { quoted: m });
    }

    // 5. Arti / Kamus
    if (command === "arti") {
      if (!text.trim()) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Masukkan kata yang dicari! Contoh: *.arti programming*" },
          { quoted: m }
        );
      }
      const result = await getWordDefinition(text);
      return await sock.sendMessage(remoteJid, { text: result }, { quoted: m });
    }

    // 6. Text to Speech (TTS)
    if (command === "tts") {
      if (!text.trim()) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Masukkan teks yang ingin dijadikan suara! Contoh: *.tts halo selamat datang di bot ini*" },
          { quoted: m }
        );
      }

      await sock.sendMessage(remoteJid, { text: "⏳ Mengonversi teks ke audio voice note..." }, { quoted: m });

      try {
        const audioBuf = await fetchGoogleTts(text, "id");
        return await sock.sendMessage(
          remoteJid,
          {
            audio: audioBuf,
            mimetype: "audio/mp4",
            ptt: true
          },
          { quoted: m }
        );
      } catch (err) {
        return await sock.sendMessage(
          remoteJid,
          { text: `❌ Gagal memproses TTS: ${err.message}` },
          { quoted: m }
        );
      }
    }
  }
};
