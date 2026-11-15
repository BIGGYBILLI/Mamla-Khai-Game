import { VEHICLES } from './config.js';
import { t, money, fmtNum, getLang, setLang } from './i18n.js';
import { createLedger, applySetupFines, buildBill } from './fines.js';
import { drawVehicle, previewWidth } from './vehicles.js';

const $ = (id) => document.getElementById(id);

// True when the primary input is a finger, not a keyboard/mouse.
const isCoarsePointer = () =>
  !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);

export class UI {
  constructor({ onRide, onAgain, onMenu, onMute, onPause, onResume, onChangeVehicle }) {
    this.onRide = onRide;
    this.onAgain = onAgain;
    this.onMenu = onMenu;
    this.onMute = onMute;
    this.onPause = onPause;
    this.onResume = onResume;
    this.onChangeVehicle = onChangeVehicle;

    this.setup = { vehicleId: 'car', people: 1, seatbelt: true, helmet: true, license: true };
    this.lastLedgerVersion = -1;
    this.lastHudAt = 0;
    this.toasts = [];
    this.lastResult = null;

    this.screens = {
      menu: $('screen-menu'),
      setup: $('screen-setup'),
      result: $('screen-result'),
      hud: $('hud'),
    };

    this.el = {
      langSwitch: $('lang-switch'),
      fineList: $('fine-list'),
      fineTotal: $('fine-total'),
      fineNote: $('fine-note'),
      speed: $('speed-val'),
      limit: $('limit-val'),
      limitChip: document.querySelector('.limit-chip'),
      dist: $('dist-val'),
      lifeFill: $('life-fill'),
      warn: $('warn'),
      warnText: $('warn-text'),
      warnDist: $('warn-dist'),
      toastBox: $('toasts'),
      preview: $('vehicle-preview'),
      previewCaption: $('preview-caption'),
      cards: $('vehicle-cards'),
      options: $('options'),
      soundBtn: $('btn-sound'),
      finesPanel: $('fines'),
      pauseOverlay: $('screen-pause'),
      hudTop: document.querySelector('.hud-top'),
    };

    const saved = localStorage.getItem('mamla.lang');
    if (saved === 'bn' || saved === 'en') setLang(saved);

    this.bind();
    this.applyLanguage();
    this.syncPauseHint();
    this.trackHudHeight();
  }

  // Publish the real height of the HUD top bar so the fines card and toasts can
  // sit below it instead of guessing at a fixed offset.
  trackHudHeight() {
    const top = this.el.hudTop;
    if (!top) return;
    const sync = () => {
      const h = top.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--hud-top', h + 'px');
    };
    this.syncHudHeight = sync;
    sync();
    if (window.ResizeObserver) {
      this.hudObserver = new ResizeObserver(sync);   // keep the ref: an unheld observer is collected
      this.hudObserver.observe(top);
    }
    // rotation and browser chrome changes do not always reach the observer
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
  }

