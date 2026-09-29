/*
 * Гід по адмінці НаСвітло – покрокове знайомство для нового користувача.
 *
 * site/worker.ts додає цей файл у кожну сторінку /_emdash/admin. Адмінка
 * EmDash – готовий застосунок, тож гід не змінює її, а лише підсвічує її
 * пункти меню й кнопки поверх: затемнення з «віконцем» навколо елемента і
 * картка з поясненням, «Далі» / «Назад» / «Пропустити».
 *
 * Два тури:
 *   - «intro» – меню й розділи, на будь-якій сторінці адмінки, крім запису;
 *   - «editor» – форма запису: розділи, Зберегти, Опублікувати, Live View,
 *     історія версій.
 * Кожен показується сам один раз (пам'ять браузера), далі – з кнопки «Гід»
 * у правому нижньому куті. Елемент, якого на сторінці немає (напр.
 * «Користувачі» в не-адміністратора), крок пропускає.
 *
 * Елементи шукаються за адресою посилання і за підписом кнопки – англійським,
 * як в адмінці зараз, і українським на випадок перекладу. Якщо оновлення
 * EmDash змінить підпис, крок покажеться посередині екрана, без підсвітки.
 *
 * Кольори тут – літерали, а не токени --brand-*: це не сторінка сайту, а
 * шар поверх адмінки EmDash, де globals.css не завантажено. Значення ті самі:
 * вишня #7f1716, золото #d9ab5e, ніч #17110f.
 */
