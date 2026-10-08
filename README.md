# vakfijn-site

Statische site van Vakfijn (kitwerk, schilderwerk, timmerwerk, isolatie). Geen build-stap: HTML + CSS + JS, gehost op Vercel.

## Invullen voor livegang
Zoek en vervang in alle .html-bestanden:
- `WA_NUMMER` → WhatsApp-nummer in internationaal formaat zonder + of spaties (bijv. 31612345678)
- `WA_WEERGAVE` → nummer zoals het getoond wordt (bijv. 06 12 34 56 78)
- `MAIL_ADRES` → e-mailadres
- `WEB3FORMS_KEY` → access key van web3forms.com (formulieren mailen daarheen)

## Kit-calculator
Tarieven staan bovenin `site.js` (object `T`).

## Livegang (vakfijn.nl)
1. Vercel → Add New Project → importeer `vakfijn/vakfijn-site` (geen build-instellingen nodig).
2. Vercel → Settings → Domains → voeg `vakfijn.nl` en `www.vakfijn.nl` toe (www doorsturen naar vakfijn.nl).
3. Squarespace → Domeinen → DNS: alleen de A-record (@) en CNAME (www) aanpassen naar de waarden die Vercel toont. **MX- en TXT-records van e-mail niet aanraken.**
4. `WEB3FORMS_KEY` vervangen in index, timmerwerk en isolatie.
5. Google Search Console: domein verifiëren, `https://vakfijn.nl/sitemap.xml` indienen.
6. Google Bedrijfsprofiel: website-link controleren.

Oude URL's (team, renovatie, badkamerrenovatie, privacybeleid, …) worden via `vercel.json` met een 301 doorgestuurd.
