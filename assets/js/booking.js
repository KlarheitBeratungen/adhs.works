/* =========================================================================
   adhs.works – Terminplaner für kostenlose Erstgespräche
   -------------------------------------------------------------------------
   Übernommen vom Terminplaner auf klarheit-beratungen.de. Hier gibt es nur
   ein Anliegen; es ist fest vorgegeben, der Kalender ist direkt sichtbar:
   <div class="booking" id="booking" data-area="coaching">

   VERSAND: Das Formular wird per fetch() an "send-booking.php" (Hostinger)
   geschickt; dieses sendet die Anfrage per E-Mail an Markus und antwortet
   mit JSON {ok:true}. Schlägt der Versand fehl, bietet die Seite als
   Fallback eine vorbereitete mailto-Anfrage an.

   EINWILLIGUNG: Schon eine Anfrage über adhs.works lässt Rückschlüsse
   auf die Gesundheit zu (Art. 9 DSGVO). Deshalb ist das Häkchen Pflicht;
   send-booking.php prüft es ebenfalls.

   VERFÜGBARKEIT: Die Slots sind aktuell illustrativ (deterministisch erzeugt).
   Echte Kalender-Verfügbarkeit ließe sich später über getBusyTimes(dateISO)
   anbinden (CONFIG.useGoogleCalendar).
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('booking');
  if (!root) return;

  // ---------------------------- Konfiguration ----------------------------
  var CONFIG = {
    email: 'wagner@klarheit-beratungen.de',
    useGoogleCalendar: false,               // TODO: true, sobald Google-Kalender angebunden ist
    weeksAhead: 4,                           // wie viele Wochen im Voraus buchbar sind
    morningGrid: ['09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30'],
    afternoonGrid: ['14:00', '14:15', '14:30', '14:45'],
    afternoonChance: 0.55                    // Anteil der Tage mit Nachmittags-Slot (Verknappung)
  };

  // Ein Anliegen. Das Label muss genau in $AREAS von send-booking.php stehen,
  // sonst entfällt die Eingangsbestätigung. Bewusst ohne „ADHS“: Das Label
  // steht auch in der Bestätigungsmail.
  var AREAS = [
    { id: 'coaching', label: 'Erstgespräch Coaching', note: 'Telefonisch oder per Video', duration: 30 }
  ];

  // Feste Vorauswahl auf Unterseiten (data-area) -> Kalender startet direkt.
  var PRESET = null;
  (function () {
    var pid = root.getAttribute('data-area');
    if (!pid) return;
    for (var i = 0; i < AREAS.length; i++) { if (AREAS[i].id === pid) { PRESET = AREAS[i]; } }
  })();

  var WD  = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  var WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  var state = { area: null, week: 0, dateObj: null, time: null };

  // --------------------- deterministischer Zufall -----------------------
  // Gleicher Seed -> gleiches Ergebnis: die Slots springen beim Neuladen nicht.
  function hash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, rand) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ------------------------------- Datum --------------------------------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); var wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }
  function weekNum(d) { var x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day + 3); var f = new Date(Date.UTC(x.getUTCFullYear(), 0, 4)); return 1 + Math.round(((x - f) / 86400000 - 3 + ((f.getUTCDay() + 6) % 7)) / 7); }
  function longDate(d) { return WDL[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function endTime(t, dur) { var p = t.split(':'); var m = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + dur; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  // Frühester buchbarer Tag = nächster Werktag ab morgen.
  var earliest = addDays(today, 1);
  while (earliest.getDay() === 0 || earliest.getDay() === 6) earliest = addDays(earliest, 1);
  var firstMonday = mondayOf(earliest);

  // -------------------------- Verfügbarkeiten ---------------------------
  // Platzhalter für den Google-Kalender: liefert später belegte Startzeiten
  // eines Tages (z. B. ["10:00"]). Aktuell leer -> nichts wird ausgeblendet.
  function getBusyTimes(dateISO) {
    if (!CONFIG.useGoogleCalendar) return [];
    /* TODO: belegte Zeiten aus dem Google-Kalender laden */
    return [];
  }

  // Vormittagszeiten einer Woche: gemischt per Wochen-Seed -> Mo–Fr immer
  // unterschiedliche Zeiten (die ersten 5 der 9 Rasterzeiten sind verschieden).
  function morningTimesForWeek(monday) {
    var key = monday.getFullYear() + '-W' + weekNum(monday);
    return shuffle(CONFIG.morningGrid, rng(hash('m' + key)));
  }

  function slotsFor(dayDate, weekMornings, weekdayIndex) {
    if (dayDate < earliest) return [];
    var slots = [{ t: weekMornings[weekdayIndex % weekMornings.length] }];   // 1 Vormittags-Slot
    var r = rng(hash('a' + iso(dayDate)));                                    // Nachmittag: nur an manchen Tagen
    if (r() < CONFIG.afternoonChance) {
      slots.push({ t: CONFIG.afternoonGrid[Math.floor(r() * CONFIG.afternoonGrid.length)] });
    }
    var busy = getBusyTimes(iso(dayDate));
    return slots.filter(function (s) { return busy.indexOf(s.t) === -1; });
  }

  // ------------------------------ Rendering -----------------------------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clear() { root.innerHTML = ''; }

  function steps(active) {
    var names = PRESET ? ['Termin', 'Kontakt'] : ['Anliegen', 'Termin', 'Kontakt'], wrap = el('div', 'booking-steps');
    for (var i = 0; i < names.length; i++) {
      var st = el('div', 'st' + (i < active ? ' done' : '') + (i === active ? ' active' : ''));
      st.appendChild(el('span', 'num', i < active ? '✓' : (i + 1)));
      st.appendChild(el('span', null, names[i]));
      wrap.appendChild(st);
      if (i < names.length - 1) wrap.appendChild(el('span', 'sep', '›'));
    }
    return wrap;
  }

  function rangeLabel(a, b) {
    if (a.getMonth() === b.getMonth()) return a.getDate() + '.–' + b.getDate() + '. ' + MON[b.getMonth()] + ' ' + b.getFullYear();
    return a.getDate() + '. ' + MON[a.getMonth()] + ' – ' + b.getDate() + '. ' + MON[b.getMonth()] + ' ' + b.getFullYear();
  }

  function renderArea() {
    clear();
    root.appendChild(steps(0));
    root.appendChild(el('p', 'area-lead', 'Worum geht es? Wähle dein Anliegen – danach siehst du freie Termine.'));
    var grid = el('div', 'area-grid');
    AREAS.forEach(function (a) {
      var b = el('button', 'area-btn');
      b.type = 'button';
      b.innerHTML = '<span class="a-title">' + a.label + '</span><span class="a-note">' + a.note + '</span><span class="a-dur">' + a.duration + ' Min</span>';
      b.addEventListener('click', function () { state.area = a; state.week = 0; renderCal(); });
      grid.appendChild(b);
    });
    root.appendChild(grid);
  }

  function renderCal() {
    clear();
    root.appendChild(steps(PRESET ? 0 : 1));
    if (!PRESET) {
      var back = el('button', 'btn-back', '‹ Anderes Anliegen'); back.type = 'button';
      back.addEventListener('click', renderArea); root.appendChild(back);
    }

    var monday = addDays(firstMonday, state.week * 7), friday = addDays(monday, 4);
    var head = el('div', 'cal-head');
    head.appendChild(el('div', 'rng', rangeLabel(monday, friday) + ' · ' + state.area.duration + ' Min'));
    var nav = el('div', 'cal-nav');
    var prev = el('button', null, '‹'); prev.type = 'button'; prev.disabled = state.week <= 0;
    prev.addEventListener('click', function () { if (state.week > 0) { state.week--; renderCal(); } });
    var next = el('button', null, '›'); next.type = 'button'; next.disabled = state.week >= CONFIG.weeksAhead;
    next.addEventListener('click', function () { if (state.week < CONFIG.weeksAhead) { state.week++; renderCal(); } });
    nav.appendChild(prev); nav.appendChild(next); head.appendChild(nav);
    root.appendChild(head);

    var weekMornings = morningTimesForWeek(monday);
    var week = el('div', 'cal-week');
    for (var i = 0; i < 5; i++) {
      var day = addDays(monday, i);
      var col = el('div', 'cal-day' + (day < earliest ? ' past' : ''));
      col.appendChild(el('h4', null, WD[i] + '<span>' + day.getDate() + '. ' + MON[day.getMonth()].slice(0, 3) + '</span>'));
      var slots = slotsFor(day, weekMornings, i);
      if (!slots.length) {
        col.appendChild(el('div', 'no-slot', day < earliest ? '–' : 'ausgebucht'));
      } else {
        slots.forEach(function (s) {
          var btn = el('button', 'slot');
          btn.type = 'button';
          btn.innerHTML = s.t + '<span class="dur">bis ' + endTime(s.t, state.area.duration) + '</span>';
          var dd = day, tt = s.t;
          btn.addEventListener('click', function () { state.dateObj = dd; state.time = tt; renderForm(); });
          col.appendChild(btn);
        });
      }
      week.appendChild(col);
    }
    root.appendChild(week);
    root.appendChild(el('p', 'booking-hint', 'Tippe auf eine Uhrzeit. Kein passender Termin dabei? Mit › siehst du die nächste Woche.'));
  }

  function renderForm() {
    clear();
    root.appendChild(steps(PRESET ? 1 : 2));
    var back = el('button', 'btn-back', '‹ Termin ändern'); back.type = 'button';
    back.addEventListener('click', renderCal); root.appendChild(back);

    var sum = el('div', 'summary');
    sum.innerHTML =
      '<span class="s-item"><b>Termin:</b> ' + longDate(state.dateObj) + ', ' + state.time + '–' + endTime(state.time, state.area.duration) + ' Uhr</span>' +
      '<span class="s-item"><b>Dauer:</b> ' + state.area.duration + ' Minuten (kostenlos, unverbindlich)</span>';
    root.appendChild(sum);

    var form = el('form', 'booking-form');
    form.noValidate = true;
    form.innerHTML =
      '<div class="field"><label for="bk-name">Name *</label><input id="bk-name" type="text" autocomplete="name" />' +
        '<div class="err">Bitte gib deinen Namen an.</div></div>' +
      '<div class="field"><label for="bk-mail">E-Mail *</label><input id="bk-mail" type="email" autocomplete="email" />' +
        '<div class="err">Bitte gib eine gültige E-Mail-Adresse an.</div></div>' +
      '<div class="field"><label for="bk-tel">Telefon <span class="opt">(optional)</span></label><input id="bk-tel" type="tel" autocomplete="tel" maxlength="40" placeholder="Für Rückfragen und das Erstgespräch" /></div>' +
      '<div class="field"><label for="bk-msg">Was möchtest du angehen? <span class="opt">(optional)</span></label>' +
        '<textarea id="bk-msg" placeholder="Ein, zwei Stichworte reichen."></textarea>' +
        '<p class="field-hint">Bitte keine Angaben zu Gesundheit, Befunden oder Diagnosen. Coaching ist keine Therapie.</p></div>' +
      '<div class="field"><label class="consent" for="bk-consent"><input id="bk-consent" type="checkbox" />' +
        '<span>Ich bin einverstanden, dass meine Angaben – auch solche, die Rückschlüsse auf meine Gesundheit zulassen – zur Bearbeitung meiner Anfrage verarbeitet werden. Widerruf jederzeit per E-Mail. *</span></label>' +
        '<div class="err">Bitte bestätige die Einwilligung, damit ich deine Anfrage bearbeiten darf.</div></div>' +
      '<div class="hp" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;"><label>Website (bitte frei lassen)<input type="text" id="bk-website" tabindex="-1" autocomplete="off" /></label></div>' +
      '<div class="booking-actions"><button type="submit" class="btn btn-primary">Terminanfrage senden</button></div>' +
      '<p class="booking-hint">Unverbindliche Anfrage – ich bestätige deinen Termin zeitnah per E-Mail.<br />Deine Angaben verwende ich ausschließlich zur Terminvereinbarung und gebe sie nicht an Dritte weiter. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>';
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submitBooking(form); });
    var cb = form.querySelector('#bk-consent');
    cb.addEventListener('change', function () { if (cb.checked) mark(cb, true); });
    root.appendChild(form);
  }

  function mark(input, ok) {
    var e = input.closest('.field').querySelector('.err');
    if (e) e.style.display = ok ? 'none' : 'block';
    input.style.borderColor = ok ? '' : '#b3261e';
    return ok;
  }

  function buildMailtoHref(p) {
    var subject = 'Terminanfrage Erstgespräch (adhs.works)';
    var body =
      'Terminanfrage für ein kostenloses Erstgespräch\n\n' +
      'Anliegen: ' + p.area + '\n' +
      'Wunschtermin: ' + p.when + '\n\n' +
      'Name: ' + p.name + '\n' +
      'E-Mail: ' + p.email + '\n' +
      'Telefon: ' + (p.phone || '—') + '\n\n' +
      'Was ich angehen möchte:\n' + (p.msg || '—') + '\n\n' +
      'Einwilligung in die Verarbeitung meiner Angaben (auch Gesundheitsangaben): ja\n\n' +
      '(Unverbindliche Anfrage – bitte um kurze Bestätigung.)';
    return 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function submitBooking(form) {
    var name = form.querySelector('#bk-name'), mail = form.querySelector('#bk-mail');
    var vName = mark(name, name.value.trim() !== '');
    var vMail = mark(mail, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim()));
    var consent = form.querySelector('#bk-consent');
    var vConsent = mark(consent, consent.checked);
    if (!vName || !vMail || !vConsent) { (!vName ? name : (!vMail ? mail : consent)).focus(); return; }

    var hpEl = form.querySelector('#bk-website');
    var when = longDate(state.dateObj) + ', ' + state.time + '–' + endTime(state.time, state.area.duration) +
               ' Uhr (' + state.area.duration + ' Min)';
    var p = {
      area:    state.area.label,
      when:    when,
      name:    name.value.trim(),
      email:   mail.value.trim(),
      phone:   form.querySelector('#bk-tel').value.trim(),
      msg:     form.querySelector('#bk-msg').value.trim(),
      consent: true,
      website: hpEl ? hpEl.value : ''
    };

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Wird gesendet …';
    var prev = form.querySelector('.send-error'); if (prev) prev.parentNode.removeChild(prev);

    fetch('send-booking.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
      .then(function (r) { return r.ok ? r.json() : { ok: false }; })
      .then(function (res) {
        if (res && res.ok) { renderConfirm(when); }
        else { sendFailed(form, btn, label, p); }
      })
      .catch(function () { sendFailed(form, btn, label, p); });
  }

  function sendFailed(form, btn, label, p) {
    btn.disabled = false; btn.textContent = label;
    var box = el('div', 'send-error');
    box.style.cssText = 'margin-top:14px;padding:12px 14px;border-radius:10px;background:#fdecea;color:#8f1d16;font-size:.95rem;line-height:1.5;';
    box.innerHTML = 'Die Anfrage ließ sich gerade nicht senden. Bitte versuch es noch einmal – ' +
      'oder <a href="' + buildMailtoHref(p) + '" style="color:inherit;font-weight:700;">schick sie direkt per E-Mail</a>.';
    form.appendChild(box);
  }

  function renderConfirm(when) {
    clear();
    var c = el('div', 'booking-confirm');
    c.innerHTML =
      '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h3>Danke, deine Anfrage ist da!</h3>' +
      '<p style="color:var(--ink-soft);max-width:470px;margin:0 auto 1rem;">Deine unverbindliche Anfrage für <strong>' + when + '</strong> ist bei mir eingegangen. Ich freue mich auf unser Gespräch und melde mich zeitnah per E-Mail, um den Termin zu bestätigen.</p>' +
      '<p class="booking-hint">Fragen? Schreib mir jederzeit an <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>.</p>';
    root.appendChild(c);
  }

  if (PRESET) { state.area = PRESET; renderCal(); } else { renderArea(); }
})();
