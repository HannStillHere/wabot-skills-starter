import sharp from "sharp";
import { addExif } from "../lib/exif.js";
import { unwrapMessage, findMediaMessage, downloadMedia } from "../lib/helpers.js";

/**
 * Generates an authentic Brat sticker using SVG and Sharp (100% pure Node.js)
 */
async function generateBratSvg(text) {
  const lines = text.split("\n");
  const maxLineLen = Math.max(...lines.map((l) => l.length));
  
  // Calculate dynamic font size based on text length
  let fontSize = 48;
  if (maxLineLen > 15 || lines.length > 5) fontSize = 36;
  if (maxLineLen > 25 || lines.length > 8) fontSize = 28;

  const lineHeight = fontSize * 1.25;
  const startY = 80;

  const tspanLines = lines
    .map((line, idx) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<tspan x="40" dy="${idx === 0 ? 0 : lineHeight}">${escaped}</tspan>`;
    })
    .join("");

  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bratBlur">
          <feGaussianBlur stdDeviation="1.0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="40" y="${startY}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${fontSize}" fill="#000000" filter="url(#bratBlur)">
        ${tspanLines}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

export default {
  name: "Sticker Suite",
  category: "sticker",
  commands: ["s", "stiker", "sticker", "toimg", "brat", "emojimix"],
  description: "Pembuat stiker WebP dengan EXIF, konversi stiker ke gambar, Brat generator, dan Emojimix",
  run: async ({ sock, m, rawCurrent, command, args, remoteJid, config }) => {
    const packname = config.packname || "Wabot Starter";
    const author = config.author || "Hann.67";

    // 1. Command: .brat <teks>
    if (command === "brat") {
      let bratText = args.join(" ").trim();
      if (!bratText) {
        // Check if quoted message has text
        const quotedText =
          rawCurrent?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
          rawCurrent?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
        if (quotedText) bratText = quotedText;
      }

      if (!bratText) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Contoh penggunaan: *.brat kamu nanya?*" },
          { quoted: m }
        );
      }

      await sock.sendMessage(remoteJid, { text: "⏳ Sedang merender stiker Brat..." }, { quoted: m });

      const svgBuf = await generateBratSvg(bratText);
      const webpBuf = await sharp(svgBuf).webp({ quality: 80 }).toBuffer();
      const finalSticker = await addExif(webpBuf, packname, author);

      return await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
    }

    // 2. Command: .emojimix <emoji1>+<emoji2>
    if (command === "emojimix") {
      const input = args.join("").trim();
      // Match two emojis (supporting unicode emojis)
      const emojiMatch = input.match(/\p{Extended_Pictographic}/gu);

      if (!emojiMatch || emojiMatch.length < 2) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Masukkan 2 emoji! Contoh: *.emojimix 🐶🐱* atau *.emojimix 💀+😭*" },
          { quoted: m }
        );
      }

      const [e1, e2] = emojiMatch;
      await sock.sendMessage(remoteJid, { text: `⏳ Menggabungkan ${e1} + ${e2}...` }, { quoted: m });

      try {
        const url = `https://emojik.vercel.app/s/${encodeURIComponent(e1)}_${encodeURIComponent(e2)}?size=512`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error("Kombinasi emoji belum tersedia di Emoji Kitchen");

        const imgArrayBuffer = await res.arrayBuffer();
        const imgBuf = Buffer.from(imgArrayBuffer);

        const webpBuf = await sharp(imgBuf)
          .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 80 })
          .toBuffer();

        const finalSticker = await addExif(webpBuf, packname, author);
        return await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
      } catch (err) {
        return await sock.sendMessage(
          remoteJid,
          { text: `❌ Gagal membuat emojimix: ${err.message}` },
          { quoted: m }
        );
      }
    }

    // 3. Command: .toimg (Convert sticker back to image)
    if (command === "toimg") {
      const quoted = rawCurrent?.extendedTextMessage?.contextInfo?.quotedMessage;
      const stickerMsg = quoted?.stickerMessage;

      if (!stickerMsg) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Balas (reply) stiker yang ingin diubah menjadi gambar dengan perintah *.toimg*" },
          { quoted: m }
        );
      }

      await sock.sendMessage(remoteJid, { text: "⏳ Mengonversi stiker ke gambar..." }, { quoted: m });
      const stickerBuf = await downloadMedia(stickerMsg, "sticker");
      const pngBuf = await sharp(stickerBuf).png().toBuffer();

      return await sock.sendMessage(
        remoteJid,
        { image: pngBuf, caption: "✅ Berhasil dikonversi ke gambar!" },
        { quoted: m }
      );
    }

    // 4. Command: .s / .stiker (Convert image/video to WebP Sticker)
    if (command === "s" || command === "stiker" || command === "sticker") {
      const contextInfo = rawCurrent?.extendedTextMessage?.contextInfo;
      const quoted = contextInfo?.quotedMessage;

      const imageMsg = findMediaMessage(rawCurrent, "image") || findMediaMessage(quoted, "image");
      const videoMsg = findMediaMessage(rawCurrent, "video") || findMediaMessage(quoted, "video");
      const docMsg = findMediaMessage(rawCurrent, "document") || findMediaMessage(quoted, "document");

      const isDocImage = docMsg?.mimetype?.startsWith("image/");
      const targetMedia = imageMsg || (isDocImage ? docMsg : null);

      if (!targetMedia && !videoMsg) {
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Kirim gambar dengan caption *.s* atau balas (reply) gambar dengan *.s*" },
          { quoted: m }
        );
      }

      await sock.sendMessage(remoteJid, { text: "⏳ Sedang membuat stiker..." }, { quoted: m });

      if (targetMedia) {
        const mediaBuf = await downloadMedia(targetMedia, "image");
        const rawWebp = await sharp(mediaBuf)
          .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 80 })
          .toBuffer();

        const finalSticker = await addExif(rawWebp, packname, author);
        return await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
      }

      if (videoMsg) {
        // Video sticker requires max 7 seconds
        const seconds = videoMsg.seconds || 0;
        if (seconds > 10) {
          return await sock.sendMessage(
            remoteJid,
            { text: "❌ Durasi video maksimal 10 detik untuk dijadikan stiker." },
            { quoted: m }
          );
        }
        // Return notice if ffmpeg is needed for animated stickers
        return await sock.sendMessage(
          remoteJid,
          { text: "ℹ️ Stiker gambar statis didukung penuh secara in-memory. Untuk stiker video bergerak, pastikan sistem host memiliki FFmpeg terpasang." },
          { quoted: m }
        );
      }
    }
  }
};
