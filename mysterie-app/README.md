# Mysterie-app

Een gratis detectivespel voor volwassenen. Je lost de zaak op door de telefoon
van het slachtoffer te doorzoeken: berichten, foto's, mail, agenda,
gezondheidsdata, beveiligingslogs en meer.

## Zaken

- **Zaak #001 · De Reiger** (`index.html`): een galeriehouder dood onder aan zijn trap in Haarlem.
- **Zaak #002 · Hoogwater** (`zaak-002.html`): een journalist verdronken bij de Nolledijk in Vlissingen. Iedereen denkt aan zelfmoord.

## Spelen

Open `index.html` of `zaak-002.html` in een browser, op desktop of telefoon. Er is geen server of
installatie nodig. Je voortgang wordt bewaard in je browser (localStorage).

## Hoe het werkt

- **Vergrendelscherm**: vind de pincode in de achtergrondfoto. Zoom in op het bordje.
- **Apps**: Berichten, Telefoon, Mail, Agenda, Foto's (met *Recent verwijderd*),
  Gezondheid, Beveiliging, Kiekje, Vind, Notities, Memo's en Instellingen.
- **📌 Vastpinnen**: verzamel bewijs uit berichten, foto's en logregels.
- **Dossier**: vijf opdrachten die na elkaar opengaan, en daarna het eindrapport
  (wie, hoe en waarom, onderbouwd met 3 gepinde bewijzen).
- **Score**: je begint met 100. Een fout antwoord kost 5, een hint 10, een fout
  "hoe" of "waarom" 15 en zwak bewijs 5. Je kunt het resultaat delen zonder spoilers.

## Bestanden

- `game.html` en `zaak002.html`: de bron van zaak #001 en #002 (elk één bestand, zonder `<html>`/`<head>`-wrapper).
- `index.html` en `zaak-002.html`: de zelfstandige versies, gegenereerd met `node build.js`.
- `build.js`: zet de bronbestanden om naar zelfstandige pagina's.

Pas een zaak aan in het bronbestand en draai daarna `node build.js`.
