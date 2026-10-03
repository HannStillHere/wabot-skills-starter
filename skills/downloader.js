import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Free TikTok No-Watermark resolver using TikWM API (100% No-Auth)
 */
async function downloadTikTok(url) {
  const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(15000)
  });
  const data = await apiRes.json();

  if (data.code !== 0 || !data.data || !data.data.play) {
    throw new Error(data.msg || "Gagal mengekstrak video TikTok.");
  }

  const videoUrl = data.data.play;
  const vidRes = await fetch(videoUrl, { signal: AbortSignal.timeout(30000) });
  const arrayBuf = await vidRes.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuf),
    title: data.data.title || "TikTok Video",
    author: data.data.author?.nickname || data.data.author?.unique_id || "TikTok User"
  };
}

export default {
  name: "Media Downloader",
  category: "downloader",
  commands: ["dl", "tiktok", "tt", "yt", "ytmp3"],
  description: "Unduh media dari TikTok (Tanpa Watermark), YouTube, dan media sosial lainnya",
  run: async ({ sock, m, command, args, text, remoteJid }) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    const targetUrl = urlMatch ? urlMatch[0] : "";

    if (!targetUrl) {
      return await sock.sendMessage(
        remoteJid,
        { text: "ℹ️ Masukkan link tautan media! Contoh:\n*.tiktok https://vt.tiktok.com/xxxxxx/*" },
        { quoted: m }
      );
    }

    await sock.sendMessage(remoteJid, { text: "⏳ Sedang memproses unduhan media..." }, { quoted: m });

    // Handle TikTok URL
    if (targetUrl.includes("tiktok.com")) {
      try {
        const { buffer, title, author } = await downloadTikTok(targetUrl);
        const caption = `🎬 *TIKTOK NO-WATERMARK*\n\n📌 *Judul:* ${title}\n👤 *Kreator:* @${author}\n\n_Diunduh via Wabot Skills Starter_`;

        return await sock.sendMessage(
          remoteJid,
          {
            video: buffer,
            caption,
            mimetype: "video/mp4"
          },
          { quoted: m }
        );
      } catch (err) {
        return await sock.sendMessage(
          remoteJid,
          { text: `❌ Gagal mengunduh TikTok: ${err.message}` },
          { quoted: m }
        );
      }
    }

    // Generic downloader using yt-dlp if installed on host
    try {
      const isAudioOnly = command === "ytmp3";
      const rand = Math.random().toString(36).substring(7);
      const tempOut = path.join(os.tmpdir(), `wabot_dl_${Date.now()}_${rand}.%(ext)s`);

      const ytdlpArgs = [
        "--no-playlist",
        "--no-warnings",
        "--max-filesize", "90M",
        "-o", tempOut
      ];

      if (isAudioOnly) {
        ytdlpArgs.push("-x", "--audio-format", "mp3", targetUrl);
      } else {
        ytdlpArgs.push("-f", "b[ext=mp4]/best", targetUrl);
      }

      await new Promise((resolve, reject) => {
        const ytdlp = spawn("yt-dlp", ytdlpArgs);
        let errOut = "";
        ytdlp.stderr.on("data", (d) => (errOut += d.toString()));
        ytdlp.on("error", (e) => reject(new Error("yt-dlp binary tidak ditemukan pada sistem host")));
        ytdlp.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(errOut || `yt-dlp exited code ${code}`));
        });
      });

      // Find the generated file in tmpdir
      const basePrefix = `wabot_dl_${Date.now()}_${rand}`.split("_").slice(0, 3).join("_");
      const tmpFiles = fs.readdirSync(os.tmpdir());
      const matchedFile = tmpFiles.find((f) => f.startsWith(basePrefix));

      if (matchedFile) {
        const filePath = path.join(os.tmpdir(), matchedFile);
        const mediaBuf = fs.readFileSync(filePath);
        try { fs.unlinkSync(filePath); } catch {}

        if (isAudioOnly) {
          return await sock.sendMessage(
            remoteJid,
            { audio: mediaBuf, mimetype: "audio/mp4", ptt: false },
            { quoted: m }
          );
        } else {
          return await sock.sendMessage(
            remoteJid,
            { video: mediaBuf, caption: "✅ Media berhasil diunduh!" },
            { quoted: m }
          );
        }
      }
    } catch (genericErr) {
      return await sock.sendMessage(
        remoteJid,
        { text: `❌ Unduhan gagal: ${genericErr.message}\n_Catatan: Untuk platform YouTube, pastikan binary yt-dlp terpasang di sistem host._` },
        { quoted: m }
      );
    }
  }
};
