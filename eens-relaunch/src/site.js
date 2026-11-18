/* EENS ONE – Relaunch v2. Keine Tracker, keine externen Skripte. Alle Effekte nur über transform/opacity. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = matchMedia("(min-width: 900px)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
  if (!reduced) doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Text in Wörter teilen (Reveal & Scroll-Fill) ---------- */
  function splitWords(el, cls, inner) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var o = document.createElement("span"); o.className = cls; o.style.setProperty("--i", i++);
            if (inner) { var s = document.createElement("span"); s.textContent = w; o.appendChild(s); } else o.textContent = w;
            frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
      });
    })(el);
  }
  if (!reduced) {
    $$("[data-split]").forEach(function (el) { splitWords(el, "w", true); });
    $$("[data-fill]").forEach(function (el) { splitWords(el, "fw", false); });
    // Hero-Titel sofort einblenden
    var ht = $(".hero-title"); if (ht) requestAnimationFrame(function () { requestAnimationFrame(function () { ht.classList.add("in"); }); });
  }

  /* ---------- Reveals ---------- */
  if (!reduced && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });
    $$(".reveal, [data-split]").forEach(function (el) { rio.observe(el); });
  }

  /* ---------- Videos ---------- */
  // Hero: nur Desktop. Übrige Clips: auch mobil, aber erst in Sichtweite. Nie bei reduzierter Bewegung / Datensparmodus.
  var videoOK = !reduced && !saveData;
  var visIO = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target._v; if (!v) return;
      e.target._vis = e.isIntersecting;
      if (e.isIntersecting && !e.target.hasAttribute("data-hover-only")) safePlay(v); else if (!e.isIntersecting) v.pause();
    });
  }, { threshold: 0.15 }) : null;
  function safePlay(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function mountVideo(slot) {
    if (slot._v) return slot._v;
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.preload = "auto"; v.disablePictureInPicture = true;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) {
      var src = document.createElement("source"); src.src = slot.dataset[s[0]]; src.type = s[1]; v.appendChild(src);
    });
    v.addEventListener("playing", function () { v.classList.add("is-playing"); }, { once: true });
    slot.appendChild(v); slot._v = v;
    if (visIO) visIO.observe(slot);
    return v;
  }
  function startVideos() {
    $$("[data-video-slot]").forEach(function (slot) {
      if (slot.hasAttribute("data-hero")) { if (desktop) safePlay(mountVideo(slot)); return; }
      if (slot.hasAttribute("data-hover") && desktop && finePointer) {
        // Artist-Karten: Video läuft beim Hover
        slot.setAttribute("data-hover-only", "");
        var card = slot.closest(".artist");
        card.addEventListener("pointerenter", function () { var v = mountVideo(slot); safePlay(v); });
        card.addEventListener("pointerleave", function () { if (slot._v) slot._v.pause(); });
        return;
      }
      if (slot.hasAttribute("data-hover")) slot.classList.add("touch-on");
      var lio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { safePlay(mountVideo(slot)); lio.disconnect(); }
      }, { rootMargin: "250px 250px" });
      lio.observe(slot);
    });
  }
  if (videoOK) {
    var go = function () { setTimeout(startVideos, desktop ? 150 : 900); };
    if (document.readyState === "complete") go(); else addEventListener("load", go);
  }

  /* ---------- Topbar, Fortschritt, Hero, Parallax, Fill, Reel, Marquee: ein rAF-Takt ---------- */
  var bar = $("#topbar"), hero = $(".hero"), reel = $(".reel"), track = $("#reel-track");
  var px = reduced ? [] : $$("[data-parallax]");
  var fills = reduced ? [] : $$(".fill-text .fw");
  var rows = reduced ? [] : $$("[data-marquee]");
  var marqueeX = rows.map(function () { return 0; });
  var lastY = scrollY, vel = 0, ticking = false;

  function setupReel() {
    if (!reel || !track || reduced || !desktop) return;
    reel.classList.add("is-pinned");
    var dist = Math.max(0, track.scrollWidth - innerWidth);
    reel.style.setProperty("--reel-h", (innerHeight + dist) + "px");
    reel._dist = dist;
  }
  setupReel();
  addEventListener("resize", function () { desktop = matchMedia("(min-width: 900px)").matches; setupReel(); frame(); });

  function frame() {
    ticking = false;
    var y = scrollY, vh = innerHeight;
    bar.classList.toggle("is-solid", y > vh * 0.35);
    var max = document.documentElement.scrollHeight - vh;
    doc.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);
    if (reduced) return;
    if (hero) hero.style.setProperty("--hp", Math.min(1, Math.max(0, y / (vh * 0.9))).toFixed(3));
    px.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + Math.max(-60, Math.min(60, -c * parseFloat(el.dataset.parallax))).toFixed(1) + "px,0)";
    });
    if (fills.length) {
      var fr = fills[0].parentNode.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.85 - fr.top) / (fr.height + vh * 0.35)));
      var n = Math.round(p * fills.length);
      fills.forEach(function (w, i) { w.classList.toggle("on", i < n); w.classList.toggle("hot", i < n && i >= n - 3); });
    }
    if (reel && reel._dist) {
      var rr = reel.getBoundingClientRect();
      var rp = Math.min(1, Math.max(0, -rr.top / (rr.height - vh)));
      reel.style.setProperty("--tx", (-rp * reel._dist).toFixed(1) + "px");
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, { passive: true });
  frame();

  // Marquee: läuft dauerhaft, Scroll-Tempo beschleunigt und dreht die Richtung
  if (rows.length) {
    var mio = { on: true };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { mio.on = es[0].isIntersecting; }).observe($(".marquee"));
    (function loop() {
      var y = scrollY; vel = vel * 0.9 + (y - lastY) * 0.1; lastY = y;
      if (mio.on) rows.forEach(function (row, i) {
        var dir = parseFloat(row.dataset.marquee), w = row.scrollWidth / 2;
        marqueeX[i] -= dir * (0.6 + Math.abs(vel) * 0.35) * (vel < -0.5 ? -1 : 1);
        if (marqueeX[i] <= -w) marqueeX[i] += w; if (marqueeX[i] > 0) marqueeX[i] -= w;
        row.style.transform = "translate3d(" + marqueeX[i].toFixed(1) + "px,0,0)";
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Maus: Glow, Spotlight, Tilt + Holo, magnetische Buttons ---------- */
  if (finePointer && !reduced) {
    doc.classList.add("has-cursor");
    var glow = $(".cursor-glow"), gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy;
    addEventListener("pointermove", function (e) {
      gx = e.clientX; gy = e.clientY;
      if (hero && e.clientY < innerHeight) { hero.style.setProperty("--mx", e.clientX + "px"); hero.style.setProperty("--my", e.clientY + "px"); }
    }, { passive: true });
    (function follow() { cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12; glow.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)"; requestAnimationFrame(follow); })();

    $$("[data-tilt]").forEach(function (el) {
      var t = el.classList.contains("artist") ? $(".artist-img", el) : el;
      el.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        t.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
        t.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
        t.style.setProperty("--hx", (x * 100).toFixed(1) + "%");
        t.style.setProperty("--hy", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
    });

    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate3d(" + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px,0)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- Spotify: Zwei-Klick-Lösung – iFrame erst nach ausdrücklichem Klick ---------- */
  var A = {
    eens: { n: "EENS", id: "3g49F3UXe5yHol0EzOYQRy", l: [["Spotify", "https://open.spotify.com/artist/3g49F3UXe5yHol0EzOYQRy"], ["Apple Music", "https://music.apple.com/de/artist/eens/1832702690"], ["YouTube Music", "https://music.youtube.com/@eens_official"], ["Instagram", "https://www.instagram.com/eens_official/"], ["TikTok", "https://www.tiktok.com/@eens.official"]] },
    nado: { n: "Nado", id: "6rwqTrNLO4Mo8DHc6JGeNd", l: [["Spotify", "https://open.spotify.com/artist/6rwqTrNLO4Mo8DHc6JGeNd"], ["Instagram", "https://www.instagram.com/eens_official/"], ["TikTok", "https://www.tiktok.com/@eens.official"]] }
  };
  var cur = "eens", consented = false, box = $("#player-box"), plat = $("#platforms"), gate = box && box.innerHTML;
  function renderPlayer() {
    var d = A[cur];
    plat.innerHTML = "";
    d.l.forEach(function (x) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = x[1]; a.target = "_blank"; a.rel = "noopener";
      a.textContent = x[0] + (x[0] === "Spotify" ? " · Folgen ↗" : " ↗");
      li.appendChild(a); plat.appendChild(li);
    });
    if (consented) {
      var f = box.querySelector("iframe");
      if (!f) {
        f = document.createElement("iframe"); f.title = "Spotify-Player"; f.loading = "lazy";
        f.allow = "clipboard-write; encrypted-media; fullscreen; picture-in-picture";
        box.innerHTML = ""; box.appendChild(f);
      }
      f.src = "https://open.spotify.com/embed/artist/" + d.id + "?theme=0";
    } else {
      box.innerHTML = gate;
      $("#player-title").textContent = d.n + " auf Spotify";
      $("#player-direct").href = d.l[0][1];
      $("#player-load").addEventListener("click", function () { consented = true; renderPlayer(); });
    }
  }
  if (box && plat) {
    $$(".player-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        $$(".player-tab").forEach(function (b) { b.setAttribute("aria-selected", String(b === t)); });
        cur = t.dataset.artist; renderPlayer();
      });
    });
    renderPlayer();
  }

  /* ---------- KI-Transparenz-Dialog ---------- */
  $$("[data-open-dialog]").forEach(function (a) {
    a.addEventListener("click", function (e) { var d = document.getElementById(a.dataset.openDialog); if (d && d.showModal) { e.preventDefault(); d.showModal(); } });
  });
  $$("[data-close-dialog]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  $$("dialog").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });
  if (location.hash === "#transparenz") { var td = $("#transparenz"); if (td && td.showModal) td.showModal(); }
})();
