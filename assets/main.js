(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ================= Hero intro ================= */
  // "Hello" drops in, in different languages, ending on Vietnamese.
  const HELLOS = ["Hello", "Hola", "Bonjour", "こんにちは", "안녕하세요", "Ciao", "Hallo", "مرحبا", "你好", "Olá", "नमस्ते", "Xin chào"];
  const GREETING = "I'm ";
  const NAME = "Linh";

  const hero = $(".hero");
  const hello = $(".hello");
  const iam = $(".iam");
  const timers = [];
  let finished = false;

  HELLOS.forEach(w => {
    const s = document.createElement("span");
    s.textContent = w;
    hello.appendChild(s);
  });
  const helloEls = $$("span", hello);

  [...GREETING].forEach(ch => addChar(ch, false));
  [...NAME].forEach((ch, i) => addChar(ch, true, i));
  function addChar(ch, isName, i) {
    const s = document.createElement("span");
    s.className = "ch" + (ch === " " ? " sp" : "") + (isName ? " name" : "");
    s.textContent = ch === " " ? " " : ch;
    if (isName) s.style.setProperty("--bp", `${(i / (NAME.length - 1)) * 100}%`);
    s.setAttribute("aria-hidden", "true");
    iam.appendChild(s);
  }
  const chars = $$(".ch", iam);

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function playIntro() {
    let t = 300;
    helloEls.forEach((el, i) => {
      const last = i === helloEls.length - 1;
      later(() => {
        if (i > 0) { helloEls[i - 1].classList.remove("drop"); helloEls[i - 1].classList.add("out"); }
        el.classList.add("drop");
      }, t);
      // Start slow, speed up through the middle, slow down for the last one.
      t += last ? 0 : Math.max(230, 620 - i * 60);
    });
    t += 450;
    later(() => chars.forEach((c, i) => { c.style.setProperty("--d", `${i * 75}ms`); c.classList.add("in"); }), t);
    t += chars.length * 75 + 650;
    later(finishIntro, t);
  }

  function finishIntro() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    helloEls.forEach((el, i) => {
      el.classList.remove("drop", "out");
      el.classList.toggle("stay", i === helloEls.length - 1);
    });
    chars.forEach(c => { if (!c.classList.contains("in")) { c.style.setProperty("--d", "0ms"); c.classList.add("in"); } });
    hero.classList.add("done");
    document.body.classList.remove("intro-running");
    // Pin the final state once the drop animations should be over, in case the browser paused them.
    // Re-measure the Path once everything has stopped moving.
    setTimeout(() => { hero.classList.add("settled"); layout(); }, 1500);
    setTimeout(lightAbout, 450);
    setTimeout(startPath, 1100);
    if (!reduceMotion) setTimeout(startTyping, 2600);
  }

  // After the intro, keep cycling the greeting by deleting and typing it.
  function startTyping() {
    hello.classList.add("typing");
    hello.innerHTML = `<span class="typed"></span><span class="caret"></span>`;
    const typed = $(".typed", hello);
    const loop = [HELLOS[HELLOS.length - 1], ...HELLOS.slice(0, -1)];
    let w = 0, text = [...loop[0]], n = text.length, deleting = true;
    typed.textContent = loop[0];

    const step = () => {
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; w = (w + 1) % loop.length; text = [...loop[w]]; }
      } else {
        n++;
      }
      typed.textContent = text.slice(0, Math.max(0, n)).join("");
      hello.classList.add("busy");
      if (!deleting && n >= text.length) {
        hello.classList.remove("busy");
        deleting = true;
        return setTimeout(step, 1800);       // hold the full word
      }
      setTimeout(step, deleting ? 55 : 110 + Math.random() * 60);
    };
    setTimeout(step, 1200);
  }

  $(".skip").addEventListener("click", finishIntro);
  addEventListener("keydown", e => { if (e.key === "Escape") finishIntro(); });

  // Skip the intro when reduced motion is on or the page opens partway down (e.g. a #link).
  if (reduceMotion || location.hash || scrollY > 10) {
    finishIntro();
    // The scroll lock blocked the browser's own jump to the #section, so do it now.
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "instant" }), 0);
  } else playIntro();

  /* ================= Nav ================= */
  const nav = $(".nav");
  const heroTop = $(".hero-top");
  const statement = $("[data-words]");

  // Split the About statement into words so they can light up one by one.
  const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(part);
      const s = document.createElement("span");
      s.className = "wd";
      s.textContent = part;
      frag.append(s);
    });
    node.replaceWith(frag);
  });
  const words = $$(".wd", statement);

  // Once the intro ends: light the About words in sequence, then count up the stats.
  function lightAbout() {
    const step = reduceMotion ? 0 : 45;
    words.forEach((w, i) => setTimeout(() => w.classList.add("lit"), i * step));
    setTimeout(() => $$(".hero-about [data-count]").forEach(countUp), words.length * step * 0.6);
  }

  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle("scrolled", y > 20);
    nav.classList.toggle("on-dark", y < hero.offsetHeight - 40);

    // The intro and About shrink and fade a little as you scroll down to the Path.
    if (!reduceMotion && y < vh * 1.2) {
      const p = Math.min(1, y / vh);
      heroTop.style.transform = `scale(${1 - p * 0.06})`;
      heroTop.style.opacity = String(Math.max(0.15, 1 - p * 1.1));
    }

  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  const navLinks = $$(".nav-links a");
  const sectionIO = new IntersectionObserver(items => items.forEach(it => {
    if (!it.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + it.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("#about, #path, main section[id]").forEach(s => sectionIO.observe(s));

  /* ================= Split headings into letters ================= */
  $$("[data-split]").forEach(el => {
    let n = 0;
    el.innerHTML = el.textContent.split(" ").map(word =>
      `<span class="w">${[...word].map(c => `<span class="c" style="--d:${n++ * 35}ms">${c}</span>`).join("")}</span>`
    ).join(" ");
  });

  /* ================= Scroll reveals ================= */
  const revealIO = new IntersectionObserver(items => {
    let n = 0;
    items.forEach(it => {
      if (!it.isIntersecting) return;
      const el = it.target;
      if (el.hasAttribute("data-reveal")) el.style.setProperty("--d", `${n++ * 0.1}s`);
      el.classList.add("in");
      revealIO.unobserve(el);
      el.querySelectorAll("[data-count]").forEach(countUp);
    });
  }, { threshold: 0.2 });
  $$("[data-reveal], [data-split]").forEach(el => revealIO.observe(el));

  function countUp(el) {
    const target = +el.dataset.count, suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { el.textContent = target + suffix; }, dur + 200);  // in case frames were paused
  }

  /* ================= Card spotlight ================= */
  $$(".card").forEach(card => card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--px", `${e.clientX - r.left}px`);
    card.style.setProperty("--py", `${e.clientY - r.top}px`);
  }));

  /* ================= Path timeline ================= */
  // Dates are "YYYY-MM"; end: null means ongoing. Optional gaps: [{ start, end, label }].
  const ENTRIES = [
    { org: "University of Illinois Chicago", role: "B.S. in Computer Science",         type: "study",    start: "2018-08", end: "2023-05",
      gaps: [{ start: "2020-08", end: "2022-01", label: "Gap year" }] },
    { org: "Becton Dickinson",               role: "Data Science Intern",              type: "industry", start: "2019-06", end: "2019-07" },
    { org: "VinBigData",                     role: "Research Intern",                  type: "research", start: "2020-11", end: "2021-11" },
    { org: "University of Illinois Chicago", role: "Teaching Assistant",               type: "teaching", start: "2022-01", end: "2023-05" },
    { org: "University of Illinois Chicago", role: "Research Assistant",               type: "research", start: "2022-06", end: "2023-06" },
    { org: "UIC College of Dentistry",       role: "Graduate IT Help Desk Assistant",  type: "industry", start: "2023-06", end: "2024-06" },
    { org: "University of Illinois Chicago", role: "M.S. in Computer Science",         type: "study",    start: "2023-08", end: "2024-07" },
    { org: "University of Illinois Chicago", role: "Master’s Project Mentor",          type: "teaching", start: "2024-05", end: "2024-12" },
    { org: "National Louis University",      role: "Lecturer",                         type: "teaching", start: "2024-08", end: "2025-03" },
    { org: "MBZUAI",                         role: "Research Associate II",            type: "research", start: "2025-04", end: null },
  ];
  const STAGGER = 0.12;

  const toYear = s => { const [y, m] = s.split("-").map(Number); return y + (m - 1) / 12; };
  const now = new Date(); const nowY = now.getFullYear() + now.getMonth() / 12;
  const data = ENTRIES.map(e => ({ ...e, s: toYear(e.start), e: e.end ? toYear(e.end) : nowY + 0.15 }));
  const min = Math.min(...data.map(d => d.s)) - 0.35;
  const max = Math.max(...data.map(d => d.e)) + 0.1;
  const pct = y => ((y - min) / (max - min)) * 100;

  const chart = $(".path-chart");
  const grid = $(".path-grid");
  const rows = $(".path-rows");
  const axis = $(".path-axis");

  for (let y = Math.ceil(min); y <= max; y++) {
    grid.insertAdjacentHTML("beforeend", `<span style="left:${pct(y)}%"></span>`);
    if (y % 2 === 0) axis.insertAdjacentHTML("beforeend", `<b style="left:calc(12px + (100% - 24px) * ${pct(y) / 100})">${y}</b>`);
  }

  data.forEach(d => {
    const row = document.createElement("div");
    row.className = "path-row";
    row.style.setProperty("--c", `var(--${d.type})`);
    row.style.setProperty("--d", "0s");
    row.innerHTML = `
      <div class="path-label"><strong>${d.org}</strong><span>${d.role}</span></div>
      <div class="path-bar${d.end ? "" : " ongoing"}${d.gaps ? " split" : ""}" style="left:${pct(d.s)}%;width:${pct(d.e) - pct(d.s)}%">${gapHTML(d)}</div>`;
    rows.appendChild(row);
  });

  // A split bar: solid segments with a dashed, labelled break for each gap.
  function gapHTML(d) {
    if (!d.gaps) return "";
    const rel = y => ((y - d.s) / (d.e - d.s)) * 100;
    let html = "", from = 0;
    d.gaps.forEach(g => {
      const a = rel(toYear(g.start)), b = rel(toYear(g.end));
      html += `<i class="seg" style="left:${from}%;width:${a - from}%"></i>`;
      html += `<i class="gap" style="left:${a}%;width:${b - a}%"><em>${g.label || "Gap"}</em></i>`;
      from = b;
    });
    return html + `<i class="seg" style="left:${from}%;width:${100 - from}%"></i>`;
  }

  // On wide screens the whole first screen fits in the viewport: rows share the
  // height left below the intro and About, and each label sits beside its bar.
  const compact = matchMedia("(min-width: 901px)");
  const heroEl = $(".hero");
  function layout() {
    const W = rows.clientWidth;
    const isCompact = compact.matches;
    if (isCompact) {
      rows.style.setProperty("--row", "30px");
      const top = rows.getBoundingClientRect().top - heroEl.getBoundingClientRect().top;
      const avail = innerHeight - top - 56;  // room for the axis and bottom padding
      rows.style.setProperty("--row", `${Math.max(24, Math.min(44, avail / data.length))}px`);
    } else {
      rows.style.removeProperty("--row");
    }
    $$(".path-row", rows).forEach((row, i) => {
      const label = $(".path-label", row);
      const startX = (pct(data[i].s) / 100) * W;
      const endX = (pct(data[i].e) / 100) * W;
      const w = label.offsetWidth;
      let left, right;
      if (isCompact) {
        // After the bar if it fits, otherwise before it.
        right = endX + 12 + w > W;
        left = right ? Math.max(0, startX - 12 - w) : endX + 12;
      } else {
        // Above the bar, right-aligned to its end, kept inside the chart.
        left = Math.max(0, Math.min(endX - w, W - w));
        right = left > 0;
      }
      label.style.left = left + "px";
      label.classList.toggle("right", right);
    });
  }
  layout();
  addEventListener("resize", layout);
  document.fonts?.ready.then(layout);

  // Rows revealed in the same batch are staggered one after another.
  const pathIO = new IntersectionObserver(items => {
    let n = 0;
    items.forEach(it => {
      if (!it.isIntersecting) return;
      if (it.target.classList.contains("path-row")) it.target.style.setProperty("--d", `${n++ * STAGGER}s`);
      it.target.classList.add("in");
      pathIO.unobserve(it.target);
    });
  }, { threshold: 0.35 });
  // Called once the intro is over, so the bars don't draw behind it.
  function startPath() {
    pathIO.observe(chart);
    $$(".path-row", rows).forEach(r => pathIO.observe(r));
  }
})();