(() => {
  if (window.__nsvGuide) return;
  window.__nsvGuide = true;

  const BASE = "/_emdash/admin";
  const VERSION = "v1";
  const SKIP = /\/(login|setup|signup|invite|device|auth|magic)/;
  const store = {
    get: (k) => {
      try {
        return localStorage.getItem(`nsv-guide-${VERSION}:${k}`);
      } catch {
        return "1";
      }
    },
    set: (k) => {
      try {
        localStorage.setItem(`nsv-guide-${VERSION}:${k}`, "1");
      } catch {
        /* private mode: the tour just shows again */
      }
    },
  };

  /* ── Finding things ─────────────────────────────────────────────────── */

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();

  /** First visible element matching any of the candidates. */
  function find(candidates) {
    for (const c of candidates) {
      if (c.href) {
        const el = [...document.querySelectorAll(`a[href="${BASE}${c.href}"], a[href$="${c.href}"]`)].find(visible);
        if (el) return el;
      }
      if (c.text) {
        const want = [].concat(c.text);
        const pool = document.querySelectorAll(c.in || "a, button, [role=button], h2, h3, summary, label");
        const el = [...pool].find(
          (e) => visible(e) && want.some((w) => (c.starts ? text(e).startsWith(w) : text(e) === w)) && !e.closest(".nsvg-root"),
        );
        if (el) return el;
      }
      if (c.match) {
        const el = [...document.querySelectorAll(c.in || "label, span, p")].find(
          (e) => visible(e) && c.match.test(text(e)) && !e.closest(".nsvg-root"),
        );
        if (el) return el;
      }
    }
    return null;
  }

  /* ── The tours ─────────────────────────────────────────────────────── */

  const TOURS = {
    intro: [
      {
        title: "Вітаємо в адмінці НаСвітло",
        body:
          "За хвилину покажемо, де що лежить і як зміна потрапляє на сайт. " +
          "Гід можна закрити будь-коли й відкрити знову кнопкою «Гід» унизу праворуч.",
      },
      {
        target: [{ href: "/content/summaries" }, { text: "Бібліотека" }],
        title: "Бібліотека",
        body:
          "Серце сайту. «Огляди рішень» – сторінки справ /uk/cases/…; «Провадження» – рядки реєстру " +
          "в бібліотеці; «Інституції» – суди й трибунали. Найчастіше ви працюватимете тут.",
      },
      {
        target: [{ text: "Сайт" }, { href: "/content/team" }],
        title: "Сторінки сайту",
        body: "«Команда», «Партнери» і «Про проєкт» – тексти відповідних сторінок і блоків на головній.",
      },
      {
        target: [{ text: "Мапа" }, { href: "/content/map_events" }],
        title: "Мапа",
        body: "Події, міста судів і країни на мапі /uk/map: що підсвічується і куди ведуть лінії.",
      },
      {
        target: [{ text: "Блог" }, { href: "/content/posts" }],
        title: "Блог",
        body:
          "Дописи редакції. Розділ «Блог» з'являється на сайті сам – щойно опубліковано перший допис.",
      },
      {
        target: [{ text: ["View Site", "Переглянути сайт"] }],
        title: "Відкрити сайт",
        body: "Сайт у новій вкладці – щоб звірити, як виглядає опубліковане.",
      },
      {
        target: [{ href: "/users" }, { text: ["Users", "Користувачі"] }],
        title: "Користувачі",
        body:
          "Запрошення нових редакторів і їхні ролі. Публікує на сайт лише адміністратор; " +
          "редактор зберігає чернетку й просить перевірити.",
      },
      {
        title: "Як зміна потрапляє на сайт",
        body:
          "<b>Save (Зберегти)</b> – чернетка: на сайті нічого не змінюється.<br>" +
          "<b>Publish (Опублікувати)</b> – сайт перезбирається, і за ~2 хвилини зміна видно всім.<br><br>" +
          "Відкрийте будь-який запис – гід покаже, як працює форма.",
      },
    ],
    editor: [
      {
        title: "Редагування запису",
        body: "Коротко про форму запису: де шукати поля і що роблять кнопки праворуч.",
      },
      {
        target: [{ match: /^\d+ · /, in: "label, span, legend, p, h3" }],
        title: "Поля за розділами сторінки",
        body:
          "Форма йде в порядку сторінки згори донизу. Номер і назва розділу – на початку назви поля: " +
          "«2 · Шапка – Суд». (UA) і (EN) – та сама річ двома мовами.",
      },
      {
        target: [{ text: ["Save", "Saved", "Зберегти", "Збережено"] }],
        title: "Зберегти",
        body: "Зберігає чернетку. На сайті нічого не змінюється, доки запис не опубліковано.",
      },
      {
        target: [{ text: ["Publish changes", "Publish", "Опублікувати"], starts: true, in: "button" }],
        title: "Опублікувати",
        body:
          "Надсилає зміни на сайт: за ~2 хвилини їх видно всім. Для вже опублікованого запису кнопка " +
          "називається «Publish changes». Публікує адміністратор.",
      },
      {
        target: [{ text: ["Live View", "Переглянути наживо"] }],
        title: "Live View",
        body: "Відкриває сторінку цього запису на сайті. Після публікації зачекайте ~2 хвилини й оновіть.",
      },
      {
        target: [{ text: ["Revisions", "Версії", "Ревізії"] }],
        title: "Історія версій",
        body: "Усі збережені версії запису: можна порівняти й повернути попередню, якщо щось пішло не так.",
      },
      {
        title: "Готово",
        body:
          "Якщо зберегти не вдається, адмінка напише, яке поле виправити. " +
          "Гід завжди під кнопкою «Гід» унизу праворуч.",
      },
    ],
  };

  const tourFor = (path) => (/\/content\/[^/]+\/[^/]+/.test(path) ? "editor" : "intro");

  /* ── Drawing ───────────────────────────────────────────────────────── */

  const css = `
.nsvg-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.nsvg-shade{position:fixed;inset:0;background:rgba(15,12,10,.55);pointer-events:auto}
.nsvg-hole{position:fixed;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,12,10,.55),0 0 0 3px #d9ab5e;pointer-events:none;transition:all .2s ease}
.nsvg-card{position:fixed;width:min(360px,calc(100vw - 32px));background:#fffdf9;color:#1a1917;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:18px 18px 14px;pointer-events:auto}
.nsvg-card h2{margin:0 0 6px;font-size:17px;line-height:1.3;font-weight:650}
.nsvg-card p{margin:0 0 14px;color:#3d3a35}
.nsvg-foot{display:flex;align-items:center;gap:8px}
.nsvg-count{margin-right:auto;color:#76716a;font-size:12px}
.nsvg-card button{font:inherit;border-radius:999px;padding:7px 14px;cursor:pointer;border:1px solid #cfc8bd;background:transparent;color:#1a1917}
.nsvg-card button.nsvg-next{background:#7f1716;border-color:#7f1716;color:#fff}
.nsvg-card button:focus-visible,.nsvg-fab:focus-visible{outline:2px solid #d9ab5e;outline-offset:2px}
.nsvg-x{position:absolute;top:8px;right:8px;border:0!important;padding:4px 9px!important;font-size:18px!important;line-height:1;color:#76716a!important}
.nsvg-fab{position:fixed;right:16px;bottom:16px;z-index:2147482999;font:600 13px/1 system-ui,sans-serif;border-radius:999px;padding:10px 14px;border:1px solid #d9ab5e;background:#17110f;color:#f4e3c1;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
@media (prefers-reduced-motion:reduce){.nsvg-hole{transition:none}}`;

  let root = null;
  let state = null; // { name, steps, i, target }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function close(done) {
    if (state && done) store.set(state.name);
    state = null;
    root?.remove();
    root = null;
    removeEventListener("keydown", onKey, true);
    removeEventListener("resize", place);
    removeEventListener("scroll", place, true);
  }

  function onKey(e) {
    if (!state) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  }

  function place() {
    if (!state || !root) return;
    const card = root.querySelector(".nsvg-card");
    const hole = root.querySelector(".nsvg-hole");
    const shade = root.querySelector(".nsvg-shade");
    const t = state.target;
    if (!t || !t.isConnected || !visible(t)) {
      hole.style.display = "none";
      shade.style.display = "block";
      card.style.left = `${(innerWidth - card.offsetWidth) / 2}px`;
      card.style.top = `${Math.max(16, (innerHeight - card.offsetHeight) / 2)}px`;
      return;
    }
    shade.style.display = "none";
    hole.style.display = "block";
    const r = t.getBoundingClientRect();
    const pad = 6;
    Object.assign(hole.style, {
      left: `${r.left - pad}px`,
      top: `${r.top - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`,
    });
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const gap = 16;
    let left;
    let top;
    if (r.right + gap + cw <= innerWidth - 16) {
      left = r.right + gap; // right of it – the sidebar
      top = r.top + r.height / 2 - ch / 2;
    } else if (r.left - gap - cw >= 16) {
      left = r.left - gap - cw; // left of it – the buttons on the right
      top = r.top + r.height / 2 - ch / 2;
    } else if (r.bottom + gap + ch <= innerHeight - 16) {
      left = r.left + r.width / 2 - cw / 2; // below
      top = r.bottom + gap;
    } else {
      left = r.left + r.width / 2 - cw / 2; // above
      top = r.top - gap - ch;
    }
    card.style.left = `${Math.min(Math.max(16, left), innerWidth - cw - 16)}px`;
    card.style.top = `${Math.min(Math.max(16, top), innerHeight - ch - 16)}px`;
  }

  /** The next step whose element is on the page (or that needs none). */
  function resolve(from, dir) {
    for (let i = from; i >= 0 && i < state.steps.length; i += dir) {
      const s = state.steps[i];
      if (!s.target) return { i, target: null };
      const t = find(s.target);
      if (t) return { i, target: t };
    }
    return null;
  }

  function go(dir) {
    const next = resolve(state.i + dir, dir);
    if (!next) {
      if (dir > 0) close(true);
      return;
    }
    show(next.i, next.target);
  }

  function show(i, target) {
    state.i = i;
    state.target = target;
    const s = state.steps[i];
    const last = !resolve(i + 1, 1);
    const first = !resolve(i - 1, -1);
    const card = root.querySelector(".nsvg-card");
    card.innerHTML = "";
    const x = el("button", "nsvg-x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Закрити гід");
    x.onclick = () => close(true);
    const h = el("h2", null);
    h.id = "nsvg-title";
    h.textContent = s.title;
    const p = el("p", null, s.body);
    const foot = el("div", "nsvg-foot");
    const total = state.steps.length;
    foot.append(el("span", "nsvg-count", `${i + 1} з ${total}`));
    if (!first) {
      const back = el("button", null, "Назад");
      back.type = "button";
      back.onclick = () => go(-1);
      foot.append(back);
    } else {
      const skip = el("button", null, "Пропустити");
      skip.type = "button";
      skip.onclick = () => close(true);
      foot.append(skip);
    }
    const nextBtn = el("button", "nsvg-next", last ? "Готово" : "Далі");
    nextBtn.type = "button";
    nextBtn.onclick = () => go(1);
    foot.append(nextBtn);
    card.append(x, h, p, foot);
    if (target) target.scrollIntoView({ block: "nearest", inline: "nearest" });
    requestAnimationFrame(place);
    nextBtn.focus({ preventScroll: true });
  }

  function start(name) {
    close(false);
    state = { name, steps: TOURS[name], i: 0, target: null };
    root = el("div", "nsvg-root");
    const card = el("div", "nsvg-card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "nsvg-title");
    root.append(el("div", "nsvg-shade"), el("div", "nsvg-hole"), card);
    document.body.append(root);
    addEventListener("keydown", onKey, true);
    addEventListener("resize", place);
    addEventListener("scroll", place, true);
    const first = resolve(0, 1);
    show(first.i, first.target);
  }

  /* ── When to show ──────────────────────────────────────────────────── */

  function fab() {
    if (document.querySelector(".nsvg-fab")) return;
    const b = el("button", "nsvg-fab", "Гід");
    b.type = "button";
    b.title = "Показати гід по цій сторінці";
    b.onclick = () => start(tourFor(location.pathname));
    document.body.append(b);
  }

  let lastPath = "";
  let waiting = 0;
  function tick() {
    const path = location.pathname;
    if (!path.startsWith(BASE) || SKIP.test(path)) {
      document.querySelector(".nsvg-fab")?.remove();
      return;
    }
    fab();
    if (path === lastPath || state) return;
    const name = tourFor(path);
    if (store.get(name)) {
      lastPath = path;
      return;
    }
    /* Wait for the app to draw its menu or form before pointing at it. */
    const ready = name === "editor" ? find(TOURS.editor[2].target) : find([{ href: "/content/summaries" }]);
    if (ready || ++waiting > 20) {
      lastPath = path;
      waiting = 0;
      start(name);
    }
  }

  const style = el("style");
  style.textContent = css;
  document.head.append(style);
  setInterval(tick, 500);
})();
