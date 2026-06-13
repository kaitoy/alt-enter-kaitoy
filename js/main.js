/* 山田海斗 自己紹介ページ */
(() => {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
   * ヒーローの金の粒子を生成 (装飾なのでJS無効環境では単に出ない)
   * -------------------------------------------------------------------- */
  const particles = document.querySelector(".hero-particles");
  if (particles && !prefersReducedMotion) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("i");
      p.style.setProperty("--x", `${Math.random() * 100}%`);
      p.style.setProperty("--y", `${15 + Math.random() * 80}%`);
      p.style.setProperty("--s", `${3 + Math.random() * 5}px`);
      p.style.setProperty("--o", `${0.25 + Math.random() * 0.55}`);
      p.style.setProperty("--t", `${4 + Math.random() * 6}s`);
      p.style.setProperty("--dl", `${-Math.random() * 8}s`);
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 4}rem`);
      frag.appendChild(p);
    }
    particles.appendChild(frag);
  }

  /* ----------------------------------------------------------------------
   * Scroll-Driven Animations 非対応ブラウザ (Firefox等) のフォールバック:
   * IntersectionObserver で .in-view を付与し、CSSのtransitionで出現させる
   * -------------------------------------------------------------------- */
  const supportsSDA = CSS.supports(
    "(animation-timeline: view()) and (animation-range: entry)"
  );
  if (!supportsSDA) {
    document.documentElement.classList.add("no-sda");
    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
      );
      document
        .querySelectorAll(
          ".reveal, .chips li, .logo-grid li, .tl-item, .timeline-line"
        )
        .forEach((el) => io.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
   * 統計のカウントアップ
   * -------------------------------------------------------------------- */
  const counters = document.querySelectorAll(".stat-num[data-count]");
  if (counters.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10);
      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString();
        return;
      }
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => io.observe(el));
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ----------------------------------------------------------------------
   * 第四章のロゴマーキー: シームレスループのために内容を複製
   * -------------------------------------------------------------------- */
  document.querySelectorAll("[data-marquee] .marquee-row").forEach((row) => {
    const items = Array.from(row.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      row.appendChild(clone);
    });
  });

  /* ----------------------------------------------------------------------
   * ズンドコキヨシ デモ
   * 「ズン」「ドコ」をランダム出力し、ズン×4 → ドコ で「キ・ヨ・シ！」
   * -------------------------------------------------------------------- */
  const runBtn = document.getElementById("zd-run");
  const output = document.getElementById("zd-output");
  const screen = document.getElementById("zd-screen");
  const confettiBox = document.getElementById("zd-confetti");

  if (runBtn && output && screen) {
    const KIYOSHI_PATTERN = ["ズン", "ズン", "ズン", "ズン", "ドコ"];
    let timer = null;

    const burstConfetti = () => {
      if (!confettiBox || prefersReducedMotion) return;
      const colors = ["#c9a227", "#e6c35c", "#f3ecdc", "#b3402a"];
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 70; i++) {
        const piece = document.createElement("span");
        piece.className = "zd-piece";
        piece.style.setProperty("--x", `${Math.random() * 100}%`);
        piece.style.setProperty("--clr", colors[i % colors.length]);
        piece.style.setProperty("--t", `${1.4 + Math.random() * 1.4}s`);
        piece.style.setProperty("--dl", `${Math.random() * 0.4}s`);
        piece.style.setProperty("--r", `${Math.random() * 360}deg`);
        piece.style.setProperty("--sway", `${(Math.random() - 0.5) * 120}px`);
        frag.appendChild(piece);
      }
      confettiBox.replaceChildren(frag);
      setTimeout(() => confettiBox.replaceChildren(), 3600);
    };

    const finish = () => {
      const kiyoshi = document.createElement("strong");
      kiyoshi.className = "zd-kiyoshi";
      kiyoshi.textContent = "キ・ヨ・シ！";
      output.appendChild(kiyoshi);
      screen.scrollTop = screen.scrollHeight;
      burstConfetti();
      runBtn.disabled = false;
      runBtn.textContent = "▶ もう一度";
    };

    const run = () => {
      if (timer) clearInterval(timer);
      output.replaceChildren();
      runBtn.disabled = true;
      const buffer = [];
      let interval = prefersReducedMotion ? 40 : 260;

      const step = () => {
        const word = Math.random() < 0.5 ? "ズン" : "ドコ";
        const span = document.createElement("span");
        span.className = `zd-word ${word === "ズン" ? "zd-zun" : "zd-doko"}`;
        span.textContent = word;
        output.appendChild(span);
        screen.scrollTop = screen.scrollHeight;

        buffer.push(word);
        if (buffer.length > KIYOSHI_PATTERN.length) buffer.shift();

        if (
          buffer.length === KIYOSHI_PATTERN.length &&
          buffer.every((w, i) => w === KIYOSHI_PATTERN[i])
        ) {
          clearInterval(timer);
          timer = null;
          setTimeout(finish, prefersReducedMotion ? 0 : 350);
          return;
        }

        // だんだん加速して「キヨシ」到達を待ちすぎない
        if (interval > 70) {
          interval *= 0.965;
          clearInterval(timer);
          timer = setInterval(step, interval);
        }
      };

      timer = setInterval(step, interval);
    };

    runBtn.addEventListener("click", run);
  }
})();
