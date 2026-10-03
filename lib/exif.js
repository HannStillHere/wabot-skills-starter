import webp from "node-webpmux";

/**
 * Injects WhatsApp sticker EXIF metadata (packname, author, emojis) into a WebP buffer.
 * Compatible with Android and iOS WhatsApp clients.
 *
 * @param {Buffer} webpBuffer - Raw WebP image buffer
 * @param {string} [packname="Wabot Starter"] - Sticker pack name
 * @param {string} [author="Hann.67"] - Sticker pack author
 * @returns {Promise<Buffer>} - WebP buffer with EXIF header
 */
export async function addExif(webpBuffer, packname = "Wabot Starter", author = "Hann.67") {
  try {
    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
      "sticker-pack-id": "com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4121-aa70-4a30fb209980",
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      "emojis": ["🤖", "✨"]
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;
    return await img.save(null);
  } catch (err) {
    console.error("[EXIF Error]:", err.message);
    return webpBuffer;
  }
}
