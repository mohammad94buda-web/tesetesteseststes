import { makePassphrase, openLetter, sealLetter } from "./seal.js";

const writeForm = document.querySelector("#schreiben");
const openForm = document.querySelector("#oeffnen");
const bodyField = document.querySelector("#brieftext");
const labelField = document.querySelector("#etikett");
const revealField = document.querySelector("#etikett-offen");
const passphraseField = document.querySelector("#passphrase");
const cipherField = document.querySelector("#geheimtext");
const openPassphraseField = document.querySelector("#passphrase-oeffnen");
const openedSheet = document.querySelector("#geoeffnet");
const openedLabel = document.querySelector("#geoeffnet-etikett");
const notice = document.querySelector("#meldung");
const openNotice = document.querySelector("#meldung-offen");
const sealButton = writeForm.querySelector(".seal");
const stamp = document.querySelector("#stempel");
const openScene = document.querySelector("#offen-bild");

function say(target, message, isError) {
  target.textContent = message;
  target.classList.toggle("is-error", Boolean(isError));
}

function replay(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function clearOpened() {
  openedSheet.textContent = "";
  openedSheet.classList.remove("is-revealed");
  openedLabel.textContent = "";
  openScene.hidden = true;
  openScene.classList.remove("is-playing");
  say(openNotice, "", false);
}

writeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  replay(sealButton, "is-pressing");
  clearOpened();
  try {
    const sealed = await sealLetter({
      body: bodyField.value,
      passphrase: passphraseField.value,
      label: labelField.value,
      revealLabel: revealField.checked,
    });
    cipherField.value = JSON.stringify(sealed, null, 2);
    openPassphraseField.value = "";
    openPassphraseField.classList.remove("is-shaken");
    stamp.hidden = false;
    replay(stamp, "is-stamped");
    say(notice, "Der Brief ist versiegelt. Die Passphrase steht nicht im Geheimtext und hat diese Seite nicht verlassen.", false);
    cipherField.focus();
  } catch (error) {
    cipherField.value = "";
    stamp.hidden = true;
    stamp.classList.remove("is-stamped");
    say(notice, error instanceof Error ? error.message : "Der Brief ließ sich nicht versiegeln.", true);
  }
});

document.querySelector("#satz-erzeugen").addEventListener("click", () => {
  passphraseField.value = makePassphrase();
  passphraseField.focus();
  say(notice, "Sag diesen Satz auf einem anderen Weg weiter. Er wird nicht mit dem Brief gespeichert.", false);
});

document.querySelector("#satz-kopieren").addEventListener("click", async () => {
  const phrase = passphraseField.value;
  if (!phrase) {
    say(notice, "Es gibt noch keinen Satz zum Weitergeben.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(phrase);
    say(notice, "Der Satz liegt in der Zwischenablage. Er wird nicht mit dem Brief abgeschickt.", false);
  } catch {
    passphraseField.select();
    say(notice, "Die Zwischenablage hat den Satz nicht genommen. Er ist im Feld markiert.", true);
  }
});

openForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearOpened();
  let sealed;
  try {
    sealed = JSON.parse(cipherField.value);
  } catch {
    say(openNotice, "Der Geheimtext ist kein Brief.", true);
    return;
  }
  try {
    const opened = await openLetter(sealed, openPassphraseField.value);
    openedSheet.textContent = opened.body;
    openedLabel.textContent = opened.label ? `Etikett: ${opened.label}` : "Kein offenes Etikett.";
    openScene.hidden = false;
    replay(openScene, "is-playing");
    replay(openedSheet, "is-revealed");
    say(openNotice, "Der Brief ist offen.", false);
    openedSheet.focus();
  } catch (error) {
    replay(openPassphraseField, "is-shaken");
    say(openNotice, error instanceof Error ? error.message : "Der Brief bleibt zu.", true);
  }
});
