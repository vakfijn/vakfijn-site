// Vakfijn — formulieren (Web3Forms) + kit-calculator
(function () {
  // ---- Formulieren: versturen zonder paginawissel ----
  document.querySelectorAll('form[data-web3forms]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var ok = form.querySelector('.ok');
      var oud = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Versturen…';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) {
            form.reset();
            if (ok) { ok.style.display = 'block'; }
            btn.textContent = 'Verzonden';
          } else {
            btn.disabled = false;
            btn.textContent = oud;
            alert('Versturen lukte niet. Stuur je bericht via WhatsApp of e-mail.');
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = oud;
          alert('Versturen lukte niet. Stuur je bericht via WhatsApp of e-mail.');
        });
    });
  });

  // ---- Kit-calculator ----
  var calc = document.getElementById('kitcalc');
  if (!calc) return;

  var T = {
    voorrijkosten: 65,
    opslagPct: 10,
    btw: 0.21,
    oudeKitPerM: 5,           // oude kit verwijderen, per meter — null = optie verborgen
    drainVast: 55,            // RVS put meekitten, vast per klus
    gootVast: 215,            // douchegoot / Easydrain: €55 arbeid + speciale koker (2× €80 inkoop)
    siliconen: {
      reinigenPerM: 3,        // ontvetten / reinigen, per meter
      kitPerM: [              // arbeid kitten, staffel tot en met X meter
        { tot: 10, prijs: 10 },
        { tot: 20, prijs: 9 },
        { tot: Infinity, prijs: 8 }
      ],
      meterPerKoker: 8,
      kokerStandaard: 17.5,   // wit / lichtgrijs / transparant
      kokerKleur: 20,         // andere kleur
      kleuren: 27             // aantal meerprijs-kleuren in het palet
    },
    beglazing: {              // hybride beglazingskit: alleen wit en betongrijs
      reinigenPerM: 3,
      kitPerM: [
        { tot: 10, prijs: 10 },
        { tot: 20, prijs: 9 },
        { tot: Infinity, prijs: 8 }
      ],
      meterPerKoker: 8,
      kokerStandaard: 17.5,
      kokerKleur: 20,
      kleuren: 0              // beglazingskit: één kleur, geen palet
    },
    acryl: {
      reinigenPerM: 0,        // zit in de all-in meterprijs
      kitPerM: [{ tot: Infinity, prijs: 6 }],   // €6 all-in per meter
      meterPerKoker: 10,
      kokerStandaard: 10,     // wit
      kokerKleur: 12.5,       // kleur / structuur — AANNAME, aanpassen
      kleuren: 4
    }
  };

  // Per soort klus: type kit, bereik, standaardwaarde, hulptekst en minimum (excl. btw)
  var SOORT = {
    'douche of bad': { type: 'siliconen', min: 4, max: 20, start: 8,  minimum: 150, hint: 'Douchehoek ca. 4–6 m, met douchewand 11–14 m' },
    'keuken':        { type: 'siliconen', min: 4, max: 16, start: 8,  minimum: 125, hint: 'Keukens doorgaans 6–12 m (aanrecht en spatwand)' },
    'beglazing':     { type: 'beglazing', min: 4, max: 50, start: 12, minimum: 125, hint: 'Per raam ca. 4–5 m, hele woning tot ca. 46 m' },
    'stucnaden':     { type: 'acryl',     min: 5, max: 60, start: 20, minimum: 100, hint: 'Plinten en plafondnaden lopen snel op' }
  };

  var range = calc.querySelector('#meters');
  var soort = calc.querySelector('#soort');
  var kleurGroep = calc.querySelectorAll('input[name=kleur]');
  function kleurEl() { return calc.querySelector('input[name=kleur]:checked') || kleurGroep[0]; }
  var oudekit = calc.querySelector('#oudekit');
  var drain = calc.querySelector('#drain');
  var goot = calc.querySelector('#goot');
  if (T.oudeKitPerM == null) calc.querySelector('[data-opt=oudekit]').hidden = true;
  if (T.drainVast == null) calc.querySelector('[data-opt=drain]').hidden = true;
  var mOut = calc.querySelector('[data-m]');
  var inclOut = calc.querySelector('[data-incl]');
  var exclOut = calc.querySelector('[data-excl]');
  var wa = calc.querySelector('[data-wa]');
  var nummer = wa.getAttribute('data-nummer');
  var minOut = calc.querySelector('[data-min]');
  var maxOut = calc.querySelector('[data-max]');
  var hintOut = calc.querySelector('[data-hint]');
  var gekozen = calc.querySelector('[data-gekozen]');

  var aantalOut = calc.querySelector('[data-aantal]');
  var meer = calc.querySelector('#meerkleur');
  function huidig() { return SOORT[soort.value] || SOORT['douche of bad']; }

  function applySoort() {
    var c = huidig();
    range.min = c.min; range.max = c.max; range.value = c.start;
    minOut.textContent = c.min + ' m';
    maxOut.textContent = c.max + ' m';
    hintOut.textContent = c.hint;
    // alleen de kleurstalen van dit kittype tonen; terug naar de standaardkleur
    calc.querySelectorAll('.sw').forEach(function (l) { l.hidden = l.getAttribute('data-type') !== c.type; });
    var eerste = calc.querySelector('.sw[data-type=' + c.type + '] input');
    if (eerste) eerste.checked = true;
    gekozen.textContent = '';
    meer.open = false;
    aantalOut.textContent = 'meerprijs · ' + T[c.type].kleuren + (T[c.type].kleuren === 1 ? ' kleur' : ' kleuren');
    // geen keuze? dan de uitklapbalk verbergen
    meer.hidden = T[c.type].kleuren === 0;
    // drain/put alleen zinvol bij douche of bad
    calc.querySelector('[data-opt=drain]').hidden = (T.drainVast == null) || c.type !== 'siliconen' || soort.value !== 'douche of bad';
    calc.querySelector('[data-opt=goot]').hidden = soort.value !== 'douche of bad';
    if (soort.value !== 'douche of bad') { drain.checked = false; goot.checked = false; }
    // oude kit verwijderen: standaard aan bij siliconen en beglazing, uit bij acryl
    oudekit.checked = c.type !== 'acryl';
  }

  function fmt(n) { return n.toLocaleString('nl-NL'); }

  function update() {
    var m = Number(range.value);
    var c = huidig(); var K = T[c.type];
    var perM = K.kitPerM.filter(function (t) { return m <= t.tot; })[0].prijs;
    var kokers = Math.max(1, Math.ceil(m / K.meterPerKoker));
    var kleurExtra = !!kleurEl().getAttribute('data-extra');
    var materiaal = kokers * (kleurExtra ? K.kokerKleur : K.kokerStandaard);
    var sub = K.reinigenPerM * m + perM * m + materiaal + T.voorrijkosten;
    if (T.oudeKitPerM != null && oudekit.checked) sub += T.oudeKitPerM * m;
    if (T.drainVast != null && drain.checked) sub += T.drainVast;
    if (goot.checked) sub += T.gootVast;
    var excl = Math.max(sub * (1 + T.opslagPct / 100), c.minimum);
    excl = Math.round(excl / 5) * 5;
    var incl = Math.round(excl * (1 + T.btw) / 5) * 5;

    mOut.textContent = m + ' m';
    inclOut.textContent = '€ ' + fmt(incl);
    exclOut.textContent = '€ ' + fmt(excl) + ' excl. 21% btw · incl. ' + kokers + (kokers === 1 ? ' koker' : ' kokers') + ' kit en voorrijkosten';

    var extras = [];
    if (T.oudeKitPerM != null && oudekit.checked) extras.push('oude kit verwijderen');
    if (T.drainVast != null && drain.checked) extras.push('RVS put meekitten');
    if (goot.checked) extras.push('douchegoot/Easydrain met speciale kit');
    var msg = 'Hallo, ik wil graag een vaste prijs voor kitwerk (' + soort.value + ', ca. ' + m + ' m, kleur ' + kleurEl().value +
      (extras.length ? ', ' + extras.join(', ') : '') + '). Richtprijs via de site: € ' + fmt(incl) + ' incl. btw. Foto\'s volgen.';
    wa.href = 'https://wa.me/' + nummer + '?text=' + encodeURIComponent(msg);
  }

  range.addEventListener('input', update);
  soort.addEventListener('change', function () { applySoort(); update(); });
  kleurGroep.forEach(function (r) {
    r.addEventListener('change', function () {
      // naam van de gekozen meerprijs-kleur tonen in de uitklapbalk; leeg bij standaardkleur
      gekozen.textContent = r.getAttribute('data-extra') ? '· ' + r.value : '';
      update();
    });
  });
  oudekit.addEventListener('change', update);
  drain.addEventListener('change', update);
  goot.addEventListener('change', update);
  applySoort();
  update();
})();
