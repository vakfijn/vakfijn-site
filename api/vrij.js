// Leest de "Vakfijn werk"-agenda (iCloud, openbare link in env VAKFIJN_ICS)
// en geeft per dag terug welke dagdelen bezet zijn. De link blijft serverzijdig.
const TZ = 'Europe/Amsterdam';
const OCHTEND = [8 * 60, 12 * 60 + 30];
const MIDDAG = [13 * 60, 17 * 60];

function amsDeel(dUTC) { // UTC-Date -> {date:'YYYY-MM-DD', min}
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(dUTC);
  return { date: s.slice(0, 10), min: Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16)) };
}
function parseStamp(v) {
  if (/^\d{8}$/.test(v)) return { date: v.slice(0, 4) + '-' + v.slice(4, 6) + '-' + v.slice(6, 8), min: 0, allday: true };
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  if (m[7] === 'Z') return amsDeel(new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5])));
  return { date: m[1] + '-' + m[2] + '-' + m[3], min: +m[4] * 60 + +m[5] };
}
function volgDag(date) {
  const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const url = process.env.VAKFIJN_ICS;
    if (!url) return res.status(200).json({ ok: false, reden: 'niet-geconfigureerd' });
    const r = await fetch(url.replace(/^webcal:/, 'https:'));
    if (!r.ok) return res.status(200).json({ ok: false, reden: 'agenda-onbereikbaar' });
    const lines = (await r.text()).replace(/\r\n[ \t]/g, '').split(/\r?\n/);
    const events = []; let cur = null;
    for (const l of lines) {
      if (l === 'BEGIN:VEVENT') cur = {};
      else if (l === 'END:VEVENT') { if (cur && cur.s) events.push(cur); cur = null; }
      else if (cur) {
        let m = l.match(/^DTSTART(?:;[^:]*)?:(.+)$/); if (m) { cur.s = parseStamp(m[1].trim()); continue; }
        m = l.match(/^DTEND(?:;[^:]*)?:(.+)$/); if (m) cur.e = parseStamp(m[1].trim());
      }
    }
    const bezet = {};
    const markeer = (date, van, tot) => {
      const b = bezet[date] || (bezet[date] = []);
      if (van < OCHTEND[1] && tot > OCHTEND[0] && !b.includes('ochtend')) b.push('ochtend');
      if (van < MIDDAG[1] && tot > MIDDAG[0] && !b.includes('middag')) b.push('middag');
    };
    for (const ev of events) {
      const s = ev.s; let e = ev.e || (s.allday ? { date: volgDag(s.date), min: 0 } : { date: s.date, min: s.min + 60 });
      if (!s) continue;
      let dag = s.date, teller = 0;
      while (teller++ < 31) {
        const van = dag === s.date ? s.min : 0;
        const tot = dag === e.date ? e.min : 24 * 60;
        if (dag === e.date && e.min === 0 && dag !== s.date) break; // DTEND is exclusief
        markeer(dag, van, tot);
        if (dag === e.date) break;
        dag = volgDag(dag);
      }
    }
    return res.status(200).json({ ok: true, bezet });
  } catch (err) {
    return res.status(200).json({ ok: false, reden: 'fout' });
  }
};
