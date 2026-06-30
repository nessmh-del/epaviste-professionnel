/* ============================================================
   ENLÈVE ÉPAVE — interactions & motion v2 (Lenis + GSAP)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#year").textContent = new Date().getFullYear();

  const nav = $("#nav");
  const progress = $("#progress");

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ({ scroll, limit }) => {
      nav.classList.toggle("scrolled", scroll > 24);
      if (progress) progress.style.transform = `scaleX(${limit ? scroll / limit : 0})`;
      if (window.ScrollTrigger) ScrollTrigger.update();
    });
    if (window.gsap) {
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    const onScroll = () => {
      const sc = window.scrollY, lim = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("scrolled", sc > 24);
      if (progress) progress.style.transform = `scaleX(${lim ? sc / lim : 0})`;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger"), overlay = $("#menuOverlay");
  const toggleMenu = (force) => {
    const open = force !== undefined ? force : !burger.classList.contains("open");
    burger.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    overlay.setAttribute("aria-hidden", !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu());

  /* ---------- Smooth anchors ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      toggleMenu(false);
      if (lenis) lenis.scrollTo(t, { offset: -6, duration: 1.1 });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- Formulaire ---------- */
  const form = $("#leadForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      form.querySelectorAll(".field, .form-mini, button[type=submit]").forEach((el) => (el.style.display = "none"));
      const ok = $("#formSuccess");
      ok.hidden = false;
      if (window.gsap && !reduce) gsap.fromTo(ok, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .6 });
    });
  }

  /* ---------- GSAP ---------- */
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  if (reduce) {
    gsap.utils.toArray(".reveal, .reveal-visual").forEach((el) => gsap.set(el, { clearProps: "all" }));
    document.querySelector(".process")?.classList.add("no-pin");
    return;
  }

  /* Hero intro */
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".hero-title .line > span", { yPercent: 115, duration: 1, stagger: .12 }, 0)
    .from(".hero .eyebrow", { y: 20, opacity: 0, duration: .7 }, .15)
    .from(".hero-sub", { y: 22, opacity: 0, filter: "blur(8px)", duration: .8 }, .3)
    .from(".hero-actions", { y: 22, opacity: 0, duration: .8 }, .42)
    .from(".hero-assur li", { y: 16, opacity: 0, duration: .6, stagger: .08 }, .55)
    .from(".scroll-cue", { opacity: 0, duration: .8 }, .9);

  /* Hero parallax */
  gsap.to(".hero-media", { yPercent: 18, scale: 1.08, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-inner", { yPercent: 22, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* Reveals (hors éléments à animation dédiée) */
  gsap.utils.toArray(".reveal:not(.pstep):not(.card):not(.zone-pill)").forEach((el) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: "top 88%", once: true },
      y: 38, opacity: 0, filter: "blur(8px)", duration: .9, ease: "power3.out" });
  });
  gsap.utils.toArray(".reveal-visual").forEach((el) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%", once: true },
      y: 50, opacity: 0, scale: .97, duration: 1.1, ease: "power3.out" });
  });

  /* Bento + zones stagger */
  gsap.from(".bento .card", { scrollTrigger: { trigger: ".bento", start: "top 80%", once: true },
    y: 50, opacity: 0, duration: .85, ease: "power3.out", stagger: .09 });
  gsap.from(".zone-pill", { scrollTrigger: { trigger: ".zones-list", start: "top 85%", once: true },
    y: 24, opacity: 0, scale: .92, duration: .55, ease: "back.out(1.6)", stagger: .05 });

  /* Compteurs */
  gsap.utils.toArray(".trust-num, .recy-num").forEach((el) => {
    const target = el.getAttribute("data-count");
    if (target === null) return;
    const suffix = el.getAttribute("data-suffix") || "";
    const obj = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true,
      onEnter: () => gsap.to(obj, { v: +target, duration: 1.6, ease: "power2.out",
        onUpdate: () => (el.textContent = Math.round(obj.v) + suffix) }) });
  });

  /* Process épinglé scrubbé (desktop only) */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    const steps = gsap.utils.toArray(".pstep");
    const dots = gsap.utils.toArray(".dot-step");
    let cur = -1;
    const show = (i) => {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      dots.forEach((d, k) => d.classList.toggle("is-on", k <= i));
    };
    show(0);
    ScrollTrigger.create({
      trigger: ".process", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (self) => { const p = self.progress; show(p < 0.34 ? 0 : p < 0.67 ? 1 : 2); },
    });
  });

  /* Tilt cards (desktop pointer) */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotateY: px * 6, rotateX: -py * 6, transformPerspective: 800, duration: .5, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: "elastic.out(1,.5)" }));
    });
    $$(".btn-lg").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .28, duration: .5 });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.5)" }));
    });
  }

  /* refresh après chargement images */
  addEventListener("load", () => ScrollTrigger.refresh());
})();
