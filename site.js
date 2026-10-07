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

  // ---- Hero-diashow (home): elke 4 seconden een volgend vak ----
  var slides = document.getElementById('heroslides');
  if (slides && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var figs = slides.querySelectorAll('figure'), idx = 0;
    setInterval(function () {
      figs[idx].classList.remove('on');
      idx = (idx + 1) % figs.length;
      figs[idx].classList.add('on');
    }, 4000);
  }

  // ---- Roterende weetjes (kitwerk): elke 6 seconden het volgende ----
  var wj = document.getElementById('kitweetjes');
  if (wj && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var wps = wj.querySelectorAll('.wtxt p'), wds = wj.querySelectorAll('.wdots span'), wi = 0;
    setInterval(function () {
      wps[wi].classList.remove('on'); wds[wi].classList.remove('on');
      wi = (wi + 1) % wps.length;
      wps[wi].classList.add('on'); wds[wi].classList.add('on');
    }, 6000);
  }

  // ---- Kaart werkgebied (home) ----
  var kaartEl = document.getElementById('kaart');
  if (kaartEl) {
    var tekenKaart = function () {
      if (!window.L) return setTimeout(tekenKaart, 100);
      var start = [51.788, 6.138]; // Stechbahn, Kleve
      var map = L.map(kaartEl, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(start, 9);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(map);
      L.circle(start, { radius: 45000, color: '#D4A82C', weight: 2, fillColor: '#D4A82C', fillOpacity: 0.12 }).addTo(map);
      L.circleMarker(start, { radius: 7, color: '#2C2A28', weight: 2, fillColor: '#D4A82C', fillOpacity: 1 }).addTo(map).bindTooltip('Vakfijn · Kleve', { permanent: true, direction: 'bottom', offset: [0, 8], className: 'kaart-label' });
    };
    tekenKaart();
  }

  // ---- Schilder-calculator (binnenwerk) ----
  var sc = document.getElementById('schildercalc');
  if (sc) {
    var S = {  // prijzen excl. btw, incl. materiaal en arbeid — afgestemd op offertes 2026-0019 en 2026-0038
      muur: { licht: 21, nieuw: 23, donker: 25 },                // per m², 2 lagen
      ondergrond: { goed: 0, nieuw: 5, herstel: 21.5 },          // per m² muur: voorstrijk €5, herstel + voorstrijk €16,50 + €5
      plafond: { wit: 31, kleur: 33, donker: 35 },               // per m², reinigen, schuren, 2 lagen
      gatenRuimte: 45, scheurM: 8, schadePlek: 145,              // stucherstel losse posten
      // lakwerk: prijs per laag, incl. voorbereiding en materiaal
      lagen: { compleet: 3, standaard: 2, onderhoud: 1 },   // primer + 2 lak / 2 lak / 1 laag
      deurZijdeLaag: { vlak: 40, panelen: 55 },   // binnendeur per zijde per laag
      voordeurLaag: 150,         // voordeur binnenzijde met raam en lijsten, per laag (offerte 2026-0042)
      raamLaag: 65,              // binnenraam / dagraam per laag
      kozijnMLaag: 15,           // per strekkende meter per laag (kozijn ca. 5 m = €75/laag)
      vensterbankMLaag: 18,      // per meter per laag
      plintMLaag: { laag: 4, hoog: 6, profiel: 8 },   // per meter per laag, naar hoogte
      radiatorLaag: 32,          // per radiator per laag
      trapLaag: 500,             // trap zonder treden, per laag (3 lagen = vanaf €1.500)
      tredenLaag: 120,           // traptreden per laag; om en om, dus 2 werkdagen per laag (stelpost €350 / 3)
      lakKleur: { wit: 0, kleur: 0.10, wissel: 0.15 },      // toeslag op lakwerk: andere kleur +10%, kleurwissel +15%
      lakGlans: { zijdeglans: 0, mat: 0.10, hoogglans: 0.15 },
      opstart: [{ tot: 30, prijs: 60 }, { tot: 60, prijs: 120 }, { tot: Infinity, prijs: 175 }],  // afplakken/afdekken/opruimen, naar m²
      ritPrijs: 65,              // voorrijkosten per werkdag
      werkPerDag: 450,           // ritten = ceil(werk / 450), minimaal 1
      extraRitten: { goed: 0, nieuw: 1, herstel: 2 },   // droogtijd: voorstrijk moet drogen (+1), pleisterherstel én voorstrijk (+2)
      lakStaffel: [{ vanaf: 1800, korting: 0.15 }, { vanaf: 900, korting: 0.10 }],   // meeschalen: groter lakwerk goedkoper per onderdeel
      lastigPct: 15,             // lastige ruimte (trapgat, schuine wanden, veel hoeken): toeslag op sauswerk
      onderhoudFactor: 0.65,     // onderhoudslaag (1 laag) = 65% van de 2-lagenprijs, voor sauswerk en lakwerk
      btwLaag: 0.09, btwHoog: 0.21
    };
    var g = function (id) { return sc.querySelector('#' + id); };
    var n = function (id) { var v = Number(g(id).value); return isNaN(v) || v < 0 ? 0 : v; };
    var sInclOut = sc.querySelector('[data-incl]'), sExclOut = sc.querySelector('[data-excl]'), sNote = sc.querySelector('[data-note]'), sWa = sc.querySelector('[data-wa]');
    var sFmt = function (x) { return Math.round(x).toLocaleString('nl-NL'); };
    var MK = { licht: 'zelfde/lichte kleur', nieuw: 'nieuwe kleur', donker: 'donkere kleur' };
    var PK = { wit: 'wit/licht', kleur: 'kleur', donker: 'donker' };

    function sUpdate() {
      var muurAfw = (sc.querySelector('input[name=s-muurafw]:checked') || {}).value || 'volledig';
      var lakAfw = (sc.querySelector('input[name=s-lakafw]:checked') || {}).value || 'compleet';
      var muurOnderhoud = muurAfw === 'onderhoud', lakOnderhoud = lakAfw === 'onderhoud';
      // onderhoud: alleen zelfde kleur en bestaande, intacte ondergrond
      ['s-muurkleur', 's-plafondkleur', 's-ondergrond'].forEach(function (id) { var el = g(id); el.disabled = muurOnderhoud; if (muurOnderhoud) el.selectedIndex = 0; });
      (function () { var el = g('s-lakkleur'); el.disabled = lakOnderhoud; if (lakOnderhoud) el.selectedIndex = 0; })();
      sc.querySelector('[data-muur-hint]').hidden = !muurOnderhoud;
      sc.querySelector('[data-lak-hint]').hidden = !lakOnderhoud;
      var f = muurOnderhoud ? S.onderhoudFactor : 1, lagen = muurOnderhoud ? ' (1 laag)' : '';
      var regels = [], werk = 0;
      function post(bedrag, tekst) { if (bedrag > 0) { werk += bedrag; regels.push('• ' + tekst); } }
      var mk = g('s-muurkleur').value, pk = g('s-plafondkleur').value, og = g('s-ondergrond').value;
      var lf = g('s-lastig').checked ? 1 + S.lastigPct / 100 : 1;
      post(n('s-muur') * S.muur[mk] * f * lf, 'Muren sauzen ' + n('s-muur') + ' m² (' + MK[mk] + ')' + lagen);
      post(n('s-muur') * S.ondergrond[og], og === 'nieuw' ? 'Voorstrijken nieuw stucwerk' : 'Stuc herstellen en voorstrijken');
      post(n('s-plafond') * S.plafond[pk] * f * lf, 'Plafond sauzen ' + n('s-plafond') + ' m² (' + PK[pk] + ')' + lagen);
      post(n('s-gaten') * S.gatenRuimte, 'Gaten vullen: ' + n('s-gaten') + ' ruimte(s)');
      post(n('s-scheur') * S.scheurM, 'Haarscheuren: ' + n('s-scheur') + ' m');
      post(n('s-schade') * S.schadePlek, 'Herstelplekken: ' + n('s-schade'));
      // lakwerk: per laag, met kleur- en glanstoeslag over het lakwerk
      var lagen = S.lagen[lakAfw], lk = g('s-lakkleur').value, gl = g('s-glans').value;
      var lak = n('s-deur') * S.deurZijdeLaag[g('s-deurtype').value] + n('s-voordeur') * S.voordeurLaag + n('s-raam') * S.raamLaag + n('s-kozijn') * S.kozijnMLaag + n('s-vensterbank') * S.vensterbankMLaag +
                n('s-plint') * S.plintMLaag[g('s-plinttype').value] + n('s-radiator') * S.radiatorLaag + n('s-trap') * S.trapLaag + n('s-treden') * S.tredenLaag;
      lak = lak * lagen;
      var lakToeslag = lak * (S.lakKleur[lk] + S.lakGlans[gl]);
      var korting = 0;
      S.lakStaffel.some(function (t) { if (lak >= t.vanaf) { korting = t.korting; return true; } return false; });
      if (lak > 0) {
        if (n('s-deur')) regels.push('• Binnendeuren: ' + n('s-deur') + ' zijde(n), ' + (g('s-deurtype').value === 'vlak' ? 'vlak' : 'met ramen/panelen'));
        if (n('s-voordeur')) regels.push('• Voordeur binnenzijde: ' + n('s-voordeur'));
        if (n('s-raam')) regels.push('• Binnenramen/dagramen: ' + n('s-raam'));
        if (n('s-kozijn')) regels.push('• Kozijnen binnen: ' + n('s-kozijn') + ' m');
        if (n('s-vensterbank')) regels.push('• Vensterbanken: ' + n('s-vensterbank') + ' m');
        if (n('s-plint')) regels.push('• Plinten: ' + n('s-plint') + ' m, ' + g('s-plinttype').options[g('s-plinttype').selectedIndex].text.toLowerCase());
        if (n('s-radiator')) regels.push('• Radiatoren: ' + n('s-radiator'));
        if (n('s-trap')) regels.push('• Trap zonder treden: ' + n('s-trap'));
        if (n('s-treden')) regels.push('• Traptreden (om en om): ' + n('s-treden') + ' trap(pen)');
        regels.push('• Lak: ' + g('s-lakkleur').options[g('s-lakkleur').selectedIndex].text.toLowerCase() + ', ' + gl);
        if (korting) regels.push('• Staffelkorting lakwerk: ' + Math.round(korting * 100) + '%');
        werk += (lak + lakToeslag) * (1 - korting);
      }
      if (regels.length && g('s-lastig').checked) regels.push('• Lastige ruimte: trapgat / schuine wanden / veel hoeken');
      var LAFW = { compleet: 'compleet, hechtprimer + 2 lagen, met garantie', standaard: 'standaard, 2 lagen zonder primer, zonder hechtgarantie', onderhoud: 'onderhoud, 1 laag, zonder garantie' };
      if (lak > 0) regels.push('• Lakwerk afwerking: ' + LAFW[lakAfw]);
      if (n('s-muur') + n('s-plafond') > 0) regels.push('• Sauswerk: ' + (muurOnderhoud ? 'onderhoud, 1 laag, zonder garantie' : '2 lagen, met garantie'));

      // samenvatting in de ingeklapte balken
      var KORT = { 's-muur': ['m² muur', 'm² muur'], 's-plafond': ['m² plafond', 'm² plafond'], 's-gaten': ['ruimte', 'ruimtes'], 's-scheur': ['m scheur', 'm scheuren'], 's-schade': ['plek', 'plekken'],
        's-deur': ['deurzijde', 'deurzijden'], 's-raam': ['raam', 'ramen'], 's-voordeur': ['voordeur', 'voordeuren'], 's-kozijn': ['m kozijn', 'm kozijn'],
        's-vensterbank': ['m vensterbank', 'm vensterbank'], 's-plint': ['m plint', 'm plinten'], 's-radiator': ['radiator', 'radiatoren'], 's-trap': ['trap', 'trappen'], 's-treden': ['trap treden', 'trappen treden'] };
      sc.querySelectorAll('details.cdet').forEach(function (d) {
        var delen = [];
        d.querySelectorAll('input[type=number]').forEach(function (inp) {
          var v = Number(inp.value), k = KORT[inp.id];
          if (v > 0 && k) delen.push(v + ' ' + (v === 1 ? k[0] : k[1]));
        });
        d.querySelector('[data-sum]').textContent = delen.length ? '· ' + delen.join(', ') : '';
      });

      var leeg = werk === 0;
      var m2 = n('s-muur') + n('s-plafond');
      var opstart = S.opstart.filter(function (t) { return m2 <= t.tot; })[0].prijs;
      var ritten = Math.max(1, Math.ceil(werk / S.werkPerDag));
      if (n('s-muur') > 0 && !muurOnderhoud) ritten += S.extraRitten[og];   // terugkomen na drogen van stuc / voorstrijk
      if (n('s-treden') > 0) ritten = Math.max(ritten, 2 * lagen);   // treden om en om: twee werkdagen per laag
      var excl = werk + opstart + ritten * S.ritPrijs;
      var note = 'incl. opstart (afplakken, afdekken, opruimen) en voorrijkosten voor ' + ritten + (ritten === 1 ? ' werkmoment' : ' werkmomenten') + ((n('s-muur') > 0 && !muurOnderhoud && S.extraRitten[og]) ? ' (incl. droogtijd stuc/voorstrijk)' : '');
      var btw = g('s-oud').checked ? S.btwLaag : S.btwHoog;
      var incl = Math.round(excl * (1 + btw) / 5) * 5;

      sInclOut.textContent = leeg ? '€ —' : '€ ' + sFmt(incl);
      sExclOut.textContent = leeg ? 'Vul hierboven in wat er geschilderd moet worden.' : '€ ' + sFmt(excl) + ' excl. ' + Math.round(btw * 100) + '% btw';
      sNote.textContent = leeg ? '' : note;

      var msg = ['Hallo Dennis, ik wil graag een vaste prijs voor schilderwerk binnen.', '', 'Overzicht via de calculator:'].concat(regels)
        .concat(['• Richtprijs: € ' + sFmt(incl) + ' incl. ' + Math.round(btw * 100) + '% btw', '', 'Foto\'s van de ruimte stuur ik hierna.']).join('\n');
      sWa.href = 'https://wa.me/' + sWa.getAttribute('data-nummer') + '?text=' + encodeURIComponent(msg);
    }
    sc.querySelectorAll('input, select').forEach(function (el) { el.addEventListener('input', sUpdate); el.addEventListener('change', sUpdate); });
    sUpdate();
  }

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
    lastigPct: 25,            // veel hoeken / nissen / krap: toeslag op de arbeid (afgestemd op offerte 2026-0036)
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
    beglazing: {              // beglazingskit, één kleur
      reinigenPerM: 0,        // zit in oudeKitPerM (uitkrabben + ontvetten samen)
      oudeKitPerM: 6.5,       // oude kit verwijderen én ontvetten, per meter
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
      kitPerM: [              // all-in per meter, staffel
        { tot: 10, prijs: 6 },
        { tot: 25, prijs: 5.5 },
        { tot: Infinity, prijs: 5 }
      ],
      meterPerKoker: 10,
      kokerStandaard: 10,     // wit
      kokerKleur: 12.5,       // kleur / structuur — AANNAME, aanpassen
      hybrideKoker: 20,       // hybride (STP) kit voor werkende naden — AANNAME: 2× inkoop
      hybrideMeterPerKoker: 8,
      kleuren: 4
    }
  };

  // Per soort klus: type kit, bereik, standaardwaarde, hulptekst en minimum (INCL. btw)
  var SOORT = {
    'douche of bad': { type: 'siliconen', min: 2, max: 20, start: 8,  minimum: 150, hint: 'Wastafel of toilet 2–3 m, douchehoek 4–6 m, met douchewand 11–14 m' },
    'keuken':        { type: 'siliconen', min: 2, max: 16, start: 8,  minimum: 125, hint: 'Keukens doorgaans 6–12 m (aanrecht en spatwand)' },
    'beglazing':     { type: 'beglazing', min: 2, max: 50, start: 12, minimum: 125, hint: 'Per raam ca. 4–5 m, hele woning tot ca. 46 m' },
    'stucnaden':     { type: 'acryl',     min: 3, max: 60, start: 20, minimum: 100, hint: 'Plinten en plafondnaden lopen snel op' }
  };

  var range = calc.querySelector('#meters');
  var soort = calc.querySelector('#soort');
  var kleurGroep = calc.querySelectorAll('input[name=kleur]');
  function kleurEl() { return calc.querySelector('input[name=kleur]:checked') || kleurGroep[0]; }
  var oudekit = calc.querySelector('#oudekit');
  var drain = calc.querySelector('#drain');
  var goot = calc.querySelector('#goot');
  var hybride = calc.querySelector('#hybride');
  var lastig = calc.querySelector('#lastig');
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
    calc.querySelector('[data-opt=hybride]').hidden = c.type !== 'acryl';
    hybride.checked = false;
    if (soort.value !== 'douche of bad') { drain.checked = false; goot.checked = false; }
    // oude kit verwijderen: standaard aan bij siliconen en beglazing, uit bij acryl
    oudekit.checked = c.type !== 'acryl';
  }

  function fmt(n) { return n.toLocaleString('nl-NL'); }

  function update() {
    var m = Number(range.value);
    var c = huidig(); var K = T[c.type];
    var perM = K.kitPerM.filter(function (t) { return m <= t.tot; })[0].prijs;
    var hyb = c.type === 'acryl' && hybride.checked;
    var kokers = Math.max(1, Math.ceil(m / (hyb ? K.hybrideMeterPerKoker : K.meterPerKoker)));
    var kleurExtra = !!kleurEl().getAttribute('data-extra');
    var materiaal = kokers * (hyb ? K.hybrideKoker : (kleurExtra ? K.kokerKleur : K.kokerStandaard));
    var oudePerM = K.oudeKitPerM != null ? K.oudeKitPerM : T.oudeKitPerM;
    var arbeid = K.reinigenPerM * m + perM * m + ((oudePerM != null && oudekit.checked) ? oudePerM * m : 0);
    if (lastig.checked) arbeid *= 1 + T.lastigPct / 100;
    var sub = arbeid + materiaal + T.voorrijkosten;
    if (T.drainVast != null && drain.checked) sub += T.drainVast;
    if (goot.checked) sub += T.gootVast;
    var excl = sub * (1 + T.opslagPct / 100);
    var incl = excl * (1 + T.btw);
    if (incl < c.minimum) { incl = c.minimum; excl = c.minimum / (1 + T.btw); }
    incl = Math.round(incl / 5) * 5;
    excl = Math.round(excl);

    mOut.textContent = m + ' m';
    inclOut.textContent = '€ ' + fmt(incl);
    exclOut.textContent = '€ ' + fmt(excl) + ' excl. 21% btw · incl. ' + kokers + (kokers === 1 ? ' koker' : ' kokers') + ' kit en voorrijkosten';

    var extras = [];
    if (T.oudeKitPerM != null && oudekit.checked) extras.push('oude kit verwijderen');
    if (T.drainVast != null && drain.checked) extras.push('RVS put meekitten');
    if (goot.checked) extras.push('douchegoot/Easydrain met speciale kit');
    if (hyb) extras.push('werkende naden met hybride kit');
    if (lastig.checked) extras.push('veel hoeken/nissen/krap');
    var SOORTNAAM = { 'douche of bad': 'Douche of bad', 'keuken': 'Keuken', 'beglazing': 'Beglazing', 'stucnaden': 'Stucnaden en plinten' };
    var regels = [
      'Hallo Dennis, ik wil graag een vaste prijs voor kitwerk.',
      '',
      'Overzicht via de kit-calculator:',
      '• Klus: ' + (SOORTNAAM[soort.value] || soort.value),
      '• Meters: ca. ' + m + ' m',
      '• Kleur: ' + kleurEl().value
    ];
    extras.forEach(function (x) { regels.push('• Extra: ' + x); });
    regels.push('• Richtprijs: € ' + fmt(incl) + ' incl. btw');
    regels.push('', 'Foto\'s (overzicht + close-ups) stuur ik hierna.');
    var msg = regels.join('\n');
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
  hybride.addEventListener('change', update);
  lastig.addEventListener('change', update);
  applySoort();
  update();
})();
