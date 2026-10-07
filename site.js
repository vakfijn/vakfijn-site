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
    reinigenPerM: 3,
    kitPerMKlein: 10,   // < 10 m
    kitPerMGroot: 9,    // 10–20 m
    materiaal: 30,
    voorrijkosten: 65,
    opslagPct: 10,
    minimum: 125,       // excl. btw
    btw: 0.21
  };

  var range = calc.querySelector('#meters');
  var soort = calc.querySelector('#soort');
  var mOut = calc.querySelector('[data-m]');
  var inclOut = calc.querySelector('[data-incl]');
  var exclOut = calc.querySelector('[data-excl]');
  var wa = calc.querySelector('[data-wa]');
  var nummer = wa.getAttribute('data-nummer');

  function fmt(n) { return n.toLocaleString('nl-NL'); }

  function update() {
    var m = Number(range.value);
    var perM = m < 10 ? T.kitPerMKlein : T.kitPerMGroot;
    var sub = T.reinigenPerM * m + perM * m + T.materiaal + T.voorrijkosten;
    var excl = Math.max(sub * (1 + T.opslagPct / 100), T.minimum);
    excl = Math.round(excl / 5) * 5;
    var incl = Math.round(excl * (1 + T.btw) / 5) * 5;

    mOut.textContent = m + ' m';
    inclOut.textContent = '€ ' + fmt(incl);
    exclOut.textContent = '€ ' + fmt(excl) + ' excl. 21% btw · incl. materiaal en voorrijkosten';

    var msg = 'Hallo, ik wil graag een vaste prijs voor kitwerk (' + soort.value +
      ', ca. ' + m + ' m). Richtprijs via de site: € ' + fmt(incl) + ' incl. btw. Foto\'s volgen.';
    wa.href = 'https://wa.me/' + nummer + '?text=' + encodeURIComponent(msg);
  }

  range.addEventListener('input', update);
  soort.addEventListener('change', update);
  update();
})();
