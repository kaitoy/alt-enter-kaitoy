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
   * 技術アイコンの立体クラウド (職務経歴の各章)
   * タイルは回転させず translate+scale で球面に配置のみ → ラベルは常に正立。
   * 回転は点群の座標計算側で行う (TagCanvas相当をバニラで)。
   * ゆっくり自動回転 + ドラッグで手動回転(慣性) + ホバーで減速。
   * reduced-motion 時は球を作らず平面グリッドのまま。
   * -------------------------------------------------------------------- */
  const clouds = document.querySelectorAll("[data-cloud]");
  if (clouds.length && !prefersReducedMotion) {
    const SPIN_BASE = 0.0016; // 自動回転の基本角速度(rad/frame)
    const HOVER_FACTOR = 0.28; // ホバー中の減速率
    const DECAY = 0.94; // ドラッグ後の慣性減衰

    clouds.forEach((container) => {
      const items = Array.from(container.querySelectorAll("li"));
      const n = items.length;
      if (!n) return;
      container.classList.add("is-cloud");

      // フィボナッチ球で各タイルに単位ベクトルを割り当て
      const points = items.map((el, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        return {
          el,
          ux: Math.sin(phi) * Math.cos(theta),
          uy: Math.sin(phi) * Math.sin(theta),
          uz: Math.cos(phi),
        };
      });

      const HOVER_RADIUS = 1.6; // ホバー時の球の広がり倍率
      let R = 200;
      const measure = () => {
        const w = container.clientWidth;
        const h = container.clientHeight || w;
        // 枠いっぱいに収まる半径を HOVER_RADIUS で割り、
        // 通常時(1.0)はやや余裕を持ち、ホバー(1.6倍)でちょうど枠いっぱいになるようにする
        const fit = Math.min(w, h, 720) / 2 - 56;
        R = Math.max(96, fit / HOVER_RADIUS);
      };
      measure();
      if ("ResizeObserver" in window) {
        new ResizeObserver(measure).observe(container);
      }

      // 回転角と角速度。ベースはゆっくり自動回転。
      let ax = -0.3;
      let ay = 0;
      let vx = SPIN_BASE * 0.35;
      let vy = SPIN_BASE;
      let speedFactor = 1; // ホバーで減速
      let radiusScale = 1; // 現在値
      let radiusTarget = 1; // 目標値。step()で滑らかに追従
      let dragging = false;
      let pointerId = null;
      let lastX = 0;
      let lastY = 0;

      const render = () => {
        const Reff = R * radiusScale;
        const cosY = Math.cos(ay);
        const sinY = Math.sin(ay);
        const cosX = Math.cos(ax);
        const sinX = Math.sin(ax);
        for (const p of points) {
          // Y軸回転 → X軸回転
          const x1 = p.ux * cosY + p.uz * sinY;
          const z1 = -p.ux * sinY + p.uz * cosY;
          const y1 = p.uy;
          const y2 = y1 * cosX - z1 * sinX;
          const z2 = y1 * sinX + z1 * cosX;
          const x2 = x1;

          const depth = (z2 + 1) / 2; // 0(奥)〜1(手前)
          const scale = 0.55 + depth * 0.55;
          const px = x2 * Reff;
          const py = y2 * Reff;
          p.el.style.transform =
            `translate(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
          p.el.style.opacity = (0.4 + depth * 0.6).toFixed(3);
          p.el.style.zIndex = String(Math.round(depth * 100));
        }
      };

      const step = () => {
        // ドラッグ中の回転は pointermove が直接行う。
        // 離している間だけ慣性をベース自動回転へ収束させる。
        if (!dragging) {
          vx = vx * DECAY + SPIN_BASE * 0.35 * speedFactor * (1 - DECAY);
          vy = vy * DECAY + SPIN_BASE * speedFactor * (1 - DECAY);
          ax += vx;
          ay += vy;
        }
        // ホバーで広がった半径を滑らかに追従させる
        radiusScale += (radiusTarget - radiusScale) * 0.12;
        render();
      };

      // ビューポート内のときだけ回す
      let rafId = null;
      let visible = true;
      const loop = () => {
        step();
        if (visible) rafId = requestAnimationFrame(loop);
        else rafId = null;
      };
      const start = () => {
        if (rafId == null) rafId = requestAnimationFrame(loop);
      };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            if (visible) start();
          },
          { threshold: 0 }
        ).observe(container);
      }
      render();
      start();

      // --- ドラッグ操作 (マウス/タッチ共通) ---
      container.addEventListener("pointerdown", (e) => {
        dragging = true;
        pointerId = e.pointerId;
        lastX = e.clientX;
        lastY = e.clientY;
        container.classList.add("is-grabbing");
        container.setPointerCapture(pointerId);
      });
      container.addEventListener("pointermove", (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        vy = dx * 0.005;
        vx = -dy * 0.005;
        ax += vx;
        ay += vy;
      });
      const endDrag = (e) => {
        if (e.pointerId !== pointerId) return;
        dragging = false;
        pointerId = null;
        container.classList.remove("is-grabbing");
      };
      container.addEventListener("pointerup", endDrag);
      container.addEventListener("pointercancel", endDrag);

      // --- ホバーで減速 (タッチでは pointerenter が発火しない端末もあるが装飾) ---
      container.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse") {
          speedFactor = HOVER_FACTOR;
          radiusTarget = HOVER_RADIUS; // 1.6倍に広げる
        }
      });
      container.addEventListener("pointerleave", () => {
        speedFactor = 1;
        radiusTarget = 1;
      });
    });
  }

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
