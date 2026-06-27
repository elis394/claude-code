#!/usr/bin/env python3
"""
Persoonlijk beleggings-meldingssysteem — Nederlandstalige output, bedragen in EUR.
Regelgebaseerde signalen, geen financieel advies.
"""

import json
import os
import sys
import math
import subprocess
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, date
from pathlib import Path
from zoneinfo import ZoneInfo

# ---------------------------------------------------------------------------
# Constanten & paden
# ---------------------------------------------------------------------------
BASIS_DIR = Path(__file__).parent
DATA_DIR = BASIS_DIR / "data"
LOGS_DIR = BASIS_DIR / "logs"
HOLDINGS_PAD = DATA_DIR / "holdings.json"
WATCHLIST_PAD = DATA_DIR / "watchlist.json"
INSTELLINGEN_PAD = DATA_DIR / "instellingen.json"
LOGBOEK_PAD = LOGS_DIR / "signalen_logboek.json"

AMSTERDAM = ZoneInfo("Europe/Amsterdam")
DISCLAIMER = "Dit zijn regelgebaseerde signalen, geen financieel advies."
SPREIDING_DISCLAIMER = (
    "Gebaseerd op algemeen aanvaarde vuistregels uit portefeuilletheorie, "
    "geen persoonlijk financieel advies — drempels zijn richtlijnen, niet universele wetten."
)

# ---------------------------------------------------------------------------
# Hulpfuncties: laden / opslaan
# ---------------------------------------------------------------------------

def laad_json(pad: Path) -> dict | list:
    with open(pad, encoding="utf-8") as f:
        return json.load(f)

def sla_json_op(pad: Path, data: dict | list) -> None:
    with open(pad, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def nu_amsterdam() -> datetime:
    return datetime.now(AMSTERDAM)

def is_beursdag() -> bool:
    return nu_amsterdam().weekday() < 5  # ma=0 … vr=4

def is_beurstijd() -> bool:
    """Euronext Amsterdam: 09:00–17:35."""
    nu = nu_amsterdam()
    if not is_beursdag():
        return False
    return nu.replace(hour=9, minute=0, second=0, microsecond=0) <= nu <= \
           nu.replace(hour=17, minute=35, second=0, microsecond=0)

def is_vrijdag() -> bool:
    return nu_amsterdam().weekday() == 4

def is_laatste_check_van_dag() -> bool:
    """Laatste 2-uurlijkse check vóór marktsluit (~15:xx of 17:xx run)."""
    nu = nu_amsterdam()
    return nu.hour >= 15 and is_beurstijd()

def eur_str(bedrag: float) -> str:
    return f"€{bedrag:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def pct_str(pct: float) -> str:
    teken = "+" if pct >= 0 else ""
    return f"{teken}{pct:.2f}%".replace(".", ",")

_NL_DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]
_NL_MAANDEN = ["", "januari", "februari", "maart", "april", "mei", "juni",
                "juli", "augustus", "september", "oktober", "november", "december"]

def datum_nl(dt: datetime) -> str:
    return f"{_NL_DAGEN[dt.weekday()]} {dt.day} {_NL_MAANDEN[dt.month]} {dt.year}"

