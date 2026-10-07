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
    reinigenPerM: 3,          // ontvetten / reinigen, per meter
    kitPerM: [                // arbeid kitten, staffel tot en met X meter
      { tot: 10, prijs: 10 },
      { tot: 20, prijs: 9 },
      { tot: Infinity, prijs: 8 }
    ],
    meterPerKoker: 8,         // hoeveel meter naad uit één koker (aanpassen naar praktijk)
    kokerStandaard: 17.5,     // wit / lichtgrijs / transparant, per koker
    kokerKleur: 20,           // andere kleur, per koker
    oudeKitPerM: null,        // oude kit verwijderen, per meter — null = optie verborgen
    drainVast: null,          // drain / RVS put meekitten, vast per klus — null = optie verborgen
    voorrijkosten: 65,
    opslagPct: 10,
    minimum: 125,             // excl. btw
    btw: 0.21
  };


  // Per soort klus: bereik, standaardwaarde en hulptekst onder de schuif
  var SOORT = {
    'douche of bad': { min: 4,  max: 20, start: 8,  hint: 'Douchehoek ca. 4–6 m, met douchewand 11–14 m' },
    'keuken':        { min: 4,  max: 16, start: 8,  hint: 'Keukens doorgaans 6–12 m (aanrecht en spatwand)' },
    'beglazing':     { min: 4,  max: 50, start: 12, hint: 'Per raam ca. 4–5 m, hele woning tot ca. 46 m' },
    'stucnaden':     { min: 5,  max: 60, start: 20, hint: 'Plinten en plafondnaden lopen snel op' }
  };

  var range = calc.querySelector('#meters');
  var soort = calc.querySelector('#soort');
  var kleurGroep = calc.querySelectorAll('input[name=kleur]');
  function kleurEl() { return calc.querySelector('input[name=kleur]:checked') || kleurGroep[0]; }
  var oudekit = calc.querySelector('#oudekit');
  var drain = calc.querySelector('#drain');
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

  function applySoort() {
    var c = SOORT[soort.value] || SOORT['douche of bad'];
    range.min = c.min; range.max = c.max; range.value = c.start;
    minOut.textContent = c.min + ' m';
    maxOut.textContent = c.max + ' m';
    hintOut.textContent = c.hint;
  }

  function fmt(n) { return n.toLocaleString('nl-NL'); }

  function update() {
    var m = Number(range.value);
    var perM = T.kitPerM.filter(function (t) { return m <= t.tot; })[0].prijs;
    var kokers = Math.max(1, Math.ceil(m / T.meterPerKoker));
    var kleurExtra = !!kleurEl().getAttribute('data-extra');
    var materiaal = kokers * (kleurExtra ? T.kokerKleur : T.kokerStandaard);
    var sub = T.reinigenPerM * m + perM * m + materiaal + T.voorrijkosten;
    if (T.oudeKitPerM != null && oudekit.checked) sub += T.oudeKitPerM * m;
    if (T.drainVast != null && drain.checked) sub += T.drainVast;
    var excl = Math.max(sub * (1 + T.opslagPct / 100), T.minimum);
    excl = Math.round(excl / 5) * 5;
    var incl = Math.round(excl * (1 + T.btw) / 5) * 5;

    mOut.textContent = m + ' m';
    inclOut.textContent = '€ ' + fmt(incl);
    exclOut.textContent = '€ ' + fmt(excl) + ' excl. 21% btw · incl. ' + kokers + (kokers === 1 ? ' koker' : ' kokers') + ' kit en voorrijkosten';

    var extras = [];
    if (T.oudeKitPerM != null && oudekit.checked) extras.push('oude kit verwijderen');
    if (T.drainVast != null && drain.checked) extras.push('drain/RVS put meekitten');
    var msg = 'Hallo, ik wil graag een vaste prijs voor kitwerk (' + soort.value + ', ca. ' + m + ' m, kleur ' + kleurEl().value +
      (extras.length ? ', ' + extras.join(', ') : '') + '). Richtprijs via de site: € ' + fmt(incl) + ' incl. btw. Foto\'s volgen.';
    wa.href = 'https://wa.me/' + nummer + '?text=' + encodeURIComponent(msg);
  }

  range.addEventListener('input', update);
  soort.addEventListener('change', function () { applySoort(); update(); });
  kleurGroep.forEach(function (r) { r.addEventListener('change', update); });
  oudekit.addEventListener('change', update);
  drain.addEventListener('change', update);
  applySoort();
  update();
})();
