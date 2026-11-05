// Maakt een agenda-afspraak (.ics) van een reservering — link staat in de reserveringsmail
function schoon(v, max) { return String(v || '').replace(/[\r\n]+/g, ' ').slice(0, max || 80); }
module.exports = (req, res) => {
  const q = req.query || {};
  const d = String(q.d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { res.status(400).send('ongeldige datum'); return; }
  const deel = q.deel === 'middag' ? 'middag' : 'ochtend';
  const [van, tot] = deel === 'middag' ? ['130000', '170000'] : ['080000', '123000'];
  const dag = d.replace(/-/g, '');
  const naam = schoon(q.naam), klus = schoon(q.klus), tel = schoon(q.tel, 20);
  const adres = schoon(q.adres), plaats = schoon(q.plaats);
  const spoed = q.spoed === 'ja' ? ' (SPOED)' : '';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vakfijn//planner//NL',
    'BEGIN:VTIMEZONE', 'TZID:Europe/Amsterdam',
    'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
    'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:' + dag + van + '-' + Math.random().toString(36).slice(2) + '@vakfijn-afwerking.nl',
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    'DTSTART;TZID=Europe/Amsterdam:' + dag + 'T' + van,
    'DTEND;TZID=Europe/Amsterdam:' + dag + 'T' + tot,
    'SUMMARY:Klus ' + naam + ' — ' + klus + spoed,
    'LOCATION:' + adres + ', ' + plaats,
    'DESCRIPTION:Tel: ' + tel + '\\nVia plan-pagina Vakfijn',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="vakfijn-reservering.ics"');
  res.status(200).send(ics);
};
