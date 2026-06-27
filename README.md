# Persoonlijk Beleggings-Meldingssysteem

Nederlandstalig systeem voor het bijhouden van lange-termijn ETF's en een korte-termijn watchlist, met proactieve meldingen via je iPhone. Volledig gratis, geen eigen server nodig.

---

## Inhoud

- [Snelstart](#snelstart)
- [iPhone instellen — ntfy-app](#iphone-instellen--ntfy-app)
- [Holdings invullen](#holdings-invullen)
- [Watchlist bijwerken](#watchlist-bijwerken)
- [GitHub Secret instellen](#github-secret-instellen-ntfy_topic)
- [Budget & instellingen](#budget--instellingen)
- [Hoe de meldingen werken](#hoe-de-meldingen-werken)
- [Spreidingsregels](#spreidingsregels)
- [Signalen uitgelegd](#signalen-uitgelegd)
- [Kosten GitHub Actions](#kosten-github-actions)
- [Veiligheid](#veiligheid)
- [Bestandsoverzicht](#bestandsoverzicht)

---

## Snelstart

1. **Fork of kloon** deze repository als *privé* repo op je eigen GitHub-account.
2. Stel het GitHub Secret `NTFY_TOPIC` in (zie hieronder).
3. Installeer de ntfy-app op je iPhone (zie hieronder).
4. Vul `data/holdings.json` in met jouw ETF-gegevens.
5. Actions starten automatisch — eerste melding komt bij de volgende geplande run.

---

## iPhone instellen — ntfy-app

### Stap 1 — App installeren

1. Open de **App Store** op je iPhone.
2. Zoek naar **"ntfy"**.
3. Installeer de gratis app van **Philipp Heckel** (officieel: `ntfy.sh`).

### Stap 2 — Privé topic aanmaken

Een "topic" is jouw persoonlijke meldingskanaal. Kies een **moeilijk te raden naam** — dit werkt als een wachtwoord, want iedereen die de naam kent, kan berichten sturen.

**Goed voorbeeld:** `beleggingen-jan-de-vries-xk9f3q`  
**Slecht voorbeeld:** `beleggingen` (te makkelijk te raden)

Schrijf je gekozen topicnaam ergens op.

### Stap 3 — Abonneren in de app

1. Open de ntfy-app.
2. Tik op **"+"** (rechtsboven).
3. Voer jouw topicnaam in bij "Topic name".
4. Laat de server op `https://ntfy.sh` staan.
5. Tik op **"Subscribe"**.

Je ontvangt nu meldingen zodra het systeem iets stuurt.

### Stap 4 — Meldingen toestaan

Zorg dat iPhone-meldingen voor de ntfy-app zijn ingeschakeld:  
**Instellingen → Notificaties → ntfy → Zet aan**

---

## GitHub Secret instellen (NTFY_TOPIC)

De topicnaam wordt **nooit in de code** opgeslagen. Hij wordt beveiligd als GitHub Actions secret.

1. Ga naar jouw privé repository op GitHub.
2. Klik op **Settings → Secrets and variables → Actions**.
3. Klik op **"New repository secret"**.
4. Naam: `NTFY_TOPIC`
5. Waarde: jouw gekozen topicnaam (bv. `beleggingen-jan-de-vries-xk9f3q`)
6. Klik **"Add secret"**.

---

## Holdings invullen

Bewerk `data/holdings.json` via de GitHub-app op iPhone of via de webinterface:

```json
{
  "etfs": [
    {
      "naam": "SPDR MSCI World UCITS ETF (Acc)",
      "ticker": "SWRD.AS",
      "beurs": "Euronext Amsterdam",
      "eenheden": 25,
      "totaal_geïnvesteerd_eur": 1875.00,
      "aankoopdatum": "2023-03-15"
    },
    {
      "naam": "Vanguard FTSE All-World UCITS ETF (Acc)",
      "ticker": "VWCE.AS",
      "beurs": "Euronext Amsterdam",
      "eenheden": 10,
      "totaal_geïnvesteerd_eur": 3200.00,
      "aankoopdatum": "2022-11-01"
    }
  ]
}
```

**Tickercodes:**

| ETF | Euronext Amsterdam | Xetra |
|-----|-------------------|-------|
| SPDR MSCI World | `SWRD.AS` | `SWRD.DE` |
| Vanguard FTSE All-World | `VWCE.AS` | `VWCE.DE` |

Kies consistent één beurs. Euronext Amsterdam (.AS) is aanbevolen voor Belgische/Nederlandse beleggers.

---

## Watchlist bijwerken

Bewerk `data/watchlist.json` om posities toe te voegen:

```json
{
  "posities": [
    {
      "ticker": "ASML.AS",
      "naam": "ASML Holding",
      "beurs": "Euronext Amsterdam",
      "sector": "Technologie",
      "regio": "Europa",
      "aankoopdatum": "2024-06-01",
      "aankooprijs_eur": 750.00,
      "aantal": 2,
      "stop_loss_eur": 650.00
    }
  ]
}
```

**Ticker-suffixen:**
- `.AS` → Euronext Amsterdam
- `.DE` → Xetra (Frankfurt)
- Geen suffix → NYSE of NASDAQ (bv. `AAPL`, `MSFT`)

---

## Budget & instellingen

Bewerk `data/instellingen.json`:

```json
{
  "korte_termijn": {
    "totaal_budget_eur": 5000,
    "max_per_positie_pct": 5,
    "max_risico_per_trade_pct": 2
  }
}
```

| Instelling | Betekenis | Standaard |
|-----------|-----------|-----------|
| `totaal_budget_eur` | Totaal korte-termijn handelsbudget | 0 (€0 = inactief) |
| `max_per_positie_pct` | Max % van budget per positie | 5% |
| `max_risico_per_trade_pct` | Max % budget risico per trade | 2% |

---

## Hoe de meldingen werken

### Korte-termijn check (elke 2 uur, weekdagen)

Tijden: 09:00, 11:00, 13:00, 15:00, 17:00 Amsterdam-tijd  
Het script controleert zelf of het beurstijd is en slaat anders over.

Inhoud van een melding:
- Risicocontext (VIX-niveau + nieuwskoppen bij verhoogde spanning)
- Koop- of verkoopsignalen (met exacte cijfers)
- Spreidingswaarschuwingen (alleen bij overschrijding)

Bij de **laatste check van de dag** (~17:00):
- Dagafsluiting: totale winst/verlies watchlist in EUR en %

### Wekelijkse samenvatting (vrijdag 17:30)

- Huidige ETF-waarden, weekrendement, totaalrendement
- Drawdown-waarschuwing bij -15% vanaf piekwaarde
- Volledige spreidingsanalyse
- Repo-grootte

---

## Spreidingsregels

Het systeem gebruikt **algemeen aanvaarde vuistregels** (geen persoonlijk financieel advies):

| Regel | Drempel | Actie |
|-------|---------|-------|
| Eén positie aandachtspunt | >= 15% van portfolio | Melding |
| Eén positie probleem | >= 30% van portfolio | Melding met afbouwadvies |
| Eén sector | > 20% van portfolio | Melding |
| Regio-concentratie | VS-overgewicht via ETF is normaal | Alleen melden als watchlist-posities extra zwaar wegen |
| ETF-overlap MSCI/FTSE | Informatief | Geen actie — bewuste keuze |
| LT/KT-verhouding | Informatief | Geen oordeel — persoonlijke keuze |

---

## Signalen uitgelegd

### Koopsignaal
- **Voorwaarde:** RSI < 30 EN prijs boven 50-daags gemiddelde
- **Betekenis:** Technisch oversold maar in een opwaartse trend
- **Melding toont:** RSI-waarde, prijs, 50d MA, suggestie aantal aandelen, tradebedrag, stop-loss

### Verkoopsignaal
- **Voorwaarde:** RSI > 70 EN prijs onder 20-daags gemiddelde
- **Betekenis:** Technisch overbought en begint te dalen

### VIX-waarschuwing
- **Boven 20d gemiddelde of >20:** Let op verhoogde spanning
- **Boven 30:** Hoge marktspanning

### Bolero-kostencheck
Automatisch bij elk koopsignaal:
- t.e.m. 250 EUR: 2,50 EUR commissie
- 250,01–1.000 EUR: 5,00 EUR
- 1.000,01–2.500 EUR: 7,50 EUR
- Waarschuwing als commissie > ~1,5% van tradebedrag

---

## Kosten GitHub Actions

| Run-type | Frequentie | Duur | Minuten/maand |
|----------|-----------|------|--------------|
| Korte-termijn check | 6 x per dag x 5 dagen x 4 weken | ~3 min | ~360 min |
| Wekelijkse samenvatting | 4 x per maand | ~5 min | ~20 min |
| **Totaal** | | | **~380 min** |

**Gratis limiet privé repos: 2.000 min/maand** — gebruik ~19% van het gratis budget.

> **Belangrijk:** Stel de uitgavenlimiet in op **$0** in GitHub-instellingen om te voorkomen dat overschrijding wordt gefactureerd:  
> **Settings → Billing → Spending limits → Actions → $0**

---

## Veiligheid

- Repo is **privé** — alleen jij hebt toegang.
- `NTFY_TOPIC` is **nooit** hardcoded in de code — altijd via GitHub Actions secret.
- Het ntfy-topic werkt als wachtwoord: kies een lange, willekeurige naam.
- Er worden geen API-keys of persoonlijke gegevens opgeslagen.

---

## Bestandsoverzicht

```
├── beleggingen.py                      Hoofdscript
├── dashboard.html                      Mobiele webinterface
├── requirements.txt                    Python-afhankelijkheden
├── data/
│   ├── holdings.json                   ETF-posities (jij bewerkt dit)
│   ├── watchlist.json                  Korte-termijn posities (jij bewerkt dit)
│   └── instellingen.json               Budget, limieten, RSS-feeds
├── logs/
│   └── signalen_logboek.json           Compact signaallogboek (automatisch)
└── .github/workflows/
    ├── korte_termijn_check.yml         Elke 2 uur op weekdagen
    └── wekelijkse_samenvatting.yml     Elke vrijdag
```

---

*Dit zijn regelgebaseerde signalen, geen financieel advies. Gebaseerd op algemeen aanvaarde vuistregels uit portefeuilletheorie — drempels zijn richtlijnen, niet universele wetten.*