  bind() {
    $('btn-play').addEventListener('click', () => this.showSetup());
    $('btn-back').addEventListener('click', () => this.showMenu());
    $('btn-ride').addEventListener('click', () => this.onRide(this.setup));
    $('btn-again').addEventListener('click', () => this.onAgain(this.setup));
    $('btn-change').addEventListener('click', () => this.showSetup());
    $('btn-sound').addEventListener('click', () => {
      const muted = this.onMute();
      this.el.soundBtn.classList.toggle('off', muted);
      this.el.soundBtn.textContent = muted ? '×' : '♪';
    });
    $('btn-fines').addEventListener('click', () => this.el.finesPanel.classList.toggle('open'));
    $('btn-pause').addEventListener('click', () => this.onPause?.());
    $('btn-resume').addEventListener('click', () => this.onResume?.());
    $('btn-pause-change').addEventListener('click', () => this.onChangeVehicle?.());

    for (const btn of this.el.langSwitch.querySelectorAll('button')) {
      btn.addEventListener('click', () => {
        setLang(btn.dataset.lang);
        try {
          localStorage.setItem('mamla.lang', btn.dataset.lang);
        } catch (err) {
          /* private mode */
        }
        this.applyLanguage();
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  language                                                         */
  /* ---------------------------------------------------------------- */

  applyLanguage() {
    document.documentElement.lang = getLang();
    document.title = t('brand') + ' — 300 Feet, Dhaka';

    for (const node of document.querySelectorAll('[data-i18n]')) {
      node.textContent = t(node.dataset.i18n);
    }
    for (const btn of this.el.langSwitch.querySelectorAll('button')) {
      btn.classList.toggle('active', btn.dataset.lang === getLang());
    }

    this.syncControls();
    this.buildVehicleCards();
    this.renderOptions();
    this.refreshSetupUi();
    if (this.game) this.updateFines(this.game);
    if (this.lastResult) this.renderReceipt();
  }

  /* ---------------------------------------------------------------- */

  showMenu() {
    this.setScreen('menu');
    this.hidePause();
    this.el.finesPanel.classList.remove('open');
    this.clearToasts();
    this.onMenu?.();
  }

  showSetup() {
    this.setScreen('setup');
    this.hidePause();
    this.refreshSetupUi();
    this.el.finesPanel.classList.remove('open');
    this.clearToasts();
  }

  showHud() {
    this.setScreen('hud');
    this.syncHudHeight?.();
    this.hidePause();
    this.lastLedgerVersion = -1;
    this.updateFines(this.game);
    this.el.finesPanel.classList.remove('open');
    this.clearToasts();
    if (this.el.lifeFill) {
      this.el.lifeFill.style.width = '100%';
      this.el.lifeFill.classList.remove('warn', 'danger');
    }
  }

  showResult(bill, stats) {
    this.lastResult = { bill, stats, caseNo: 1000 + Math.floor(Math.random() * 8999) };
    this.renderReceipt();
    this.setScreen('result');
    this.hidePause();
    this.el.finesPanel.classList.remove('open');
  }

  // The start-menu legend names the controls the device actually has: keys on a
  // keyboard, the on-screen dock on a phone.
  syncControls() {
    const foot = $('menu-foot');
    if (!foot) return;
    foot.innerHTML = '';
    const row = (chips, labelKey) => {
      const span = document.createElement('span');
      for (const chip of chips) {
        const k = document.createElement('kbd');
        k.textContent = chip;
        span.appendChild(k);
      }
      if (labelKey) {
        const label = document.createElement('span');
        label.textContent = t(labelKey);
        span.appendChild(label);
      }
      foot.appendChild(span);
    };
    if (isCoarsePointer()) {
      row(['◀', '▶'], 'navSteer');
      row([t('navGas')]);
      row([t('navBrake')]);
    } else {
      row(['←', '→'], 'navSteer');
      row(['↑'], 'navGas');
      row(['↓'], 'navBrake');
      const note = document.createElement('span');
      note.className = 'hide-sm';
      note.textContent = t('navTouch');
      foot.appendChild(note);
    }
  }

  // Phones have no Esc key, so point the hint at the resume button there.
  syncPauseHint() {
    const hint = this.el.pauseOverlay.querySelector('[data-i18n^="pauseHint"]');
    if (!hint) return;
    // media query only: a touchscreen laptop with a trackpad still has Esc
    const coarse = isCoarsePointer();
    hint.dataset.i18n = coarse ? 'pauseHintTouch' : 'pauseHint';
    hint.textContent = t(hint.dataset.i18n);
  }

  showPause() {
    this.syncPauseHint();
    this.el.pauseOverlay.classList.remove('hidden');
  }

  hidePause() {
    this.el.pauseOverlay.classList.add('hidden');
  }

  renderReceipt() {
    if (!this.lastResult) return;
    const { bill, stats, caseNo } = this.lastResult;
    const list = $('receipt-list');
    list.innerHTML = '';
    for (const row of bill.rows) {
      const li = document.createElement('li');
      const label = document.createElement('div');
      label.className = 'rlabel';
      label.textContent = t('fine.' + row.key);
      if (row.detailKey) {
        const detail = document.createElement('small');
        detail.textContent = t(row.detailKey, this.localizeVars(row.detailVars));
        label.appendChild(detail);
      }
      const val = document.createElement('div');
      val.className = 'rval';
      val.textContent = money(row.amount);
      li.append(label, val);
      list.appendChild(li);
    }
    $('receipt-total').textContent = money(bill.total);
    $('result-sub').textContent = t('caseLine', { case: caseNo });
    $('receipt-stats').innerHTML = '';
    const cells = [
      [fmtNum(stats.distance), t('statDistance') + ' · ' + t('unitMeter')],
      [fmtNum(stats.topSpeed), t('statTop') + ' · ' + t('unitKmh')],
      [fmtNum(stats.checkpoints), t('statCheckpoints')],
      [fmtNum(stats.crashes), t('statCrashes')],
    ];
    for (const [value, label] of cells) {
      const cell = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = value;
      const span = document.createElement('span');
      span.textContent = label;
      cell.append(b, span);
      $('receipt-stats').appendChild(cell);
    }
  }

  setScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      el.classList.toggle('hidden', key !== name);
    }
    this.el.langSwitch.classList.toggle('hidden', name === 'hud');
  }

  /* ---------------------------------------------------------------- */

  buildVehicleCards() {
    const current = this.setup.vehicleId;
    this.el.cards.innerHTML = '';
    for (const veh of Object.values(VEHICLES)) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'vehicle-card' + (veh.id === current ? ' selected' : '');
      card.dataset.vehicle = veh.id;

      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 132;
      const ctx = canvas.getContext('2d');
      drawVehicle(ctx, veh.id, 120, 126, previewWidth(veh.id, 104, 186), {
        people: veh.defaultPeople,
        helmet: true,
        seatbelt: true,
      });

      const meta = document.createElement('div');
      meta.className = 'vehicle-meta';
      const name = document.createElement('b');
      name.textContent = t('vehicle.' + veh.id + '.name');
      const speed = document.createElement('span');
      speed.textContent = t('cardSpeed', { kmh: veh.topKmh });
      meta.append(name, speed);

      card.append(canvas, meta);
      card.addEventListener('click', () => this.selectVehicle(veh.id));
      this.el.cards.appendChild(card);
    }
  }

  selectVehicle(id, silent) {
    const veh = VEHICLES[id];
    this.setup.vehicleId = id;
    this.setup.people = veh.defaultPeople;
    this.setup.seatbelt = true;
    this.setup.helmet = true;
    for (const card of this.el.cards.children) {
      card.classList.toggle('selected', card.dataset.vehicle === id);
    }
    this.renderOptions();
    this.refreshSetupUi();
    if (!silent) this.el.options.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  renderOptions() {
    const veh = VEHICLES[this.setup.vehicleId];
    const box = this.el.options;
    box.innerHTML = '';

    // people stepper
    const peopleOpt = document.createElement('div');
    peopleOpt.className = 'opt';
    peopleOpt.innerHTML = `
      <div class="opt-head">
        <div class="opt-title"><span data-role="title"></span><small></small></div>
        <div class="stepper">
          <button type="button" data-act="dec">−</button>
          <output>0</output>
          <button type="button" data-act="inc">+</button>
        </div>
      </div>
      <p class="opt-hint"></p>
    `;
    peopleOpt.querySelector('[data-role="title"]').textContent = t('people');
    peopleOpt.querySelector('small').textContent = t('peopleMax', { n: veh.maxPeople });
    peopleOpt.querySelector('output').textContent = fmtNum(this.setup.people);

    const hint = peopleOpt.querySelector('.opt-hint');
    let bad = false;
    if (veh.id === 'bike') {
      bad = this.setup.people >= 3;
      hint.textContent = bad
        ? t('peopleBadBike', { amount: money(2500), n: this.setup.people })
        : t('peopleOkBike');
    } else {
      bad = this.setup.people > 5;
      hint.textContent = bad
        ? t('peopleBadCar', { amount: money(3000), n: this.setup.people })
        : t('peopleOkCar');
    }
    hint.classList.toggle('bad', bad);

    peopleOpt.querySelector('[data-act="dec"]').disabled = this.setup.people <= 1;
    peopleOpt.querySelector('[data-act="inc"]').disabled = this.setup.people >= veh.maxPeople;
    peopleOpt.querySelector('[data-act="dec"]').addEventListener('click', () => {
      this.setup.people = Math.max(1, this.setup.people - 1);
      this.refreshSetupUi();
    });
    peopleOpt.querySelector('[data-act="inc"]').addEventListener('click', () => {
      this.setup.people = Math.min(veh.maxPeople, this.setup.people + 1);
      this.refreshSetupUi();
    });
    box.appendChild(peopleOpt);

    if (veh.seatbelt) {
      box.appendChild(this.toggleOption('seatbelt', t('seatbelt'), t('seatbeltSub'), t('seatbeltBad', { amount: money(1000) })));
    }
    if (veh.helmet) {
      box.appendChild(this.toggleOption('helmet', t('helmet'), t('helmetSub'), t('helmetBad', { amount: money(1000) })));
    }
    box.appendChild(
      this.toggleOption('license', t('licence'), t('licenceSub'), t('licenceBad', { amount: money(25000) }))
    );

    this.updateEstimate();
  }

  toggleOption(key, title, subtitle, badHint) {
    const div = document.createElement('div');
    div.className = 'opt';
    const on = this.setup[key];
    div.innerHTML = `
      <div class="opt-head">
        <div class="opt-title"><span data-role="title"></span><small></small></div>
        <button class="switch" type="button"></button>
      </div>
      <p class="opt-hint"></p>
    `;
    div.querySelector('[data-role="title"]').textContent = title;
    div.querySelector('small').textContent = subtitle;
    const btn = div.querySelector('.switch');
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', title);
    const hint = div.querySelector('.opt-hint');
    hint.textContent = on ? t('legal') : badHint;
    hint.classList.toggle('bad', !on);
    btn.addEventListener('click', () => {
      this.setup[key] = !this.setup[key];
      this.refreshSetupUi();
    });
    return div;
  }

  updateEstimate() {
    const ledger = createLedger();
    applySetupFines(ledger, this.setup.vehicleId, this.setup);
    const bill = buildBill(ledger, this.setup);
    let el = $('setup-estimate');
    if (!el) {
      el = document.createElement('div');
      el.id = 'setup-estimate';
      el.style.cssText =
        'margin-top:12px;text-align:center;font:11px/1.6 var(--mono);letter-spacing:.06em;color:#8f8c9d';
      document.querySelector('.setup-actions').appendChild(el);
    }
    if (bill.total) {
      el.innerHTML = '';
      const line = document.createElement('div');
      line.textContent = t('pendingRecord', { amount: money(bill.total) });
      line.style.color = '#ffb524';
      line.style.fontSize = '12px';
      const sub = document.createElement('div');
      sub.style.opacity = '0.7';
      sub.textContent =
        bill.rows.length > 1 ? t('pendingMany', { n: bill.rows.length }) : t('pendingOne');
      el.append(line, sub);
    } else {
      el.textContent = t('cleanRecord', {
        vehicle: t('vehicle.' + this.setup.vehicleId + '.name'),
        n: this.setup.people,
      });
    }
  }

  refreshSetupUi() {
    this.renderOptions();
    this.drawPreview();
    const veh = VEHICLES[this.setup.vehicleId];
    this.el.previewCaption.textContent =
      t('vehicle.' + veh.id + '.name') + ' · ' + fmtNum(veh.topKmh) + ' ' + t('unitKmh');
  }

  drawPreview() {
    const canvas = this.el.preview;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const veh = VEHICLES[this.setup.vehicleId];
    drawVehicle(ctx, veh.id, canvas.width / 2, canvas.height - 26, previewWidth(veh.id, 194, 310), {
      people: this.setup.people,
      helmet: this.setup.helmet,
      seatbelt: this.setup.seatbelt,
    });
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(40, canvas.height - 22, canvas.width - 80, 1);
  }

  /* ---------------------------------------------------------------- */

  // vehicle kinds reach us as raw ids ("truck"); show them in the current language
  localizeVars(vars) {
    if (!vars || !vars.kind) return vars;
    return { ...vars, kind: t('kind.' + vars.kind) };
  }

  toast(key, vars, kind = 'bad') {
    const div = document.createElement('div');
    div.className = 'toast ' + (kind === 'bad' ? '' : kind);
    div.textContent = t(key, this.localizeVars(vars));
    this.el.toastBox.appendChild(div);
    this.toasts.push(div);
    if (this.toasts.length > 3) {
      const old = this.toasts.shift();
      old.remove();
    }
    setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => div.remove(), 320);
    }, 2600);
  }

  clearToasts() {
    for (const toast of this.toasts) toast.remove();
    this.toasts.length = 0;
    this.el.toastBox.innerHTML = '';
  }

  update(game, now) {
    this.game = game;
    if (this.screens.hud.classList.contains('hidden')) return;
    if (now - this.lastHudAt < 70) return;
    this.lastHudAt = now;

    const kmh = Math.round(game.kmh);
    this.el.speed.textContent = fmtNum(kmh);
    this.el.limit.textContent = fmtNum(game.vehicle.limit);
    this.el.limitChip.classList.toggle('over', kmh > game.vehicle.limit);
    this.el.dist.textContent = fmtNum(Math.round(game.distance * 0.004));

    if (this.el.lifeFill) {
      const pct = Math.round(game.lifePct * 100);
      this.el.lifeFill.style.width = pct + '%';
      this.el.lifeFill.classList.toggle('warn', pct <= 60 && pct > 30);
      this.el.lifeFill.classList.toggle('danger', pct <= 30);
    }

    const cp = game.checkpoint;
    if (cp && cp.distance > -400 && cp.distance < 30000) {
      this.el.warn.classList.remove('hidden');
      this.el.warnText.textContent = t('checkpost') + ' · ' + t('levelShort') + ' ' + fmtNum(cp.level);
      this.el.warnDist.textContent = fmtNum(Math.max(0, Math.round(cp.distance * 0.004))) + ' ' + t('unitMeter');
    } else {
      this.el.warn.classList.add('hidden');
    }

    if (game.ledger && game.ledger.version !== this.lastLedgerVersion) {
      this.updateFines(game);
    }
  }

  updateFines(game) {
    if (!game || !game.ledger) return;
    this.lastLedgerVersion = game.ledger.version;
    const list = this.el.fineList;
    list.innerHTML = '';

    if (!game.ledger.items.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = t('noCases');
      list.appendChild(li);
    } else {
      for (const item of game.ledger.items) {
        const li = document.createElement('li');

        const name = document.createElement('span');
        name.className = 'fname';
        name.textContent = t('fine.' + item.key);

        const amount = document.createElement('span');
        amount.className = 'famt';
        amount.textContent = money(item.amount);

        const detail = document.createElement('span');
        detail.className = 'fbn';
        let text = item.detailKey ? t(item.detailKey, this.localizeVars(item.detailVars)) : '';
        if (item.count > 1) text += (text ? ' · ' : '') + '×' + fmtNum(item.count);
        detail.textContent = text;

        li.append(name, amount, detail);
        list.appendChild(li);
      }
    }

    this.el.fineTotal.textContent = money(game.totalFine());
    this.el.fineNote.textContent = game.setup.license ? t('notePending') : t('noteLicence');
  }
}
