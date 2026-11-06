# Mysterie-app: Zaak #001 "De Reiger"

Een gratis detectivespel voor volwassenen. Je lost de zaak op door de telefoon
van het slachtoffer te doorzoeken: berichten, foto's, mail, agenda,
gezondheidsdata, beveiligingslogs en meer.

## Spelen

Open `index.html` in een browser, op desktop of telefoon. Er is geen server of
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

- `game.html`: de bron van het spel (één bestand, zonder `<html>`/`<head>`-wrapper).
- `index.html`: de zelfstandige versie, gegenereerd met `node build.js`.
- `build.js`: zet `game.html` om naar `index.html`.

Pas het spel aan in `game.html` en draai daarna `node build.js`.
