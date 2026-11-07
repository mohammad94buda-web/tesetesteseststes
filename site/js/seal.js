const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const DEFAULT_ITERATIONS = 100_000;
const MIN_ITERATIONS = 1_000;
const MAX_ITERATIONS = 1_000_000;

const WORDS = [
  "abend", "acker", "apfel", "ast", "bach", "berg", "blatt", "brief",
  "brot", "buch", "damm", "dach", "eiche", "eimer", "faden", "feld",
  "fels", "fenster", "fisch", "fluss", "gabel", "garten", "glas", "gold",
  "hafen", "haus", "heft", "herz", "himmel", "honig", "insel", "jahre",
  "kammer", "kerze", "kiesel", "klee", "lampe", "linde", "mond", "morgen",
  "nadel", "nebel", "nest", "ort", "papier", "pfad", "quelle", "regen",
  "ring", "salz", "see", "siegel", "stern", "stift", "tinte", "tisch",
  "turm", "ufer", "uhr", "wald", "weg", "wind", "wolke", "zimmer",
];

function cryptoApi() {
  const current = globalThis.crypto;
  if (!current?.subtle || !current.getRandomValues) {
    throw new Error("Dieser Browser kann den Brief nicht versiegeln.");
  }
  return current;
}

function bytesToBase64(bytes) {
  let binary = "";
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function assertIterations(iterations) {
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new Error("Die Ableitung der Passphrase ist ungültig.");
  }
}

async function deriveKey(passphrase, salt, iterations) {
  const subtle = cryptoApi().subtle;
  const material = await subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function makePassphrase(wordCount = 5) {
  if (!Number.isInteger(wordCount) || wordCount < 4 || wordCount > 8) {
    throw new Error("Die Passphrase braucht vier bis acht Wörter.");
  }
  const random = cryptoApi().getRandomValues(new Uint8Array(wordCount * 2));
  const words = [];
  for (let index = 0; index < wordCount; index += 1) {
    const pick = (random[index * 2] << 8) | random[index * 2 + 1];
    words.push(WORDS[pick % WORDS.length]);
  }
  return words.join("-");
}

export async function sealLetter({
  body,
  passphrase,
  label = "",
  revealLabel = false,
  iterations = DEFAULT_ITERATIONS,
}) {
  if (typeof body !== "string" || body.trim() === "") {
    throw new Error("Der Brief ist noch leer.");
  }
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Die Passphrase fehlt.");
  }
  assertIterations(iterations);

  const crypto = cryptoApi();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(body));

  const sealed = {
    v: 1,
    kdf: "PBKDF2-SHA-256",
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };

  if (revealLabel && typeof label === "string" && label.trim() !== "") {
    sealed.label = label.trim();
  }

  return sealed;
}

export async function openLetter(sealed, passphrase) {
  if (!sealed || sealed.v !== 1 || typeof sealed.ciphertext !== "string") {
    throw new Error("Das ist kein versiegelter Brief.");
  }
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Die Passphrase fehlt.");
  }
  assertIterations(sealed.iterations);

  const salt = base64ToBytes(sealed.salt);
  const iv = base64ToBytes(sealed.iv);
  const ciphertext = base64ToBytes(sealed.ciphertext);
  const key = await deriveKey(passphrase, salt, sealed.iterations);

  try {
    const plain = await cryptoApi().subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return {
      body: decoder.decode(plain),
      label: typeof sealed.label === "string" ? sealed.label : "",
    };
  } catch {
    throw new Error("Die Passphrase öffnet diesen Brief nicht.");
  }
}