def repo_grootte() -> str:
    try:
        result = subprocess.run(
            ["du", "-sh", str(BASIS_DIR)],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.split()[0] if result.stdout else "onbekend"
    except Exception:
        return "onbekend"

# ---------------------------------------------------------------------------
# yfinance wrapper (zonder import — via subprocess indien nodig)
# ---------------------------------------------------------------------------

def haal_koers_op(ticker: str) -> dict | None:
    """Haal koers, volume en historische data op via yfinance."""
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info
        hist = t.history(period="60d")
        if hist.empty:
            return None
        sluitkoers = float(hist["Close"].iloc[-1])
        vorige = float(hist["Close"].iloc[-2]) if len(hist) > 1 else sluitkoers
        valuta = info.get("currency", "EUR")
        wisselkoers = _haal_wisselkoers(valuta)
        sluitkoers_eur = sluitkoers * wisselkoers
        vorige_eur = vorige * wisselkoers
        volume = float(hist["Volume"].iloc[-1])
        gem_volume = float(hist["Volume"].tail(20).mean()) if len(hist) >= 20 else volume
        pct_dag = ((sluitkoers - vorige) / vorige * 100) if vorige else 0
        ma20 = float(hist["Close"].tail(20).mean()) if len(hist) >= 20 else sluitkoers
        ma50 = float(hist["Close"].tail(50).mean()) if len(hist) >= 50 else sluitkoers
        rsi = bereken_rsi(hist["Close"])
        piek = float(hist["Close"].max())
        return {
            "ticker": ticker,
            "prijs_eur": sluitkoers_eur,
            "prijs_orig": sluitkoers,
            "valuta": valuta,
            "wisselkoers": wisselkoers,
            "vorige_eur": vorige_eur,
            "pct_dag": pct_dag,
            "volume": volume,
            "gem_volume": gem_volume,
            "volume_ratio": volume / gem_volume if gem_volume else 1.0,
            "ma20_eur": ma20 * wisselkoers,
            "ma50_eur": ma50 * wisselkoers,
            "rsi": rsi,
            "piek_eur": piek * wisselkoers,
            "naam": info.get("longName", ticker),
            "sector": info.get("sector", "Onbekend"),
            "land": info.get("country", "Onbekend"),
        }
    except Exception as e:
        print(f"  Fout bij ophalen koers {ticker}: {e}", file=sys.stderr)
        return None

def _haal_wisselkoers(valuta: str) -> float:
    """Haal EUR wisselkoers op. Retourneert 1.0 als valuta al EUR is."""
    if valuta.upper() == "EUR":
        return 1.0
    try:
        import yfinance as yf
        paar = f"{valuta}EUR=X"
        t = yf.Ticker(paar)
        hist = t.history(period="2d")
        if not hist.empty:
            return float(hist["Close"].iloc[-1])
    except Exception:
        pass
    # Fallback: ruwe schatting USD→EUR
    return 0.92

def bereken_rsi(series, perioden: int = 14) -> float:
    """Berekent RSI over de laatste 'perioden' handelsdagen."""
    if len(series) < perioden + 1:
        return 50.0
    delta = series.diff().dropna()
    winst = delta.clip(lower=0)
    verlies = -delta.clip(upper=0)
    gem_winst = winst.tail(perioden).mean()
    gem_verlies = verlies.tail(perioden).mean()
    if gem_verlies == 0:
        return 100.0
    rs = gem_winst / gem_verlies
    return 100 - (100 / (1 + rs))

def haal_vix_op() -> dict | None:
    """Haal VIX-data op."""
    try:
        import yfinance as yf
        t = yf.Ticker("^VIX")
        hist = t.history(period="30d")
        if hist.empty:
            return None
        huidig = float(hist["Close"].iloc[-1])
        ma20 = float(hist["Close"].tail(20).mean()) if len(hist) >= 20 else huidig
        return {"huidig": huidig, "ma20": ma20}
    except Exception:
        return None

# ---------------------------------------------------------------------------
# ETF — lange termijn
# ---------------------------------------------------------------------------

def bereken_etf_prestaties(etf: dict, koers: dict) -> dict:
    eenheden = etf.get("eenheden", 0)
    geïnvesteerd = etf.get("totaal_geïnvesteerd_eur", 0)
    huidige_waarde = eenheden * koers["prijs_eur"]
    rendement_eur = huidige_waarde - geïnvesteerd
    rendement_pct = (rendement_eur / geïnvesteerd * 100) if geïnvesteerd else 0
    week_winst_eur = eenheden * (koers["prijs_eur"] - koers["vorige_eur"]) * 5  # benadering week
    week_pct = (week_winst_eur / (huidige_waarde - week_winst_eur) * 100) if (huidige_waarde - week_winst_eur) else 0
    piek_waarde = eenheden * koers["piek_eur"]
    drawdown_pct = ((huidige_waarde - piek_waarde) / piek_waarde * 100) if piek_waarde else 0
    return {
        "naam": etf["naam"],
        "ticker": etf["ticker"],
        "eenheden": eenheden,
        "geïnvesteerd": geïnvesteerd,
        "huidige_waarde": huidige_waarde,
        "rendement_eur": rendement_eur,
        "rendement_pct": rendement_pct,
        "week_winst_eur": week_winst_eur,
        "week_pct": week_pct,
        "piek_waarde": piek_waarde,
        "drawdown_pct": drawdown_pct,
    }

def wekelijkse_etf_samenvatting(holdings: dict, instellingen: dict) -> list[str]:
    drempel = instellingen["lange_termijn"]["drawdown_waarschuwing_pct"]
    regels = ["📊 *WEKELIJKSE ETF-SAMENVATTING*", f"Datum: {datum_nl(nu_amsterdam())}"]
    totaal_waarde = 0
    totaal_geïnvesteerd = 0
    waarschuwingen = []
    for etf in holdings.get("etfs", []):
        if etf.get("eenheden", 0) == 0:
            regels.append(f"\n⚠️ {etf['naam']}: nog geen eenheden ingevuld.")
            continue
        koers = haal_koers_op(etf["ticker"])
        if not koers:
            regels.append(f"\n❌ {etf['naam']}: koers niet beschikbaar.")
            continue
        p = bereken_etf_prestaties(etf, koers)
        totaal_waarde += p["huidige_waarde"]
        totaal_geïnvesteerd += p["geïnvesteerd"]
        regels.append(
            f"\n{p['naam']} ({p['ticker']})\n"
            f"  Koers: {eur_str(koers['prijs_eur'])} | Eenheden: {p['eenheden']}\n"
            f"  Huidige waarde: {eur_str(p['huidige_waarde'])}\n"
            f"  Week: {eur_str(p['week_winst_eur'])} ({pct_str(p['week_pct'])})\n"
            f"  Totaalrendement: {eur_str(p['rendement_eur'])} ({pct_str(p['rendement_pct'])})"
        )
        if p["drawdown_pct"] <= drempel:
            waarschuwingen.append(
                f"  ⚠️ DRAWDOWN: {p['naam']} staat {pct_str(p['drawdown_pct'])} "
                f"onder piekwaarde ({eur_str(p['piek_waarde'])}) — herbekijken, geen paniek."
            )
    if totaal_geïnvesteerd > 0:
        totaal_rendement = totaal_waarde - totaal_geïnvesteerd
        totaal_pct = (totaal_rendement / totaal_geïnvesteerd * 100)
        regels.append(
            f"\n💼 TOTAAL PORTFOLIO\n"
            f"  Waarde: {eur_str(totaal_waarde)}\n"
            f"  Rendement: {eur_str(totaal_rendement)} ({pct_str(totaal_pct)})"
        )
    if waarschuwingen:
        regels.append("\n⚠️ WAARSCHUWINGEN:")
        regels.extend(waarschuwingen)
    regels.append(f"\n📁 Repo-grootte: {repo_grootte()}")
    return regels

# ---------------------------------------------------------------------------
# Spreidingsanalyse
# ---------------------------------------------------------------------------

def analyseer_spreiding(holdings: dict, watchlist: dict, instellingen: dict) -> list[str]:
    """Controleert spreiding en geeft concrete instructies bij overschrijding."""
    sp = instellingen["spreiding"]
    max_pos_aandacht = sp["max_per_positie_aandacht_pct"]
    max_pos_probleem = sp["max_per_positie_probleem_pct"]
    max_sector = sp["max_per_sector_pct"]
    regels = []
    actiepunten = []

    # Bouw volledige portefeuille op
    posities = {}
    sectoren = {}
    totaal_waarde = 0.0

    # ETF's
    for etf in holdings.get("etfs", []):
        if etf.get("eenheden", 0) == 0:
            continue
        koers = haal_koers_op(etf["ticker"])
        if not koers:
            continue
        waarde = etf["eenheden"] * koers["prijs_eur"]
        totaal_waarde += waarde
        posities[etf["naam"]] = {"waarde": waarde, "sector": "ETF (Gediversifieerd)", "regio": "Wereldwijd"}
        sectoren["ETF (Gediversifieerd)"] = sectoren.get("ETF (Gediversifieerd)", 0) + waarde

    # Watchlist-posities
    for pos in watchlist.get("posities", []):
        koers = haal_koers_op(pos["ticker"])
        if not koers:
            continue
        waarde = pos.get("aantal", 0) * koers["prijs_eur"]
        totaal_waarde += waarde
        naam = pos.get("naam", pos["ticker"])
        sector = pos.get("sector", koers.get("sector", "Onbekend"))
        regio = pos.get("regio", koers.get("land", "Onbekend"))
        posities[naam] = {"waarde": waarde, "sector": sector, "regio": regio}
        sectoren[sector] = sectoren.get(sector, 0) + waarde

    if totaal_waarde == 0:
        return ["ℹ️ Spreiding: nog geen posities ingevuld."]

    # Check individuele positiegrootte
    for naam, data in posities.items():
        if "ETF" in naam:
            continue  # ETF's overslaan voor individuele check
        pct = (data["waarde"] / totaal_waarde) * 100
        if pct >= max_pos_probleem:
            actiepunten.append(
                f"🔴 Te zwaar gewicht in {naam} ({pct_str(pct)}) — "
                f"overweeg af te bouwen richting onder {max_pos_aandacht}%."
            )
        elif pct >= max_pos_aandacht:
            actiepunten.append(
                f"🟡 Aandachtspunt: {naam} ({pct_str(pct)}) — "
                f"nadert bovengrens van {max_pos_probleem}%. Bewaken."
            )

    # Check sectorspreiding (alleen niet-ETF sectoren)
    for sector, waarde in sectoren.items():
        if sector == "ETF (Gediversifieerd)":
            continue
        pct = (waarde / totaal_waarde) * 100
        if pct > max_sector:
            actiepunten.append(
                f"🟡 Sector '{sector}' weegt {pct_str(pct)} — "
                f"vuistregel is max ~{max_sector}%. Overweeg spreiding over andere sectoren."
            )

    # Overlap ETF's — informatief
    etf_namen = [e["naam"] for e in holdings.get("etfs", []) if e.get("eenheden", 0) > 0]
    if len(etf_namen) == 2:
        regels.append(
            f"ℹ️ ETF-overlap: {etf_namen[0]} en {etf_namen[1]} overlappen bewust "
            f"(MSCI World zit in FTSE All-World) — geen actiepunt, bewuste keuze."
        )

    # Verhouding LT vs KT
    lt_waarde = sum(d["waarde"] for n, d in posities.items() if "ETF" in n)
    kt_waarde = totaal_waarde - lt_waarde
    lt_pct = (lt_waarde / totaal_waarde * 100) if totaal_waarde else 0
    kt_pct = (kt_waarde / totaal_waarde * 100) if totaal_waarde else 0
    regels.append(
        f"📊 Verhouding LT/KT: "
        f"Lange termijn (ETF's) {pct_str(lt_pct)} ({eur_str(lt_waarde)}) | "
        f"Korte termijn {pct_str(kt_pct)} ({eur_str(kt_waarde)}) — persoonlijke keuze."
    )

    if actiepunten:
        regels.insert(0, "⚠️ SPREIDINGSADVIES:")
        regels[1:1] = actiepunten
    else:
        regels.append("✅ Spreiding ziet er in orde uit op basis van de vuistregels.")

    regels.append(f"\n{SPREIDING_DISCLAIMER}")
    return regels

# ---------------------------------------------------------------------------
# Bolero kostentcheck
# ---------------------------------------------------------------------------

def bolero_kost(bedrag_eur: float, instellingen: dict) -> float:
    t = instellingen["bolero_tarieven"]
    if bedrag_eur <= t["schijf_1_max_eur"]:
        return t["schijf_1_kost_eur"]
    elif bedrag_eur <= t["schijf_2_max_eur"]:
        return t["schijf_2_kost_eur"]
    elif bedrag_eur <= t["schijf_3_max_eur"]:
        return t["schijf_3_kost_eur"]
    return t["schijf_3_kost_eur"]

def check_kostenefficiëntie(bedrag_eur: float, instellingen: dict) -> str | None:
    kost = bolero_kost(bedrag_eur, instellingen)
    kost_pct = (kost / bedrag_eur * 100) if bedrag_eur else 0
    drempel = instellingen["bolero_tarieven"]["max_kost_pct_waarschuwing"]
    if kost_pct > drempel:
        return (
            f"⚠️ Bolero-kosten: {eur_str(kost)} op {eur_str(bedrag_eur)} "
            f"= {pct_str(kost_pct)} — hoger dan {drempel}% richtlijn. "
            f"Overweeg groter tradebedrag."
        )
    return None

# ---------------------------------------------------------------------------
# Signaalmotor — watchlist
# ---------------------------------------------------------------------------

def controleer_signalen(watchlist: dict, instellingen: dict) -> tuple[list[str], list[dict]]:
    """Controleert alle watchlist-tickers op koop/verkoop-signalen."""
    inst = instellingen
    budget = inst["korte_termijn"]["totaal_budget_eur"]
    max_per_pos_pct = inst["korte_termijn"]["max_per_positie_pct"]
    max_risico_pct = inst["korte_termijn"]["max_risico_per_trade_pct"]
    meldingen = []
    nieuwe_signalen = []

    benut_budget = sum(
        p.get("aantal", 0) * (p.get("aankooprijs_eur", 0))
        for p in watchlist.get("posities", [])
    )
    resterend_budget = budget - benut_budget

    if budget <= 0:
        meldingen.append("ℹ️ Korte-termijn budget: €0 (nog niet ingesteld in instellingen.json).")
        return meldingen, nieuwe_signalen

    if resterend_budget <= 0:
        meldingen.append("⛔ Korte-termijn budget is volledig benut — geen nieuwe koopsignalen.")

    for pos in watchlist.get("posities", []):
        ticker = pos["ticker"]
        naam = pos.get("naam", ticker)
        koers = haal_koers_op(ticker)
        if not koers:
            continue

        prijs = koers["prijs_eur"]
        rsi = koers["rsi"]
        ma20 = koers["ma20_eur"]
        ma50 = koers["ma50_eur"]
        pct_dag = koers["pct_dag"]
        vol_ratio = koers["volume_ratio"]

        # Koopsignaal
        if rsi < 30 and prijs > ma50:
            if resterend_budget > 0:
                max_pos = budget * max_per_pos_pct / 100
                risico_bedrag = budget * max_risico_pct / 100
                stop_loss = pos.get("stop_loss_eur", prijs * 0.95)
                risico_per_aandeel = prijs - stop_loss
                aantal = int(risico_bedrag / risico_per_aandeel) if risico_per_aandeel > 0 else 0
                tradebedrag = aantal * prijs
                tradebedrag = min(tradebedrag, max_pos)

                signaal_tekst = (
                    f"🟢 KOOPSIGNAAL {naam} ({ticker})\n"
                    f"  Prijs: {eur_str(prijs)} | RSI: {rsi:.1f} (<30) | "
                    f"Boven 50d MA ({eur_str(ma50)})\n"
                    f"  Reden: RSI oversold + prijs boven trend\n"
                    f"  Suggestie: {aantal} aandelen à {eur_str(prijs)} = {eur_str(tradebedrag)}\n"
                    f"  Stop-loss: {eur_str(stop_loss)} | Volume: {vol_ratio:.1f}x gemiddelde"
                )
                kost_check = check_kostenefficiëntie(tradebedrag, instellingen)
                if kost_check:
                    signaal_tekst += f"\n  {kost_check}"
                meldingen.append(signaal_tekst)
                nieuwe_signalen.append({
                    "datum": nu_amsterdam().isoformat(),
                    "ticker": ticker,
                    "signaal": "KOOP",
                    "prijs": prijs,
                    "rsi": rsi,
                    "reden": f"RSI {rsi:.1f} < 30, prijs {eur_str(prijs)} > 50d MA {eur_str(ma50)}"
                })

        # Verkoopsignaal
        if rsi > 70 and prijs < ma20:
            signaal_tekst = (
                f"🔴 VERKOOPSIGNAAL {naam} ({ticker})\n"
                f"  Prijs: {eur_str(prijs)} | RSI: {rsi:.1f} (>70) | "
                f"Onder 20d MA ({eur_str(ma20)})\n"
                f"  Reden: RSI overbought + prijs zakt onder korte trend"
            )
            meldingen.append(signaal_tekst)
            nieuwe_signalen.append({
                "datum": nu_amsterdam().isoformat(),
                "ticker": ticker,
                "signaal": "VERKOOP",
                "prijs": prijs,
                "rsi": rsi,
                "reden": f"RSI {rsi:.1f} > 70, prijs {eur_str(prijs)} < 20d MA {eur_str(ma20)}"
            })

    return meldingen, nieuwe_signalen

# ---------------------------------------------------------------------------
# Dagelijkse samenvatting watchlist
# ---------------------------------------------------------------------------

def dagelijkse_samenvatting(watchlist: dict) -> list[str]:
    totaal_winst = 0.0
    totaal_waarde_gister = 0.0
    regels = []
    for pos in watchlist.get("posities", []):
        koers = haal_koers_op(pos["ticker"])
        if not koers:
            continue
        aantal = pos.get("aantal", 0)
        winst_dag = aantal * (koers["prijs_eur"] - koers["vorige_eur"])
        waarde_gister = aantal * koers["vorige_eur"]
        totaal_winst += winst_dag
        totaal_waarde_gister += waarde_gister
        naam = pos.get("naam", pos["ticker"])
        regels.append(
            f"  {naam}: {pct_str(koers['pct_dag'])} ({eur_str(winst_dag)})"
        )
    totaal_pct = (totaal_winst / totaal_waarde_gister * 100) if totaal_waarde_gister else 0
    teken = "📈" if totaal_winst >= 0 else "📉"
    header = (
        f"{teken} DAGAFSLUITING WATCHLIST\n"
        f"  Totaal vandaag: {eur_str(totaal_winst)} ({pct_str(totaal_pct)})"
    )
    return [header] + regels

# ---------------------------------------------------------------------------
# VIX & nieuws-risicocontext
# ---------------------------------------------------------------------------

def analyseer_risicocontext(instellingen: dict) -> list[str]:
    regels = []
    vix_data = haal_vix_op()
    vix_melding = None
    if vix_data:
        v = vix_data["huidig"]
        ma = vix_data["ma20"]
        if v > instellingen["vix_drempel_waarschuwing"]:
            vix_melding = f"🚨 VIX HOOG: {v:.1f} (>30) — verhoogde marktspanning"
        elif v > instellingen["vix_drempel_let_op"] or v > ma:
            vix_melding = f"⚠️ VIX VERHOOGD: {v:.1f} (20d gem: {ma:.1f}) — let op"

    nieuws_koppen = haal_risico_nieuws(instellingen)

    if vix_melding or nieuws_koppen:
        regels.append("🌍 RISICO-CONTEXT")
        if vix_melding:
            regels.append(f"  {vix_melding}")
        for kop in nieuws_koppen[:2]:
            regels.append(f"  📰 {kop}")

    return regels

def haal_risico_nieuws(instellingen: dict) -> list[str]:
    filter_termen = [t.lower() for t in instellingen.get("nieuws_filter_termen", [])]
    zeven_dagen_geleden = datetime.now(AMSTERDAM) - timedelta(days=7)
    gevonden = []
    for feed_url in instellingen.get("rss_feeds", []):
        try:
            req = urllib.request.Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                inhoud = resp.read()
            root = ET.fromstring(inhoud)
            for item in root.iter("item"):
                titel = item.findtext("title", "")
                pub_date = item.findtext("pubDate", "")
                if any(term in titel.lower() for term in filter_termen):
                    gevonden.append(titel.strip())
                if len(gevonden) >= 6:
                    break
        except Exception:
            continue
    return gevonden[:2]

# ---------------------------------------------------------------------------
# Logboek beheer
# ---------------------------------------------------------------------------

def sla_signalen_op(nieuwe_signalen: list[dict]) -> None:
    logboek = laad_json(LOGBOEK_PAD)
    logboek["signalen"].extend(nieuwe_signalen)
    zes_maanden = datetime.now(AMSTERDAM) - timedelta(days=183)
    recente = []
    per_maand: dict[str, list] = {}
    for s in logboek["signalen"]:
        try:
            dt = datetime.fromisoformat(s["datum"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=AMSTERDAM)
        except Exception:
            recente.append(s)
            continue
        if dt >= zes_maanden:
            recente.append(s)
        else:
            sleutel = dt.strftime("%Y-%m")
            per_maand.setdefault(sleutel, []).append(s)
    for maand, signalen in per_maand.items():
        bestaand = next((m for m in logboek["maandoverzichten"] if m["maand"] == maand), None)
        if bestaand is None:
            koop = sum(1 for s in signalen if s.get("signaal") == "KOOP")
            verkoop = sum(1 for s in signalen if s.get("signaal") == "VERKOOP")
            logboek["maandoverzichten"].append({
                "maand": maand,
                "totaal_signalen": len(signalen),
                "koop": koop,
                "verkoop": verkoop,
            })
    logboek["signalen"] = recente
    sla_json_op(LOGBOEK_PAD, logboek)

def verwijder_oud_nieuws() -> None:
    pass  # Nieuws wordt niet opgeslagen; alleen live RSS ophalen

# ---------------------------------------------------------------------------
# ntfy.sh meldingen
# ---------------------------------------------------------------------------

def stuur_ntfy_melding(onderwerp: str, tekst: str, prioriteit: str = "default") -> bool:
    topic = os.environ.get("NTFY_TOPIC", "")
    if not topic:
        print("⚠️ NTFY_TOPIC niet ingesteld als omgevingsvariabele.", file=sys.stderr)
        return False
    url = f"https://ntfy.sh/{topic}"
    data = tekst.encode("utf-8")
    headers = {
        "Title": urllib.parse.quote(onderwerp),
        "Priority": prioriteit,
        "Tags": "chart_with_upwards_trend",
        "Content-Type": "text/plain; charset=utf-8",
    }
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"  ntfy-fout: {e}", file=sys.stderr)
        return False

def bundel_en_stuur(secties: list[str], onderwerp: str, prioriteit: str = "default") -> None:
    if not secties:
        return
    volledige_tekst = "\n\n".join(secties) + f"\n\n{DISCLAIMER}"
    print(f"\n{'='*60}")
    print(f"MELDING: {onderwerp}")
    print(volledige_tekst)
    print('='*60)
    stuur_ntfy_melding(onderwerp, volledige_tekst, prioriteit)

# ---------------------------------------------------------------------------
# Hoofdlogica
# ---------------------------------------------------------------------------

def run_korte_termijn_check():
    """Wordt elke 2 uur tijdens beurstijden uitgevoerd."""
    holdings = laad_json(HOLDINGS_PAD)
    watchlist = laad_json(WATCHLIST_PAD)
    instellingen = laad_json(INSTELLINGEN_PAD)

    meldingen = []
    nieuwe_signalen = []

    # Risicocontext (VIX + nieuws)
    risico = analyseer_risicocontext(instellingen)
    if risico:
        meldingen.extend(risico)

    # Watchlist-signalen
    signaal_meldingen, nieuwe = controleer_signalen(watchlist, instellingen)
    nieuwe_signalen.extend(nieuwe)
    meldingen.extend(signaal_meldingen)

    # Spreidingscheck (alleen bij statuswijziging — vereenvoudigd: altijd tonen)
    spreiding = analyseer_spreiding(holdings, watchlist, instellingen)
    actiepunten = [r for r in spreiding if "🔴" in r or "🟡" in r]
    if actiepunten:
        meldingen.extend(actiepunten)
        meldingen.append(SPREIDING_DISCLAIMER)

    # Dagelijkse samenvatting (enkel bij laatste check)
    if is_laatste_check_van_dag() and watchlist.get("posities"):
        dag_samen = dagelijkse_samenvatting(watchlist)
        bundel_en_stuur(dag_samen, "📉 Dagafsluiting beleggingen")

    if meldingen:
        prioriteit = "high" if any("🚨" in m or "🔴" in m for m in meldingen) else "default"
        bundel_en_stuur(meldingen, "📊 Beleggingsupdate", prioriteit)

    # Sla nieuwe signalen op
    if nieuwe_signalen:
        sla_signalen_op(nieuwe_signalen)

def run_wekelijkse_samenvatting():
    """Wordt elke vrijdag uitgevoerd."""
    holdings = laad_json(HOLDINGS_PAD)
    watchlist = laad_json(WATCHLIST_PAD)
    instellingen = laad_json(INSTELLINGEN_PAD)

    meldingen = []

    # ETF-samenvatting
    etf_samen = wekelijkse_etf_samenvatting(holdings, instellingen)
    meldingen.extend(etf_samen)

    # Volledige spreidingsanalyse
    spreiding = analyseer_spreiding(holdings, watchlist, instellingen)
    meldingen.append("\n📐 SPREIDINGSANALYSE")
    meldingen.extend(spreiding)

    bundel_en_stuur(meldingen, "📊 Wekelijkse beleggingssamenvatting", "default")

# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------

def main():
    modus = sys.argv[1] if len(sys.argv) > 1 else "kort"
    print(f"[{nu_amsterdam().isoformat()}] Modus: {modus} | Repo: {repo_grootte()}")

    if modus == "wekelijks":
        run_wekelijkse_samenvatting()
    elif modus == "kort":
        if not is_beursdag():
            print("Weekend — geen korte-termijn check.")
            return
        run_korte_termijn_check()
    else:
        print(f"Onbekende modus: {modus}. Gebruik 'kort' of 'wekelijks'.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
