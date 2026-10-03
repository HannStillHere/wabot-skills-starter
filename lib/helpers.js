import { downloadContentFromMessage } from "@whiskeysockets/baileys";

/**
 * Recursively unwrap nested WhatsApp message envelopes
 * (ephemeralMessage, viewOnceMessage, viewOnceMessageV2, documentWithCaptionMessage)
 */
export function unwrapMessage(msgObj) {
  if (!msgObj) return null;
  let m = msgObj;
  while (
    m.ephemeralMessage?.message ||
    m.viewOnceMessage?.message ||
    m.viewOnceMessageV2?.message ||
    m.viewOnceMessageV2Extension?.message ||
    m.documentWithCaptionMessage?.message ||
    m.templateMessage?.hydratedTemplate?.message ||
    m.templateMessage?.hydratedFourRowTemplate?.message ||
    m.interactiveMessage?.header
  ) {
    m =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.viewOnceMessageV2Extension?.message ||
      m.documentWithCaptionMessage?.message ||
      m.templateMessage?.hydratedTemplate?.message ||
      m.templateMessage?.hydratedFourRowTemplate?.message ||
      m.interactiveMessage?.header ||
      m;
  }
  return m;
}

/**
 * Searches for media message object in message or quoted message
 */
export function findMediaMessage(message, mediaType) {
  if (!message) return null;
  const direct = message[`${mediaType}Message`];
  if (direct) return direct;

  for (const wrapper of [
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "documentWithCaptionMessage"
  ]) {
    const nested = message[wrapper]?.message?.[`${mediaType}Message`];
    if (nested) return nested;
  }
  return null;
}

/**
 * Download WhatsApp media buffer from message stream
 */
export async function downloadMedia(mediaMessage, mediaType) {
  const stream = await downloadContentFromMessage(mediaMessage, mediaType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

/**
 * Checks if a participant is an admin in a group
 */
export async function isGroupAdmin(sock, groupJid, participantJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const participant = meta.participants.find(
      (p) => p.id.split("@")[0].split(":")[0] === participantJid.split("@")[0].split(":")[0]
    );
    return participant?.admin === "admin" || participant?.admin === "superadmin";
  } catch {
    return false;
  }
}

/**
 * Checks if bot is an admin in a group
 */
export async function isBotAdmin(sock, groupJid) {
  try {
    const botJid = sock.user?.id || "";
    return await isGroupAdmin(sock, groupJid, botJid);
  } catch {
    return false;
  }
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds into HH:MM:SS
 */
export function formatDuration(seconds) {
  const d = Number(seconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);

  const hDisplay = h > 0 ? `${h}j ` : "";
  const mDisplay = m > 0 ? `${m}m ` : "";
  const sDisplay = s > 0 ? `${s}d` : "0d";
  return hDisplay + mDisplay + sDisplay;
}
