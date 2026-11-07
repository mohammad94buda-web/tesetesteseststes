import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ITERATIONS, makePassphrase, openLetter, sealLetter } from "./seal.js";

const fast = { iterations: 1_000 };

test("die richtige Passphrase öffnet den Brief", async () => {
  const sealed = await sealLetter({
    body: "Lieber Morgen, der Tee steht bereit.",
    passphrase: "apfel-fluss-kerze",
    ...fast,
  });
  const opened = await openLetter(sealed, "apfel-fluss-kerze");
  assert.equal(opened.body, "Lieber Morgen, der Tee steht bereit.");
  assert.equal(opened.label, "");
});

test("eine falsche Passphrase öffnet den Brief nicht", async () => {
  const sealed = await sealLetter({
    body: "Dieser Satz bleibt zu.",
    passphrase: "richtig-und-lang",
    ...fast,
  });
  await assert.rejects(
    () => openLetter(sealed, "falsch-und-lang"),
    /öffnet diesen Brief nicht/,
  );
});

test("ein offenes Etikett steht neben dem Geheimtext", async () => {
  const sealed = await sealLetter({
    body: "Der Text der Hochzeit bleibt im Umschlag.",
    passphrase: "siegel-am-rand",
    label: "Zur Hochzeit",
    revealLabel: true,
    ...fast,
  });
  assert.equal(sealed.label, "Zur Hochzeit");
  assert.equal(Object.hasOwn(sealed, "ciphertext"), true);
  assert.equal(sealed.ciphertext.includes("Zur Hochzeit"), false);
  assert.equal(JSON.stringify(sealed).includes("Zur Hochzeit"), true);
});

test("der Brieftext steht nicht im Geheimtext und die Passphrase auch nicht", async () => {
  const body = "EinzigartigerSatzFuchsblau";
  const passphrase = "geheime-passphrase-am-telefon";
  const sealed = await sealLetter({
    body,
    passphrase,
    label: "Nicht mitversiegeln",
    revealLabel: false,
    ...fast,
  });
  const packed = JSON.stringify(sealed);
  assert.equal(packed.includes(body), false);
  assert.equal(packed.includes(passphrase), false);
  assert.equal(Object.hasOwn(sealed, "label"), false);
  assert.equal(sealed.iterations, 1_000);
});

test("ohne ausdrückliche Freigabe bleibt auch ein gesetztes Etikett draußen", async () => {
  const sealed = await sealLetter({
    body: "Nur der Umschlag.",
    passphrase: "vier-worte-reichen-hier",
    label: "Sichtbares Etikett",
    ...fast,
  });
  assert.equal(Object.hasOwn(sealed, "label"), false);
});

test("die voreingestellte Ableitung ist langsam genug für einen Brief", () => {
  assert.equal(DEFAULT_ITERATIONS, 100_000);
});

test("ein erzeugter Satz hat fünf Wörter aus der Liste", () => {
  const phrase = makePassphrase();
  const words = phrase.split("-");
  assert.equal(words.length, 5);
  assert.equal(words.every((word) => /^[a-z]+$/.test(word)), true);
});
