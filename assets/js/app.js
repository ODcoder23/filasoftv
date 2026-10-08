/* =========================================================
   FilasofTV — Telegram Mini App (faqat frontend, demo rejim)
   Preact + htm, build bosqichisiz ishlaydi.
   ========================================================= */
(function () {
  'use strict';

  const { html, render, Component } = window.htmPreact;
  const D = window.FTV.data;
  const I = window.FTV.icons;

  const STORE_KEY = 'filasoftv:v1';
  const DAY = 86400000;
  const NBSP = ' ';
  const GOLD_SCREENS = ['pay', 'topup', 'gift', 'donate'];
  const SCREENS = ['home', 'search', 'bonus', 'support', 'settings', 'history', 'library', 'detail', 'donate', 'pay', 'topup', 'gift'];
  const PERSIST = ['lang', 'saved', 'watched', 'balance', 'coins', 'sub', 'txns', 'usedCodes', 'dailyAt', 'phone'];
  const DEFAULT_SAVED = [2, 7];

  /* ---------------- i18n & formatting ---------------- */
  let lang = 'uz';

  function t(key, vars) {
    let s = D.STRINGS[lang] && D.STRINGS[lang][key];
    if (s == null) s = D.STRINGS.uz[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  const fmt = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const money = (n) => fmt(n) + NBSP + t('som');
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const fmtDate = (ts) => { const d = new Date(ts); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const fmtDateTime = (ts) => { const d = new Date(ts); return fmtDate(ts) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  const cx = (...parts) => parts.filter(Boolean).join(' ');
  const norm = (str) => str.toLowerCase().replace(/[ʻʼ'`‘’]/g, "'").trim();
  const byId = (id) => D.CATALOG.find((m) => m.id === id) || null;
  const onEnter = (fn) => (e) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } };

  /* ---------------- domain helpers ---------------- */
  let txSeq = 0;
  function addTx(list, tx) {
    const entry = Object.assign({ id: Date.now().toString(36) + '-' + (txSeq++), ts: Date.now() }, tx);
    return [entry].concat(list).slice(0, 100);
  }
  const activeSub = (s) => (s.sub && s.sub.until > Date.now() ? s.sub : null);
  const covers = (sub, type) => !!sub && (sub.plan === 'all' || sub.plan === D.META[type].scope);
  const dailyClaimed = (s) => !!s.dailyAt && dayKey(s.dailyAt) === dayKey(Date.now());

  function filterCatalog(s) {
    const q = norm(s.q);
    return D.CATALOG.filter((m) =>
      (s.cat === 'all' || m.type === s.cat) &&
      (!q || norm(m.title).includes(q)) &&
      (s.chip !== 'new' || m.isNew) &&
      (s.chip !== 'popular' || m.popular) &&
      (s.chip !== 'free' || m.free) &&
      (s.chip !== 'saved' || s.saved.includes(m.id)));
  }

  function detailModel(m, ep) {
    const meta = D.META[m.type];
    const year = D.YEARS[(m.id - 1) % D.YEARS.length];
    const isEp = m.type !== 'film';
    const count = m.type === 'drama' ? 16 : isEp ? (parseInt(m.badge, 10) || 12) : 2;
    const rating = m.badge.indexOf('.') < 0 ? (7 + ((m.id * 37) % 20) / 10).toFixed(1) : m.badge;
    const filmLen = t('hoursMinutes', { h: Math.floor(meta.dur / 60), m: meta.dur % 60 });
    const parts = Array.from({ length: count }, (_, i) => ({
      label: isEp ? t('episode', { n: i + 1 }) : (i === 0 ? t('fullFilm') : t('trailer')),
      dur: isEp ? t('minutes', { n: meta.dur }) : (i === 0 ? filmLen : t('minutes', { n: 2 }))
    }));
    const typeLower = t('typeLower_' + m.type);
    return {
      isEp, count, rating, year: String(year), age: meta.age, parts,
      isTrailer: !isEp && ep === 1,
      genres: meta.genres,
      durationShort: isEp ? t('episodesShort', { n: count }) : filmLen,
      watchLabel: isEp ? t('watchEp', { n: ep + 1 }) : (ep === 0 ? t('watch') : t('watchTrailer')),
      desc: isEp ? t('descSeries', { title: m.title, type: typeLower, n: count }) : t('descFilm', { title: m.title, type: typeLower }),
      facts: [
        { k: t('fact_genre'), v: meta.genres.map((g) => t('genre_' + g)).join(', ') },
        { k: t('fact_rating'), v: rating + ' / 10' },
        { k: t('fact_year'), v: String(year) },
        { k: t('fact_country'), v: t('country_' + meta.country) },
        { k: t('fact_lang'), v: t('uzbekDub') },
        { k: t('fact_age'), v: meta.age },
        { k: t('fact_access'), v: m.premium ? t('bySub') : t('freeAccess') }
      ]
    };
  }

  /* ---------------- persistence ---------------- */
  function loadStore() {
    let o;
    try { o = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { o = null; }
    if (!o || typeof o !== 'object') return {};
    const out = {};
    const ids = (a) => (Array.isArray(a) ? a.filter((id) => byId(id)) : null);
    const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : null);
    if (o.lang === 'uz' || o.lang === 'ru') out.lang = o.lang;
    if (ids(o.saved)) out.saved = ids(o.saved);
    if (ids(o.watched)) out.watched = ids(o.watched).slice(0, 50);
    if (num(o.balance) != null) out.balance = Math.round(o.balance);
    if (num(o.coins) != null) out.coins = Math.round(o.coins);
    if (o.sub && D.SCOPES.includes(o.sub.plan) && D.PERIODS.includes(o.sub.period) && num(o.sub.until)) out.sub = o.sub;
    if (Array.isArray(o.txns)) out.txns = o.txns.filter((x) => x && typeof x.amount === 'number' && (x.cur === 'som' || x.cur === 'coin') && typeof x.ts === 'number' && typeof x.kind === 'string').slice(0, 100);
    if (Array.isArray(o.usedCodes)) out.usedCodes = o.usedCodes.filter((c) => typeof c === 'string');
    if (num(o.dailyAt)) out.dailyAt = o.dailyAt;
    if (typeof o.phone === 'string') out.phone = o.phone;
    return out;
  }

  function saveStore(state) {
    try {
      const o = {};
      PERSIST.forEach((k) => { o[k] = state[k]; });
      localStorage.setItem(STORE_KEY, JSON.stringify(o));
    } catch (e) { /* private mode / storage disabled */ }
  }

  /* ---------------- environment ---------------- */
  const root = document.documentElement;
  let tg = null;

  function isTgMode() { return root.classList.contains('is-tg'); }

  function fitDevice() {
    const desktop = !isTgMode() && window.matchMedia('(min-width: 600px)').matches;
    let z = 1;
    if (desktop) {
      z = Math.min(1.33, (window.innerHeight - 36) / 750, (window.innerWidth - 32) / 366);
      z = Math.max(0.75, z);
    }
    root.style.setProperty('--zoom', String(Math.round(z * 1000) / 1000));
  }

  function haptic(kind) {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (kind === 'select') tg.HapticFeedback.selectionChanged();
      else if (kind === 'light' || kind === 'medium') tg.HapticFeedback.impactOccurred(kind);
      else tg.HapticFeedback.notificationOccurred(kind);
    } catch (e) { /* unsupported version */ }
  }

  function loadTelegram(onReady) {
    if (!isTgMode()) return;
    const leave = () => { root.classList.remove('is-tg'); fitDevice(); };
    const done = () => {
      const wa = window.Telegram && window.Telegram.WebApp;
      if (wa && wa.platform && wa.platform !== 'unknown') onReady(wa); else leave();
    };
    if (window.Telegram && window.Telegram.WebApp) return done();
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.async = true;
    s.onload = done;
    s.onerror = leave;
    document.head.appendChild(s);
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { /* ignore */ }
  }

  /* Sichqoncha bilan sudrab aylantirish + g'ildirak (desktop uchun) */
  function enableDragScroll(el) {
    if (!el || el.__ftvDrag) return;
    el.__ftvDrag = true;
    let down = false, moved = false, sx = 0, sl = 0, k = 1, pid = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; pid = e.pointerId;
      k = el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;
      if (!k || !isFinite(k)) k = 1;
    });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        el.classList.add('is-dragging');
        try { el.setPointerCapture(pid); } catch (err) { /* ignore */ }
      }
      if (moved) el.scrollLeft = sl - dx / k;
    });
    const end = () => {
      if (!down) return;
      down = false;
      el.classList.remove('is-dragging');
      try { el.releasePointerCapture(pid); } catch (err) { /* ignore */ }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
    el.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY });
    }, { passive: false });
  }

  const SCOPE_ICON = { anime: () => I.play(18), drama: () => I.tv(18), kino: () => I.film(18, 2), all: () => I.layers(18) };

  /* =========================================================
     App
     ========================================================= */
  class App extends Component {
    constructor(props) {
      super(props);
      const stored = loadStore();
      lang = stored.lang || 'uz';
      this.state = Object.assign({
        screen: 'home', hist: [], menu: false,
        cat: 'all', chip: null, q: '',
        bonusTab: 'kod', histTab: 'bal', libTab: 'saved',
        lang: 'uz', plan: 'all', period: 1,
        amount: '27000', code: '', friend: '', donAmount: '10000', donMsg: '',
        toast: null, toastId: 0,
        tgUser: null, phone: null,
        saved: DEFAULT_SAVED.slice(), watched: [], balance: 0, coins: 0, sub: null, txns: [], usedCodes: [], dailyAt: null,
        pay: null, now: Date.now(), confirm: null,
        detailId: null, ep: 0, posterIdx: 0
      }, stored);

      [
        'uiBack', 'onPopState', 'onKey', 'onResize', 'initTelegram', 'setScroller', 'partsRef', 'postersRef',
        'toggleMenu', 'closeMenu', 'closeApp', 'reload', 'resetDemo', 'setLang', 'resetFilters', 'clearQ',
        'onQ', 'onAmount', 'onDonAmount', 'onDonMsg', 'onCode', 'onFriend',
        'activateCode', 'claimDaily', 'copyInvite', 'sharePhone', 'sendGift',
        'submitTopup', 'submitDonate', 'closePayment', 'confirmPay', 'copyExact', 'copyCard',
        'buyPlan', 'confirmPrimary', 'closeConfirm', 'toggleSave', 'watch', 'donateThis'
      ].forEach((k) => { this[k] = this[k].bind(this); });
    }

    /* ---------- lifecycle ---------- */
    componentDidMount() {
      root.lang = this.state.lang;
      window.addEventListener('popstate', this.onPopState);
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('resize', this.onResize);
      loadTelegram(this.initTelegram);
    }

    componentDidUpdate(pp, ps) {
      const s = this.state;
      if (ps.screen !== s.screen || ps.detailId !== s.detailId) {
        if (this.scrollerEl) this.scrollerEl.scrollTop = 0;
      }
      if (ps.lang !== s.lang) root.lang = s.lang;
      if (tg) {
        const needBack = s.screen !== 'home' || !!s.pay || !!s.confirm;
        try { needBack ? tg.BackButton.show() : tg.BackButton.hide(); } catch (e) { /* ignore */ }
        const gold = GOLD_SCREENS.includes(s.screen);
        if (gold !== GOLD_SCREENS.includes(ps.screen)) this.paintTelegram(gold);
      }
      if (PERSIST.some((k) => ps[k] !== s[k])) saveStore(s);
    }

    componentWillUnmount() {
      clearInterval(this.payTimer);
      clearTimeout(this.toastTimer);
      clearTimeout(this.creditTimer);
      window.removeEventListener('popstate', this.onPopState);
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('resize', this.onResize);
    }

    initTelegram(wa) {
      tg = wa;
      try { wa.ready(); } catch (e) { /* ignore */ }
      try { wa.expand(); } catch (e) { /* ignore */ }
      try { if (wa.isVersionAtLeast && wa.isVersionAtLeast('7.7') && wa.disableVerticalSwipes) wa.disableVerticalSwipes(); } catch (e) { /* ignore */ }
      try { wa.BackButton.onClick(this.uiBack); } catch (e) { /* ignore */ }
      this.paintTelegram(GOLD_SCREENS.includes(this.state.screen));
      const user = (wa.initDataUnsafe && wa.initDataUnsafe.user) || null;
      this.setState({ tgUser: user });
      fitDevice();
    }

    paintTelegram(gold) {
      if (!tg || !tg.isVersionAtLeast || !tg.isVersionAtLeast('6.1')) return;
      const color = gold ? '#100f0b' : '#0f1729';
      try { tg.setHeaderColor(color); tg.setBackgroundColor(color); } catch (e) { /* ignore */ }
      try { if (tg.isVersionAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(color); } catch (e) { /* ignore */ }
    }

    onResize() { fitDevice(); }

    onKey(e) {
      if (e.key !== 'Escape') return;
      const s = this.state;
      if (s.menu) this.setState({ menu: false });
      else if (s.confirm) this.closeConfirm();
      else if (s.pay) this.closePayment();
    }

    /* ---------- navigation ---------- */
    go(screen, extra) {
      const s = this.state;
      if (s.screen === screen) {
        this.setState(Object.assign({ menu: false }, extra || {}));
        if (this.scrollerEl) this.scrollerEl.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      this.setState(Object.assign({ screen, hist: s.hist.concat(s.screen), menu: false }, extra || {}));
      try { history.pushState({ ftv: true }, ''); } catch (e) { /* ignore */ }
      haptic('select');
    }

    uiBack() {
      const s = this.state;
      if (s.menu) return this.setState({ menu: false });
      if (s.confirm) return this.closeConfirm();
      if (s.pay) return this.closePayment();
      if (s.hist.length) history.back();
      else if (s.screen !== 'home') this.setState({ screen: 'home' });
    }

    onPopState() {
      const s = this.state;
      if (s.menu || s.confirm || s.pay) {
        // Faqat ochiq oynani yopamiz va tarixdagi qadamni tiklaymiz
        this.setState({ menu: false, confirm: null });
        if (s.pay) this.closePayment();
        try { history.pushState({ ftv: true }, ''); } catch (e) { /* ignore */ }
        return;
      }
      this.setState((st) => {
        const h = st.hist.slice();
        return { screen: h.pop() || 'home', hist: h };
      });
    }

    toggleMenu() { this.setState((s) => ({ menu: !s.menu })); }
    closeMenu() { this.setState({ menu: false }); }
    reload() { window.location.reload(); }
    closeApp() {
      if (tg) { try { tg.close(); } catch (e) { /* ignore */ } return; }
      this.toast(t('t_closeHint'));
    }

    resetDemo() {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      this.setState({
        menu: false, saved: DEFAULT_SAVED.slice(), watched: [], balance: 0, coins: 0, sub: null,
        txns: [], usedCodes: [], dailyAt: null, phone: null
      });
      this.toast(t('t_reset'));
    }

    setLang(l) { lang = l; this.setState({ lang: l }); haptic('select'); }

    /* ---------- feedback ---------- */
    toast(msg) {
      clearTimeout(this.toastTimer);
      this.setState((s) => ({ toast: msg, toastId: s.toastId + 1 }));
      this.toastTimer = setTimeout(() => this.setState({ toast: null }), 2200);
    }

    copy(text, msgKey) {
      const done = () => this.toast(t(msgKey));
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, () => { legacyCopy(text); done(); });
          haptic('light');
          return;
        }
      } catch (e) { /* fall through */ }
      legacyCopy(text);
      done();
      haptic('light');
    }

    /* ---------- refs ---------- */
    setScroller(el) { this.scrollerEl = el; }
    partsRef(el) { if (el) enableDragScroll(el); }
    postersRef(el) {
      this.postersEl = el;
      if (!el) return;
      enableDragScroll(el);
      if (el.__ftvIdx) return;
      el.__ftvIdx = true;
      el.addEventListener('scroll', () => {
        const i = Math.round(el.scrollLeft / (el.clientWidth + 10));
        if (i !== this.state.posterIdx) this.setState({ posterIdx: i });
      }, { passive: true });
    }
    scrollPoster(i) {
      const el = this.postersEl;
      if (el) el.scrollTo({ left: i * (el.clientWidth + 10), behavior: 'smooth' });
    }

    /* ---------- inputs ---------- */
    onQ(e) { this.setState({ q: e.currentTarget.value }); }
    clearQ() { this.setState({ q: '' }); }
    resetFilters() { this.setState({ q: '', chip: null, cat: 'all' }); }
    digits(e) {
      const el = e.currentTarget;
      const v = el.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
      if (v !== el.value) el.value = v;
      return v;
    }
    onAmount(e) { this.setState({ amount: this.digits(e) }); }
    onDonAmount(e) { this.setState({ donAmount: this.digits(e) }); }
    onDonMsg(e) { this.setState({ donMsg: e.currentTarget.value }); }
    onCode(e) { this.setState({ code: e.currentTarget.value }); }
    onFriend(e) { this.setState({ friend: e.currentTarget.value }); }

    /* ---------- bonus & gifts ---------- */
    activateCode() {
      const code = this.state.code.trim().toUpperCase();
      if (!code) return;
      if (this.state.usedCodes.includes(code)) { haptic('error'); return this.toast(t('t_codeUsed')); }
      if (!/^FILASOV[A-Z0-9_-]*$/.test(code)) { haptic('error'); return this.toast(t('t_codeBad')); }
      const n = D.LIMITS.codeCoins;
      this.setState((s) => ({
        coins: s.coins + n, code: '', usedCodes: s.usedCodes.concat(code),
        txns: addTx(s.txns, { kind: 'code', cur: 'coin', amount: n, code })
      }));
      this.toast(t('t_codeOk', { n }));
      haptic('success');
    }

    claimDaily() {
      if (dailyClaimed(this.state)) return;
      const n = D.LIMITS.dailyCoins;
      this.setState((s) => ({ coins: s.coins + n, dailyAt: Date.now(), txns: addTx(s.txns, { kind: 'daily', cur: 'coin', amount: n }) }));
      this.toast(t('t_daily', { n }));
      haptic('success');
    }

    userId() { return this.state.tgUser ? String(this.state.tgUser.id) : D.DEMO_USER.id; }
    copyInvite() { this.copy('https://t.me/' + D.BOT.username + '?start=ref_' + this.userId(), 't_inviteCopied'); }

    sharePhone() {
      if (tg && tg.requestContact && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) {
        try {
          tg.requestContact((ok) => { if (ok) { this.setState({ phone: 'shared' }); haptic('success'); } });
          return;
        } catch (e) { /* fall through */ }
      }
      this.toast(t('t_openInTg'));
    }

    sendGift() {
      const name = this.state.friend.trim().replace(/^@/, '');
      if (!/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(name)) { haptic('error'); return this.toast(t('t_badUser')); }
      if (this.state.coins < D.LIMITS.giftCost) { haptic('error'); return this.toast(t('t_noCoins')); }
      const user = '@' + name;
      this.setState((s) => ({
        coins: s.coins - D.LIMITS.giftCost, friend: '',
        txns: addTx(s.txns, { kind: 'gift', cur: 'coin', amount: -D.LIMITS.giftCost, user })
      }));
      this.toast(t('t_giftSent', { user }));
      haptic('success');
    }

    /* ---------- payments ---------- */
    validAmount(v) { return v >= D.LIMITS.min && v <= D.LIMITS.max; }
    submitTopup() { const v = +this.state.amount; if (this.validAmount(v)) this.openPayment(v, 'topup'); }
    submitDonate() { const v = +this.state.donAmount; if (this.validAmount(v)) this.openPayment(v, 'donat'); }

    openPayment(base, kind) {
      const exact = base + 1 + Math.floor(Math.random() * 999);
      this.setState({ pay: { base, exact, kind, expires: Date.now() + D.PAYMENT.ttlMinutes * 60000 }, now: Date.now(), menu: false });
      clearInterval(this.payTimer);
      this.payTimer = setInterval(() => this.setState({ now: Date.now() }), 1000);
      haptic('light');
    }

    closePayment() {
      clearInterval(this.payTimer);
      this.payTimer = null;
      this.setState({ pay: null });
    }

    confirmPay() {
      const p = this.state.pay;
      if (!p) return;
      if (Date.now() >= p.expires) return this.openPayment(p.base, p.kind);
      this.closePayment();
      if (p.kind === 'donat') {
        this.setState({ donMsg: '' });
        this.toast(t('t_donChecking'));
        haptic('success');
        return;
      }
      this.toast(t('t_checking'));
      clearTimeout(this.creditTimer);
      // Demo: backend yo'q, shuning uchun to'lov biroz kutib "tasdiqlanadi"
      this.creditTimer = setTimeout(() => {
        this.setState((s) => ({ balance: s.balance + p.exact, txns: addTx(s.txns, { kind: 'topup', cur: 'som', amount: p.exact }) }));
        this.toast(t('t_credited', { sum: money(p.exact) }));
        haptic('success');
      }, 1600);
    }

    copyExact() { const p = this.state.pay; if (p) this.copy(String(p.exact), 't_sumCopied'); }
    copyCard() { this.copy(D.PAYMENT.card.replace(/\s/g, ''), 't_cardCopied'); }

    buyPlan() { this.setState({ confirm: 1 }); haptic('light'); }
    closeConfirm() { this.setState({ confirm: null }); }

    confirmPrimary() {
      const s = this.state;
      const c = s.confirm;
      const price = D.PRICES[s.plan][s.period];
      if (c === 1) { haptic('light'); return this.setState({ confirm: 2 }); }
      if (c === 2) {
        if (s.balance < price) { haptic('error'); return this.setState({ confirm: 'nobal' }); }
        const now = Date.now();
        const cur = activeSub(s);
        const from = cur && cur.plan === s.plan ? cur.until : now;
        const bonus = D.LIMITS.planCoinsPerMonth * s.period;
        let txns = addTx(s.txns, { kind: 'plan', cur: 'som', amount: -price, plan: s.plan, period: s.period });
        txns = addTx(txns, { kind: 'planBonus', cur: 'coin', amount: bonus });
        this.setState({
          confirm: 'done', balance: s.balance - price, coins: s.coins + bonus, txns,
          sub: { plan: s.plan, period: s.period, until: from + s.period * 30 * DAY }
        });
        haptic('success');
        return;
      }
      if (c === 'nobal') {
        this.setState({ confirm: null, amount: String(Math.max(D.LIMITS.min, price - s.balance)) });
        return this.go('topup');
      }
      this.setState({ confirm: null });
    }

    /* ---------- detail ---------- */
    openDetail(id) { this.go('detail', { detailId: id, ep: 0, posterIdx: 0 }); }

    toggleSave() {
      const id = this.state.detailId;
      if (!id) return;
      this.setState((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : s.saved.concat(id) }));
      haptic('light');
    }

    watch() {
      const s = this.state;
      const m = byId(s.detailId);
      if (!m) return;
      const trailer = m.type === 'film' && s.ep === 1;
      if (m.premium && !trailer && !covers(activeSub(s), m.type)) {
        this.toast(t('t_subOnly'));
        haptic('warning');
        return this.go('pay', { plan: D.META[m.type].scope });
      }
      this.toast(t('t_player'));
      haptic('light');
      if (!trailer) this.setState((st) => ({ watched: [m.id].concat(st.watched.filter((x) => x !== m.id)).slice(0, 50) }));
    }

    donateThis() {
      const m = byId(this.state.detailId);
      if (m) this.go('donate', { donMsg: t('donateFor', { title: m.title }) });
    }

    /* =========================================================
       Render
       ========================================================= */
    render() {
      const s = this.state;
      lang = s.lang;
      const gold = GOLD_SCREENS.includes(s.screen);
      const showUser = s.screen !== 'settings' && s.screen !== 'detail';
      return html`
        <div class="stage">
          <div class=${cx('device', gold && 'is-gold')}>
            ${this.renderChrome()}
            <div class="view">
              ${gold ? html`<div class="gold-glow"></div>` : null}
              <div class="scroller" ref=${this.setScroller}>
                ${showUser ? this.renderUserBar() : null}
                <main class="page">${this.renderScreen()}</main>
              </div>
              ${gold ? this.renderGoldDock() : this.renderDock()}
              ${s.pay ? this.renderPaySheet() : null}
              ${s.confirm ? this.renderConfirm() : null}
              ${s.toast ? html`<div class="toast" key=${'toast-' + s.toastId} role="status">${s.toast}</div>` : null}
            </div>
            <div class="tg-foot">@${D.BOT.username}</div>
            ${s.menu ? this.renderMenu() : null}
          </div>
        </div>`;
    }

    renderChrome() {
      const s = this.state;
      return html`
        <header class="tg-bar">
          ${s.screen !== 'home'
            ? html`<button class="tg-bar__btn" type="button" onClick=${this.uiBack} aria-label=${t('back')}>${I.back(19)}</button>`
            : null}
          <div class="tg-bar__title">FilasofTV</div>
          <button class="tg-bar__btn" type="button" onClick=${this.toggleMenu} aria-label=${t('menu')} aria-haspopup="menu" aria-expanded=${s.menu ? 'true' : 'false'}>${I.dots(17)}</button>
          <button class="tg-bar__btn tg-bar__close" type="button" onClick=${this.closeApp} aria-label=${t('close')}>${I.close(17)}</button>
        </header>`;
    }

    renderMenu() {
      return html`
        <div class="menu-layer" onClick=${this.closeMenu}>
          <div class="menu" role="menu" onClick=${(e) => e.stopPropagation()}>
            <button class="menu__item" type="button" role="menuitem" onClick=${() => this.go('settings')}>${I.user(16)}${t('nav_settings')}</button>
            <button class="menu__item" type="button" role="menuitem" onClick=${() => this.go('support')}>${I.headset(16)}${t('support')}</button>
            <button class="menu__item" type="button" role="menuitem" onClick=${this.reload}>${I.reload(16)}${t('menuReload')}</button>
            <button class="menu__item menu__item--danger" type="button" role="menuitem" onClick=${this.resetDemo}>${I.trash(16)}${t('menuReset')}</button>
          </div>
        </div>`;
    }

    user() {
      const u = this.state.tgUser;
      if (!u) return { name: D.DEMO_USER.name, handle: D.DEMO_USER.handle, id: D.DEMO_USER.id, photo: '', initial: D.DEMO_USER.name.charAt(0).toUpperCase() };
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || (u.username ? '@' + u.username : 'User');
      return { name, handle: u.username ? '@' + u.username : '', id: String(u.id), photo: u.photo_url || '', initial: name.replace(/^@/, '').charAt(0).toUpperCase() };
    }

    avatar(u, large) {
      return html`<span class=${cx('avatar', large && 'avatar--lg')} aria-hidden="true">
        ${u.photo ? html`<img class="avatar__img" src=${u.photo} alt="" referrerpolicy="no-referrer"/>` : html`<span>${u.initial}</span>`}
      </span>`;
    }

    renderUserBar() {
      const s = this.state;
      const u = this.user();
      return html`
        <div class="userbar">
          <div class="userbar__who">
            ${this.avatar(u, false)}
            <span class="userbar__text">
              <strong class="userbar__name">${u.name}</strong>
              ${u.handle ? html`<small class="userbar__handle">${u.handle}</small>` : null}
            </span>
          </div>
          <button class="coin-pill" type="button" onClick=${() => this.go('bonus', { bonusTab: 'coin' })} aria-label=${t('bonusTitle') + ': ' + s.coins}>
            <span class="coin"></span>${fmt(s.coins)}
          </button>
        </div>`;
    }

    renderScreen() {
      switch (this.state.screen) {
        case 'search': return this.screenCatalog(false);
        case 'bonus': return this.screenBonus();
        case 'support': return this.screenSupport();
        case 'settings': return this.screenSettings();
        case 'history': return this.screenHistory();
        case 'library': return this.screenLibrary();
        case 'detail': return this.screenDetail();
        case 'donate': return this.screenDonate();
        case 'pay': return this.screenPay();
        case 'topup': return this.screenTopup();
        case 'gift': return this.screenGift();
        default: return this.screenCatalog(true);
      }
    }

    /* ---------- shared pieces ---------- */
    seg(options, value, onChange) {
      return html`
        <div class="seg" role="tablist">
          ${options.map(([v, label]) => html`
            <button class=${cx('seg__btn', value === v && 'is-active')} type="button" role="tab" key=${v}
              aria-selected=${value === v ? 'true' : 'false'} onClick=${() => onChange(v)}>${label}</button>`)}
        </div>`;
    }

    row(o) {
      return html`
        <button class="row" type="button" onClick=${o.onClick} disabled=${!!o.disabled}>
          <span class=${cx('tile', o.gold && 'tile--gold')}>${o.tile}</span>
          <span class="row__body"><strong class="row__title">${o.title}</strong><small class="row__sub">${o.sub}</small></span>
          <span class="row__end">${o.end || I.chevron(16)}</span>
        </button>`;
    }

    posterCard(m, inLibrary) {
      return html`
        <button class="card" type="button" key=${m.id} onClick=${() => this.openDetail(m.id)}>
          <span class="poster" style=${'--h:' + m.hue}>
            <span class="poster__icon">${I.film(26)}</span>
            ${m.premium ? html`<span class="poster__premium" title="Premium">${I.starBadge(11)}</span>` : null}
            <span class="poster__badge">${m.badge}</span>
            ${!inLibrary && m.isNew ? html`<span class="poster__new">${t('newTag')}</span>` : null}
          </span>
          <span class="card__title">${m.title}</span>
        </button>`;
    }

    amountPills(values, current, onPick) {
      return html`
        <div class="pills">
          ${values.map((v) => html`
            <button class=${cx('pill pill--gold', current === String(v) && 'is-active')} type="button" key=${v}
              onClick=${() => onPick(String(v))}>${fmt(v)}</button>`)}
        </div>`;
    }

    amountError(raw) {
      if (!raw) return '';
      const v = +raw;
      if (v < D.LIMITS.min) return '';
      if (v > D.LIMITS.max) return t('amountMax');
      return '';
    }

    /* ---------- screens ---------- */
    screenCatalog(isHome) {
      const s = this.state;
      const list = filterCatalog(s);
      const filtered = !!(s.q.trim() || s.chip || s.cat !== 'all');
      return html`
        <section class="screen" key=${s.screen}>
          ${isHome ? html`
            <div class="balance-card">
              <span class="balance-card__label">${t('balance')}</span>
              <div class="balance-card__amount">${fmt(s.balance)} <span class="balance-card__cur">${t('som')}</span></div>
              <div class="balance-card__actions">
                <button class="qa" type="button" onClick=${() => this.go('topup')}>${I.wallet(18)}<span class="qa__label">${t('topup')}</span></button>
                <button class="qa" type="button" onClick=${() => this.go('bonus', { bonusTab: 'kod' })}>${I.ticket(18)}<span class="qa__label">${t('bonusCodes')}</span></button>
                <button class="qa" type="button" onClick=${() => this.go('support')}>${I.headset(18)}<span class="qa__label">${t('support')}</span></button>
              </div>
            </div>` : null}
          <h1 class="title">${t(isHome ? 'catalog' : 'search')}</h1>
          <div class="cats">
            ${D.CATEGORIES.map((c) => html`
              <button class=${cx('cat', s.cat === c && 'is-active')} type="button" key=${c}
                aria-pressed=${s.cat === c ? 'true' : 'false'} onClick=${() => this.setState({ cat: c })}>${t('cat_' + c)}</button>`)}
          </div>
          <div class="searchbox">
            ${I.search(16)}
            <input class="searchbox__input" type="text" inputmode="search" enterkeyhint="search" autocomplete="off"
              value=${s.q} onInput=${this.onQ} onKeyDown=${onEnter((() => document.activeElement && document.activeElement.blur()))}
              placeholder=${t('searchPh')} aria-label=${t('search')}/>
            ${s.q ? html`<button class="searchbox__clear" type="button" onClick=${this.clearQ} aria-label=${t('clear')}>${I.xCircle(15)}</button>` : null}
          </div>
          <div class="chips">
            ${D.CHIPS.map((c) => html`
              <button class=${cx('pill', s.chip === c && 'is-active')} type="button" key=${c}
                aria-pressed=${s.chip === c ? 'true' : 'false'} onClick=${() => this.setState({ chip: s.chip === c ? null : c })}>${t('chip_' + c)}</button>`)}
          </div>
          <div class="toolbar" aria-live="polite">${t('results', { n: list.length })}</div>
          ${list.length
            ? html`<div class="grid">${list.map((m) => this.posterCard(m, false))}</div>`
            : html`<div class="empty">
                ${I.search(30)}
                <span>${t('nothingFound')}</span>
                ${filtered ? html`<button class="link" type="button" onClick=${this.resetFilters}>${t('resetFilters')}</button>` : null}
              </div>`}
        </section>`;
    }

    screenBonus() {
      const s = this.state;
      const claimed = dailyClaimed(s);
      return html`
        <section class="screen" key="bonus">
          <h1 class="title">${t('bonusTitle')}</h1>
          <div class="stat-card">
            <span class="coin"></span>
            <strong class="stat-card__value">${fmt(s.coins)}</strong>
            <span class="stat-card__unit">${t('coin')}</span>
            <button class="stat-card__gift" type="button" onClick=${() => this.go('gift')} aria-label=${t('giftPlan')}>${I.gift(20)}</button>
          </div>
          ${this.seg([['coin', t('tabCollect')], ['kod', t('tabCode')]], s.bonusTab, (v) => this.setState({ bonusTab: v }))}
          ${s.bonusTab === 'kod'
            ? html`<div class="form" key="kod">
                <label class="field">${t('enterCode')}
                  <input class="input input--upper" value=${s.code} onInput=${this.onCode} onKeyDown=${onEnter(this.activateCode)}
                    placeholder="FILASOV..." autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="32"/>
                </label>
                <p class="form-hint">${t('codeHint')}</p>
                <button class="btn" type="button" disabled=${!s.code.trim()} onClick=${this.activateCode}>${t('activate')}</button>
              </div>`
            : html`<div class="list" key="coin">
                ${this.row({ tile: I.play(18), title: t('planBuy'), sub: t('planBuySub'), onClick: () => this.go('pay') })}
                ${this.row({ tile: html`<span class="coin-glyph">F</span>`, gold: true, title: t('daily'), sub: claimed ? t('dailyDone') : t('dailySub'), onClick: this.claimDaily, disabled: claimed })}
                ${this.row({ tile: I.users(18), title: t('invite'), sub: t('inviteCopySub'), onClick: this.copyInvite, end: I.copy(15, '#4b5971') })}
              </div>`}
          <div class="note">${t('giftNote')}</div>
        </section>`;
    }

    screenSupport() {
      return html`
        <section class="screen" key="support">
          <h1 class="title">${t('support')}</h1>
          <div class="panel">
            <span class="tile">${I.headset(20)}</span>
            <h2 class="panel__title">${t('supportTitle')}</h2>
            <p class="panel__text">${t('supportText')}</p>
            <div class="note">${t('supportSoon')}</div>
          </div>
        </section>`;
    }

    screenSettings() {
      const s = this.state;
      const u = this.user();
      const sub = activeSub(s);
      const planLabel = sub
        ? t('scope_' + sub.plan) + ' · ' + t('until', { date: fmtDate(sub.until) })
        : t('choosePlan');
      return html`
        <section class="screen" key="settings">
          <div class="profile">
            <div class="profile__head">
              ${this.avatar(u, true)}
              <div class="profile__who">
                <h1 class="profile__name">${u.name}</h1>
                ${u.handle ? html`<span class="profile__handle">${u.handle}</span>` : null}
                <button class="profile__id" type="button" onClick=${() => this.copy(u.id, 't_idCopied')}>ID: ${u.id}${I.copy(10)}</button>
              </div>
            </div>
            <div class="profile__stats">
              <button class="mini-stat" type="button" onClick=${() => this.go('topup')}>
                <small class="mini-stat__label">${t('balanceCaps')}</small>
                <strong class="mini-stat__value">${fmt(s.balance)} <span class="mini-stat__cur">${t('som')}</span></strong>
              </button>
              <button class="mini-stat" type="button" onClick=${() => this.go('bonus', { bonusTab: 'coin' })}>
                <small class="mini-stat__label">${t('coinCaps')}</small>
                <strong class="mini-stat__value mini-stat__value--coin">${fmt(s.coins)}</strong>
              </button>
            </div>
          </div>

          <div class="section-label">${t('phoneCaps')}</div>
          <button class=${cx('phone-btn', s.phone && 'is-done')} type="button" onClick=${this.sharePhone}>
            <span class="tile">${s.phone ? I.check(18) : I.phone(18)}</span>${s.phone ? t('phoneShared') : t('sharePhone')}
          </button>

          <div class="section-label">${t('langCaps')}</div>
          ${this.seg([['uz', 'Oʻzbekcha'], ['ru', 'Русский']], s.lang, this.setLang)}

          <div class="section-label">${t('servicesCaps')}</div>
          <div class="list">
            ${this.row({ tile: I.users(18), title: t('invite'), sub: t('inviteSub'), onClick: this.copyInvite })}
            ${this.row({ tile: I.ticket(18), gold: true, title: t('bonusCodes'), sub: t('bonusCodesSub'), onClick: () => this.go('bonus', { bonusTab: 'kod' }) })}
            ${this.row({ tile: I.gift(18), gold: true, title: t('giftPlan'), sub: t('giftPlanSub'), onClick: () => this.go('gift') })}
            ${this.row({ tile: I.history(18), title: t('history'), sub: t('historySub'), onClick: () => this.go('history') })}
            ${this.row({ tile: I.bookmark(18), title: t('library'), sub: t('librarySub'), onClick: () => this.go('library') })}
            ${this.row({ tile: I.play(18), title: t('myPlan'), sub: planLabel, onClick: () => this.go('pay') })}
            ${this.row({ tile: I.headset(18), title: t('support'), sub: t('supportSub'), onClick: () => this.go('support') })}
          </div>
        </section>`;
    }

    txRow(x) {
      const plus = x.amount > 0;
      let title;
      if (x.kind === 'plan') title = t('tx_plan', { plan: t('scope_' + x.plan) + ' · ' + t('period_' + x.period) });
      else if (x.kind === 'code') title = t('tx_code', { code: x.code });
      else if (x.kind === 'gift') title = t('tx_gift', { user: x.user });
      else title = t('tx_' + x.kind);
      const icons = {
        topup: () => I.wallet(18), plan: () => I.play(18), planBonus: () => I.starSolid(16),
        daily: () => html`<span class="coin-glyph">F</span>`, code: () => I.ticket(18), gift: () => I.gift(18)
      };
      const icon = (icons[x.kind] || icons.topup)();
      const unit = x.cur === 'som' ? t('som') : t('coin');
      return html`
        <div class="row" key=${x.id}>
          <span class=${cx('tile', x.cur === 'coin' && 'tile--gold')}>${icon}</span>
          <span class="row__body"><strong class="row__title">${title}</strong><small class="row__sub">${fmtDateTime(x.ts)}</small></span>
          <span class=${cx('row__amount', plus ? 'is-plus' : 'is-minus')}>${(plus ? '+' : '−') + fmt(x.amount) + NBSP + unit}</span>
        </div>`;
    }

    screenHistory() {
      const s = this.state;
      const cur = s.histTab === 'bal' ? 'som' : 'coin';
      const items = s.txns.filter((x) => x.cur === cur);
      return html`
        <section class="screen" key="history">
          <h1 class="title">${t('history')}</h1>
          ${this.seg([['bal', t('tabBalance')], ['coin', t('tabCoin')]], s.histTab, (v) => this.setState({ histTab: v }))}
          ${items.length
            ? html`<div class="list">${items.map((x) => this.txRow(x))}</div>`
            : html`<div class="empty">
                ${I.history(30, '#4b5971', 1.8)}
                <span>${t(cur === 'som' ? 'noBalanceTx' : 'noCoinTx')}</span>
                ${cur === 'som'
                  ? html`<button class="link" type="button" onClick=${() => this.go('topup')}>${t('topup')}</button>`
                  : html`<button class="link" type="button" onClick=${() => this.go('bonus', { bonusTab: 'coin' })}>${t('tabCollect')}</button>`}
              </div>`}
        </section>`;
    }

    screenLibrary() {
      const s = this.state;
      const items = s.libTab === 'saved'
        ? D.CATALOG.filter((m) => s.saved.includes(m.id))
        : s.watched.map(byId).filter(Boolean);
      return html`
        <section class="screen" key="library">
          <h1 class="title">${t('library')}</h1>
          ${this.seg([['saved', t('tabSaved')], ['watched', t('tabWatched')]], s.libTab, (v) => this.setState({ libTab: v }))}
          ${items.length
            ? html`<div class="grid grid--lib">${items.map((m) => this.posterCard(m, true))}</div>`
            : html`<div class="empty">
                ${I.bookmark(30, false, '#4b5971', 1.8)}
                <span>${s.libTab === 'saved' ? t('noSaved') : t('noWatched')}</span>
                <button class="link" type="button" onClick=${() => this.go('search')}>${t('openCatalog')}</button>
              </div>`}
        </section>`;
    }

    screenDetail() {
      const s = this.state;
      const m = byId(s.detailId);
      if (!m) {
        return html`
          <section class="screen" key="detail-missing">
            <div class="empty"><span>${t('nothingFound')}</span>
              <button class="link" type="button" onClick=${() => this.go('search')}>${t('openCatalog')}</button></div>
          </section>`;
      }
      const d = detailModel(m, s.ep);
      const isSaved = s.saved.includes(m.id);
      return html`
        <section class="screen screen--detail hue" key=${'detail-' + m.id} style=${'--h:' + m.hue}>
          <div class="cover">
            <span class="cover__shade"></span>
            <span class=${cx('cover__tier', !m.premium && 'cover__tier--free')}>${m.premium ? t('tierPremium') : t('tierFree')}</span>
            <button class=${cx('cover__save', isSaved && 'is-active')} type="button" onClick=${this.toggleSave}
              aria-pressed=${isSaved ? 'true' : 'false'} aria-label=${isSaved ? t('unsave') : t('save')}>${I.bookmark(16, isSaved)}</button>
            <div class="cover__body">
              <div class="cover__type">${t('type_' + m.type)}</div>
              <h1 class="cover__title">${m.title}</h1>
              <button class="btn btn--glow" type="button" onClick=${this.watch}>${I.playSolid(16)}${d.watchLabel}</button>
              <button class="donate-chip" type="button" onClick=${this.donateThis}>${I.heart(14)}${t('donateBtn')}</button>
            </div>
          </div>

          <div class="sec-head">
            <h2 class="sec-title">${d.isEp ? t('parts') : t('videos')}</h2>
            <span class="sec-count">${t('partsCount', { n: d.count })}</span>
          </div>
          <div class="carousel carousel--bleed" ref=${this.partsRef}>
            ${d.parts.map((p, i) => html`
              <button class=${cx('part', s.ep === i && 'is-active')} type="button" key=${i}
                aria-pressed=${s.ep === i ? 'true' : 'false'} onClick=${() => this.setState({ ep: i })}>
                <span class="part__thumb" style=${'--a:' + (120 + i * 23) + 'deg'}>
                  <span class="part__play"><span>${I.playSmall(11)}</span></span>
                  <span class="part__dur">${p.dur}</span>
                </span>
                <span class="part__label">${p.label}</span>
              </button>`)}
          </div>

          <h2 class="sec-title sec-title--spaced">${t('posters')}</h2>
          <div class="carousel" ref=${this.postersRef}>
            ${[1, 2, 3].map((n) => html`
              <span class="poster-slide" key=${n} style=${'--a:' + (100 + n * 50) + 'deg'}>
                <span class="poster-slide__label">${t('posterLabel', { n })}</span>
              </span>`)}
          </div>
          <div class="dots">
            ${[0, 1, 2].map((i) => html`
              <button class=${cx('dot', s.posterIdx === i && 'is-active')} type="button" key=${i}
                aria-label=${t('posterLabel', { n: i + 1 })} onClick=${() => this.scrollPoster(i)}></button>`)}
          </div>

          <div class="meta-row">
            <span class="meta-row__rating">${I.starSolid(13)}${d.rating}</span>
            <span>${d.year}</span><span>${d.age}</span><span>${d.durationShort}</span>
          </div>
          <div class="genres">${d.genres.map((g) => html`<span class="genre" key=${g}>${t('genre_' + g)}</span>`)}</div>
          <p class="desc">${d.desc}</p>
          <div class="facts">
            ${d.facts.map((f) => html`<div class="fact" key=${f.k}><span class="fact__k">${f.k}</span><strong class="fact__v">${f.v}</strong></div>`)}
          </div>
        </section>`;
    }

    screenDonate() {
      const s = this.state;
      const v = +s.donAmount || 0;
      const err = s.donAmount && v < D.LIMITS.min ? t('donateMin') : this.amountError(s.donAmount);
      return html`
        <section class="screen screen--gold" key="donate">
          <h1 class="title">${t('donate')}</h1>
          <div class="hero-gold">
            <div class="orb orb--64">${I.heartGold(28)}</div>
            <h2 class="hero-gold__title">${t('donateHero')}</h2>
            <p class="hero-gold__text">${t('donateHeroText')}</p>
          </div>
          <div class="form">
            <label class="field">${t('donateAmount')}
              <input class="input input--gold" value=${s.donAmount} onInput=${this.onDonAmount} onKeyDown=${onEnter(this.submitDonate)}
                inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder=${t('amountPh')}/>
            </label>
            ${this.amountPills(D.DONATE_AMOUNTS, s.donAmount, (val) => this.setState({ donAmount: val }))}
            <label class="field">${t('comment')}
              <textarea class="input input--gold textarea" value=${s.donMsg} onInput=${this.onDonMsg} maxlength="300" rows="4"
                placeholder=${t('commentPh')}></textarea>
            </label>
            ${err ? html`<p class="form-error">${err}</p>` : null}
            <button class="btn btn--gold" type="button" disabled=${!s.donAmount || !!err} onClick=${this.submitDonate}>${I.heartSolid(15)}${t('donateBtn')}</button>
          </div>
        </section>`;
    }

    screenPay() {
      const s = this.state;
      const prices = D.PRICES[s.plan];
      const price = prices[s.period];
      const sub = activeSub(s);
      return html`
        <section class="screen screen--gold" key="pay">
          <div class="club">
            <div class="club__eyebrow">${t('club')}</div>
            <h1 class="club__title">${t('payTitle')}</h1>
            <p class="club__sub">${t('paySub')}</p>
          </div>
          <div class="orb orb--72">${I.starGold(30)}</div>
          ${sub ? html`
            <div class="active-plan">
              <span class="tile tile--ok">${I.check(18)}</span>
              <span><small class="active-plan__label">${t('activePlan')}</small>
                <strong class="active-plan__value">${t('scope_' + sub.plan)} · ${t('until', { date: fmtDate(sub.until) })}</strong></span>
            </div>` : null}
          <div class="scopes" role="radiogroup">
            ${D.SCOPES.map((id) => html`
              <button class=${cx('scope', s.plan === id && 'is-active')} type="button" key=${id} role="radio"
                aria-checked=${s.plan === id ? 'true' : 'false'} onClick=${() => this.setState({ plan: id })}>
                ${SCOPE_ICON[id]()}
                <strong class="scope__name">${t('scope_' + id)}</strong>
                <small class="scope__sub">${t('scopeSub_' + id)}</small>
              </button>`)}
          </div>
          <p class="plan-desc">${t('scopeDesc_' + s.plan)}</p>
          <div class="tariffs" role="radiogroup">
            ${D.PERIODS.map((p) => {
              const pr = prices[p];
              const save = p > 1 ? Math.round((1 - pr / (prices[1] * p)) * 100) : 0;
              return html`
                <button class=${cx('tariff', s.period === p && 'is-active')} type="button" key=${p} role="radio"
                  aria-checked=${s.period === p ? 'true' : 'false'} onClick=${() => this.setState({ period: p })}>
                  <span class="radio"></span>
                  <span class="tariff__body">
                    <strong class="tariff__name">${t('period_' + p)}</strong>
                    <small class="tariff__note">${t('periodNote_' + p)}${save ? ' · −' + save + '%' : ''}</small>
                  </span>
                  <b class="tariff__price">${money(pr)}</b>
                </button>`;
            })}
          </div>
          <div class="summary"><span>${t('scope_' + s.plan)} · ${t('period_' + s.period)}</span><strong>${money(price)}</strong></div>
          <button class="btn btn--gold" type="button" onClick=${this.buyPlan}>${t('buy')}</button>
          <div class="note note--gold">
            <span>${t('yourBalance')} <strong>${money(s.balance)}</strong></span>
            <button class="link link--gold" type="button" onClick=${() => this.go('topup')}>${t('topupLink')}</button>
          </div>
        </section>`;
    }

    screenTopup() {
      const s = this.state;
      const v = +s.amount || 0;
      const err = s.amount && v < D.LIMITS.min ? t('amountMin') : this.amountError(s.amount);
      return html`
        <section class="screen screen--gold" key="topup">
          <h1 class="title">${t('topupTitle')}</h1>
          <div class="gold-card">
            <div class="gold-card__row">
              ${I.wallet(20)}
              <span class="gold-card__label">${t('currentBalance')}<strong class="gold-card__value">${money(s.balance)}</strong></span>
            </div>
          </div>
          <div class="form">
            <label class="field">${t('amount')}
              <input class="input input--gold" value=${s.amount} onInput=${this.onAmount} onKeyDown=${onEnter(this.submitTopup)}
                inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder=${t('amountPh')}/>
            </label>
            ${this.amountPills(D.TOPUP_AMOUNTS, s.amount, (val) => this.setState({ amount: val }))}
            ${err ? html`<p class="form-error">${err}</p>` : null}
            <button class="btn btn--gold" type="button" disabled=${!s.amount || !!err} onClick=${this.submitTopup}>${t('continue')}</button>
          </div>
        </section>`;
    }

    screenGift() {
      const s = this.state;
      return html`
        <section class="screen screen--gold" key="gift">
          <h1 class="title">${t('giftTitle')}</h1>
          <div class="gift-hero">
            <div class="gift-hero__icon">${I.gift(30)}</div>
            <h2 class="gift-hero__title">${t('giftHero')}</h2>
            <p class="gift-hero__text">${t('giftHeroText')}</p>
            <b class="gift-hero__price"><span class="coin"></span>${fmt(D.LIMITS.giftCost)} ${t('coin')}</b>
          </div>
          <div class="gold-card">
            <div class="gold-card__line"><span>${t('youHave')}</span><strong>${fmt(s.coins)} ${t('coin')}</strong></div>
          </div>
          <div class="form">
            <label class="field">${t('friendUsername')}
              <input class="input input--gold" value=${s.friend} onInput=${this.onFriend} onKeyDown=${onEnter(this.sendGift)}
                placeholder="@username" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="33"/>
            </label>
            <button class="btn btn--gold" type="button" disabled=${!s.friend.trim()} onClick=${this.sendGift}>${t('continue')}</button>
          </div>
        </section>`;
    }

    /* ---------- docks ---------- */
    renderDock() {
      const sc = this.state.screen;
      const item = (id, icon, label) => html`
        <button class=${cx('dock__btn', sc === id && 'is-active')} type="button" key=${id}
          aria-current=${sc === id ? 'page' : null} onClick=${() => this.go(id)}>${icon}${label}</button>`;
      return html`
        <nav class="dock-wrap">
          <div class="dock">
            <div class="dock__main">
              ${item('home', I.home(20), t('nav_home'))}
              ${item('search', I.search(20), t('nav_search'))}
              ${item('settings', I.user(20), t('nav_settings'))}
            </div>
            <button class="dock__pay" type="button" onClick=${() => this.go('pay')}>${I.wallet(20)}${t('nav_pay')}</button>
          </div>
        </nav>`;
    }

    renderGoldDock() {
      const sc = this.state.screen;
      const item = (id, icon, label) => html`
        <button class=${cx('gdock__btn', sc === id && 'is-active')} type="button" key=${id}
          aria-current=${sc === id ? 'page' : null} onClick=${() => this.go(id)}>${icon}${label}</button>`;
      return html`
        <nav class="dock-wrap dock-wrap--gold">
          <div class="gdock">
            ${item('pay', I.ticket(20), t('nav_plans'))}
            ${item('topup', I.wallet(20), t('nav_balance'))}
            ${item('gift', I.gift(20), t('nav_gifts'))}
            ${item('donate', I.heart(20), t('nav_donate'))}
            ${item('home', I.home(20), t('nav_home'))}
          </div>
        </nav>`;
    }

    /* ---------- sheets ---------- */
    renderPaySheet() {
      const s = this.state;
      const p = s.pay;
      const left = Math.max(0, Math.round((p.expires - s.now) / 1000));
      const expired = s.now >= p.expires;
      const low = p.expires - s.now < 5 * 60000;
      const timer = pad(Math.floor(left / 60)) + ':' + pad(left % 60);
      return html`
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div class="sheet__backdrop" onClick=${this.closePayment}></div>
          <div class="sheet__panel">
            <div class="sheet__handle"></div>
            <div class="sheet__head">
              <h2 class="sheet__title" id="pay-title">${p.kind === 'donat' ? t('payDonateTitle') : t('payTopupTitle')}</h2>
              <button class="sheet__x" type="button" onClick=${this.closePayment} aria-label=${t('close')}>${I.close(15, 2.2)}</button>
            </div>
            <div class="pay-line">${t('amount')}<strong>${money(p.base)}</strong></div>
            <div class="warn">
              ${I.alert(18)}
              <span><b class="is-red">${t('important')}</b> ${t('warnA')}<b class="is-white">${t('warnExact')}</b>${t('warnB')}<b class="is-red">${t('warnOne')}</b>${t('warnC')}</span>
            </div>
            <div class=${cx('exact', expired && 'is-expired')}>
              <div class="exact__top">
                <span class="exact__label">${t('exactSum')}</span>
                <span class=${cx('timer', low && 'is-low')} role="timer">${I.clock(11)}${timer}</span>
              </div>
              <div class="exact__main">
                <strong class=${cx('exact__sum', p.exact >= 1000000 && 'exact__sum--sm')}>${fmt(p.exact)} <span class="exact__cur">${t('som')}</span></strong>
                <button class="copy-dark" type="button" disabled=${expired} onClick=${this.copyExact}>${I.copy(13)}${t('copy')}</button>
              </div>
            </div>
            ${expired ? html`<p class="pay-expired">${t('expired')}</p>` : null}
            <div class="card-box">
              <div class="card-box__row">
                <span class="card-box__main"><small class="card-box__k">${t('cardNumber')}</small><strong class="card-box__v">${D.PAYMENT.card}</strong></span>
                <button class="copy-gold" type="button" onClick=${this.copyCard}>${I.copy(12)}${t('copy')}</button>
              </div>
              <div class="card-box__row"><small class="card-box__k">${t('cardOwner')}</small><strong class="card-box__owner">${D.PAYMENT.owner}</strong></div>
            </div>
            <p class="pay-note">${p.kind === 'donat' ? t('noteDonate') : t('noteTopup')}</p>
            <button class="btn btn--gold" type="button" onClick=${this.confirmPay}>${expired ? t('newSum') : t('paid')}</button>
          </div>
        </div>`;
    }

    renderConfirm() {
      const s = this.state;
      const c = s.confirm;
      const price = D.PRICES[s.plan][s.period];
      const ask = c === 1 || c === 2;
      const planName = t('scope_' + s.plan);
      const periodName = t('period_' + s.period);
      const title = c === 1 ? t('cfTitle1') : c === 2 ? t('cfTitle2') : c === 'nobal' ? t('cfTitleNoBal') : t('cfTitleDone');
      const text = c === 1 ? t('cfText1')
        : c === 2 ? t('cfText2', { sum: money(price) })
        : c === 'nobal' ? t('cfTextNoBal', { sum: money(price - s.balance) })
        : t('cfTextDone', { plan: planName, period: periodName });
      const orb = c === 'done' ? 'cf-orb--done' : c === 'nobal' ? 'cf-orb--nobal' : 'cf-orb--ask';
      const icon = c === 'done' ? I.check(30) : c === 'nobal' ? I.wallet(28) : I.starGold(28);
      const primary = c === 1 ? t('cfBtn1') : c === 2 ? t('cfBtn2') : c === 'nobal' ? t('cfBtnNoBal') : t('cfBtnDone');
      const balCls = c === 'done' || s.balance >= price ? 'is-ok' : 'is-bad';
      return html`
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cf-title">
          <div class="sheet__backdrop" onClick=${this.closeConfirm}></div>
          <div class="sheet__panel sheet__panel--center" key=${'cf-' + c}>
            <div class="sheet__handle"></div>
            <div class=${'cf-orb ' + orb}>${icon}</div>
            ${ask ? html`<div class="cf-step">${t('step', { n: c })}</div>` : null}
            <h2 class="cf-title" id="cf-title">${title}</h2>
            <p class="cf-text">${text}</p>
            <div class="cf-table">
              <div class="cf-row"><span>${t('cfPlan')}</span><strong>${planName}</strong></div>
              <div class="cf-row"><span>${t('cfPeriod')}</span><strong>${periodName}</strong></div>
              <div class="cf-row"><span>${t('cfPrice')}</span><strong class="is-price">${money(price)}</strong></div>
              <div class="cf-row"><span>${t('cfBalance')}</span><strong class=${balCls}>${money(s.balance)}</strong></div>
            </div>
            <div class="cf-actions">
              <button class="btn btn--gold" type="button" onClick=${this.confirmPrimary}>${primary}</button>
              ${ask ? html`<button class="btn btn--ghost-gold" type="button" onClick=${this.closeConfirm}>${t('cancel')}</button>` : null}
            </div>
          </div>
        </div>`;
    }
  }

  /* ---------------- boot ---------------- */
  fitDevice();
  const mount = document.getElementById('app');
  mount.textContent = '';
  render(html`<${App} />`, mount);
})();
