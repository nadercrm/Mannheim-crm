/* EENS ONE – Relaunch. Keine Tracker, keine externen Skripte. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = matchMedia("(min-width: 900px)").matches;
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduced) doc.classList.add("js");

  /* Topbar wird nach dem Hero solide */
  var bar = document.getElementById("topbar");
  function onScrollBar() { bar.classList.toggle("is-solid", scrollY > innerHeight * 0.35); }
  addEventListener("scroll", onScrollBar, { passive: true }); onScrollBar();

  /* Scroll-Reveals */
  if (!reduced && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { rio.observe(el); });
  }

  /* Sanfte Parallax (nur transform, max. ~40 px) */
  var px = reduced ? [] : [].slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;
  function parallax() {
    ticking = false;
    var vh = innerHeight;
    px.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var center = r.top + r.height / 2 - vh / 2;
      var y = Math.max(-40, Math.min(40, -center * parseFloat(el.dataset.parallax)));
      el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    });
  }
  if (px.length) {
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* Hover-Tilt für Cover und Artist-Bilder (nur Maus) */
  if (finePointer && !reduced) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var t = el.classList.contains("cover") ? el : el.querySelector(".artist-img");
      el.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        t.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
    });
  }

  /* Videos: nur Desktop, ohne reduzierte Bewegung, ohne Datensparmodus. Auf Mobil bleibt das Standbild. */
  var allowVideo = desktop && !reduced && !saveData;
  function mountVideo(slot) {
    if (slot.dataset.mounted) return; slot.dataset.mounted = "1";
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.preload = "auto"; v.disablePictureInPicture = true;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) {
      var src = document.createElement("source"); src.src = slot.dataset[s[0]]; src.type = s[1]; v.appendChild(src);
    });
    v.addEventListener("playing", function () { v.classList.add("is-playing"); }, { once: true });
    slot.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    // außerhalb des Sichtfelds pausieren (spart CPU/Akku)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause(); });
      }, { threshold: 0.05 }).observe(slot);
    }
  }
  if (allowVideo) {
    var slots = [].slice.call(document.querySelectorAll("[data-video-slot]"));
    var start = function () {
      slots.forEach(function (slot) {
        if (!slot.hasAttribute("data-lazy")) return mountVideo(slot);
        var lio = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { mountVideo(slot); lio.disconnect(); }
        }, { rootMargin: "300px 0px" });
        lio.observe(slot);
      });
    };
    // erst nach dem Laden der Seite, damit Poster/LCP Vorrang haben
    if (document.readyState === "complete") setTimeout(start, 200);
    else addEventListener("load", function () { setTimeout(start, 200); });
  }

  /* Spotify: Zwei-Klick-Lösung – iFrame erst nach ausdrücklichem Klick */
  var A = {
    eens: { n: "EENS", id: "3g49F3UXe5yHol0EzOYQRy", l: [["Spotify", "https://open.spotify.com/artist/3g49F3UXe5yHol0EzOYQRy"], ["Apple Music", "https://music.apple.com/de/artist/eens/1832702690"], ["YouTube Music", "https://music.youtube.com/@eens_official"], ["Instagram", "https://www.instagram.com/eens_official/"], ["TikTok", "https://www.tiktok.com/@eens.official"]] },
    nado: { n: "Nado", id: "6rwqTrNLO4Mo8DHc6JGeNd", l: [["Spotify", "https://open.spotify.com/artist/6rwqTrNLO4Mo8DHc6JGeNd"], ["Instagram", "https://www.instagram.com/eens_official/"], ["TikTok", "https://www.tiktok.com/@eens.official"]] }
  };
  var cur = "eens", consented = false;
  var box = document.getElementById("player-box"), plat = document.getElementById("platforms");
  var gate = box && box.innerHTML;
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
        f = document.createElement("iframe");
        f.title = "Spotify-Player"; f.loading = "lazy";
        f.allow = "clipboard-write; encrypted-media; fullscreen; picture-in-picture";
        box.innerHTML = ""; box.appendChild(f);
      }
      f.src = "https://open.spotify.com/embed/artist/" + d.id + "?theme=0";
    } else {
      box.innerHTML = gate;
      document.getElementById("player-title").textContent = d.n + " auf Spotify";
      document.getElementById("player-direct").href = d.l[0][1];
      document.getElementById("player-load").addEventListener("click", function () { consented = true; renderPlayer(); });
    }
  }
  if (box && plat) {
    document.querySelectorAll(".player-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".player-tab").forEach(function (b) { b.setAttribute("aria-selected", String(b === t)); });
        cur = t.dataset.artist; renderPlayer();
      });
    });
    renderPlayer();
  }

  /* KI-Transparenz-Dialog */
  document.querySelectorAll("[data-open-dialog]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var d = document.getElementById(a.dataset.openDialog);
      if (d && d.showModal) { e.preventDefault(); d.showModal(); }
    });
  });
  document.querySelectorAll("[data-close-dialog]").forEach(function (b) {
    b.addEventListener("click", function () { b.closest("dialog").close(); });
  });
  document.querySelectorAll("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  });
  if (location.hash === "#transparenz") { var td = document.getElementById("transparenz"); if (td && td.showModal) td.showModal(); }
})();
