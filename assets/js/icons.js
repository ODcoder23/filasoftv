/* FilasofTV — SVG ikonkalar (Lucide uslubida). */
(function () {
  'use strict';
  var html = window.htmPreact.html;

  function stroke(size, children, extra) {
    extra = extra || {};
    return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill=${extra.fill || 'none'}
      stroke=${extra.stroke || 'currentColor'} stroke-width=${extra.sw || 2} stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true" focusable="false">${children}</svg>`;
  }

  function solid(size, children) {
    return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${children}</svg>`;
  }

  var STAR = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';
  var HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';
  var BOOKMARK = 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z';

  var I = {
    back: function (s) { return stroke(s || 19, html`<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`); },
    dots: function (s) { return solid(s || 17, html`<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>`); },
    close: function (s, sw) { return stroke(s || 17, html`<path d="M18 6 6 18M6 6l12 12"/>`, { sw: sw || 2 }); },
    wallet: function (s) { return stroke(s || 18, html`<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>`); },
    ticket: function (s) { return stroke(s || 18, html`<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>`); },
    headset: function (s) { return stroke(s || 18, html`<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>`); },
    search: function (s) { return stroke(s || 16, html`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`); },
    film: function (s, sw) { return stroke(s || 26, html`<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>`, { sw: sw || 1.6 }); },
    starSolid: function (s) { return solid(s || 13, html`<polygon points=${STAR}/>`); },
    starBadge: function (s) { return stroke(s || 11, html`<polygon points=${STAR}/>`, { fill: '#fff', stroke: '#fff', sw: 1.5 }); },
    starGold: function (s, sw) { return stroke(s || 30, html`<polygon points=${STAR}/>`, { fill: '#edcf7330', sw: sw || 1.6 }); },
    gift: function (s) { return stroke(s || 20, html`<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>`); },
    play: function (s) { return stroke(s || 18, html`<polygon points="6 3 20 12 6 21 6 3"/>`); },
    playSolid: function (s) { return solid(s || 16, html`<polygon points="6 3 20 12 6 21 6 3"/>`); },
    playSmall: function (s) { return solid(s || 11, html`<polygon points="7 4 20 12 7 20 7 4"/>`); },
    users: function (s) { return stroke(s || 18, html`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`); },
    copy: function (s, color) { return stroke(s || 15, html`<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`, { stroke: color }); },
    chevron: function (s) { return stroke(s || 16, html`<path d="m9 18 6-6-6-6"/>`, { stroke: '#4b5971' }); },
    phone: function (s) { return stroke(s || 18, html`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`); },
    history: function (s, color, sw) { return stroke(s || 18, html`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>`, { stroke: color, sw: sw }); },
    bookmark: function (s, filled, color, sw) { return stroke(s || 18, html`<path d=${BOOKMARK}/>`, { fill: filled ? 'currentColor' : 'none', stroke: color, sw: sw }); },
    home: function (s) { return stroke(s || 20, html`<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>`); },
    user: function (s) { return stroke(s || 20, html`<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>`); },
    heart: function (s, sw) { return stroke(s || 20, html`<path d=${HEART}/>`, { sw: sw }); },
    heartGold: function (s) { return stroke(s || 28, html`<path d=${HEART}/>`, { fill: '#edcf7330', sw: 1.8 }); },
    heartSolid: function (s) { return solid(s || 15, html`<path d=${HEART}/>`); },
    alert: function (s) { return stroke(s || 18, html`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>`, { stroke: '#ff5c7a' }); },
    clock: function (s) { return stroke(s || 11, html`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`, { sw: 2.4 }); },
    check: function (s) { return stroke(s || 30, html`<path d="M20 6 9 17l-5-5"/>`, { sw: 2.4 }); },
    tv: function (s) { return stroke(s || 18, html`<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>`); },
    layers: function (s) { return stroke(s || 18, html`<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`); },
    reload: function (s) { return stroke(s || 16, html`<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>`); },
    trash: function (s) { return stroke(s || 16, html`<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`); },
    xCircle: function (s) { return stroke(s || 15, html`<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>`); },
    plus: function (s) { return stroke(s || 15, html`<path d="M12 5v14M5 12h14"/>`, { sw: 2.4 }); },
    minus: function (s) { return stroke(s || 15, html`<path d="M5 12h14"/>`, { sw: 2.4 }); }
  };

  window.FTV = window.FTV || {};
  window.FTV.icons = I;
})();
