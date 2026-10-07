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
 * у правому нижньому куті. Браузер пам'ятає не тур, а кроки (поле `id`):
 * коли в тур додається новий крок, гід сам покаже лише його, з позначкою
 * «Нове». Тож новий крок – новий `id`; переписаний текст старого кроку
 * вдруге не показується, а перейменований `id` покажеться як новий.
 * «Один раз» рахується з показу, а не з «Пропустити»: тур, кинутий на
 * півдорозі (перехід на іншу сторінку, оновлення вкладки), сам більше не
 * відкривається – редакторка бачила його щоразу, коли заходила в адмінку.
 * Елемент, якого на сторінці немає (напр. «Користувачі» в
 * не-адміністратора), крок пропускає.
 *
 * Пам'ять – окремо для кожного браузера й адреси: на новому комп'ютері чи
 * після переїзду на іншу адресу гід покажеться ще раз.
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
  const SKIP = /\/(login|setup|signup|invite|device|auth|magic)/;
  const SEEN = "nsv-guide:seen";
  /* Which steps this browser has already been shown, by step id. A tour
     shows itself only with the steps not in here: the whole tour the first
     time, later just a step added since («Нове в адмінці»). */
  const store = {
    seen() {
      try {
        const raw = localStorage.getItem(SEEN);
        if (raw) return new Set(JSON.parse(raw));
        /* Before step ids, «seen» was one flag per tour (v1). Such a tour
           counts as fully seen: every step that exists today was in it. */
        const set = new Set();
        for (const name of Object.keys(TOURS)) {
          if (localStorage.getItem(`nsv-guide-v1:${name}`)) TOURS[name].forEach((s) => set.add(s.id));
        }
        return set;
      } catch {
        return null; // no storage: never show by itself, only from «Гід»
      }
    },
    mark(steps) {
      try {
        const set = store.seen() || new Set();
        steps.forEach((s) => set.add(s.id));
        localStorage.setItem(SEEN, JSON.stringify([...set]));
      } catch {
        /* private mode: nothing to remember */
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
        id: "welcome",
        title: "Вітаємо в адмінці НаСвітло",
        body:
          "За хвилину покажемо, де що лежить і як зміна потрапляє на сайт. " +
          "Гід можна закрити будь-коли й відкрити знову кнопкою «Гід» унизу праворуч.",
      },
      {
        id: "library",
        target: [{ href: "/content/summaries" }, { text: "Бібліотека" }],
        title: "Бібліотека",
        body:
          "Серце сайту. «Огляди рішень» – сторінки справ /uk/cases/…; «Провадження» – рядки реєстру " +
          "в бібліотеці; «Інституції» – суди й трибунали. Найчастіше ви працюватимете тут.",
      },
      {
        id: "site",
        target: [{ text: "Сайт" }, { href: "/content/team" }],
        title: "Сторінки сайту",
        body: "«Команда», «Партнери» і «Про проєкт» – тексти відповідних сторінок і блоків на головній.",
      },
      {
        id: "map",
        target: [{ text: "Мапа" }, { href: "/content/map_events" }],
        title: "Мапа",
        body: "Події, міста судів і країни на мапі /uk/map: що підсвічується і куди ведуть лінії.",
      },
      {
        id: "blog",
        target: [{ text: "Блог" }, { href: "/content/posts" }],
        title: "Блог",
        body:
          "Дописи редакції. Розділ «Блог» з'являється на сайті сам – щойно опубліковано перший допис.",
      },
      {
        id: "view-site",
        target: [{ text: ["View Site", "Переглянути сайт"] }],
        title: "Відкрити сайт",
        body: "Сайт у новій вкладці – щоб звірити, як виглядає опубліковане.",
      },
      {
        id: "users",
        target: [{ href: "/users" }, { text: ["Users", "Користувачі"] }],
        title: "Користувачі",
        body:
          "Запрошення нових редакторів і їхні ролі. Публікує на сайт лише адміністратор; " +
          "редактор зберігає чернетку й просить перевірити.",
      },
      {
        id: "publish-flow",
        title: "Як зміна потрапляє на сайт",
        body:
          "<b>Save (Зберегти)</b> – чернетка: на сайті нічого не змінюється.<br>" +
          "<b>Publish (Опублікувати)</b> – сайт перезбирається, і за ~2 хвилини зміна видно всім.<br><br>" +
          "Відкрийте будь-який запис – гід покаже, як працює форма.",
      },
    ],
    editor: [
      {
        id: "editor-welcome",
        title: "Редагування запису",
        body: "Коротко про форму запису: де шукати поля і що роблять кнопки праворуч.",
      },
      {
        id: "sections",
        target: [{ match: /^\d+ · /, in: "label, span, legend, p, h3" }],
        title: "Поля за розділами сторінки",
        body:
          "Форма йде в порядку сторінки згори донизу. Номер і назва розділу – на початку назви поля: " +
          "«2 · Шапка – Суд». (UA) і (EN) – та сама річ двома мовами.",
      },
      {
        id: "save",
        target: [{ text: ["Save", "Saved", "Зберегти", "Збережено"] }],
        title: "Зберегти",
        body: "Зберігає чернетку. На сайті нічого не змінюється, доки запис не опубліковано.",
      },
      {
        id: "publish",
        target: [{ text: ["Publish changes", "Publish", "Опублікувати"], starts: true, in: "button" }],
        title: "Опублікувати",
        body:
          "Надсилає зміни на сайт: за ~2 хвилини їх видно всім. Для вже опублікованого запису кнопка " +
          "називається «Publish changes». Публікує адміністратор.",
      },
      {
        id: "live-view",
        target: [{ text: ["Live View", "Переглянути наживо"] }],
        title: "Live View",
        body: "Відкриває сторінку цього запису на сайті. Після публікації зачекайте ~2 хвилини й оновіть.",
      },
      {
        id: "revisions",
        target: [{ text: ["Revisions", "Версії", "Ревізії"] }],
        title: "Історія версій",
        body: "Усі збережені версії запису: можна порівняти й повернути попередню, якщо щось пішло не так.",
      },
      {
        id: "editor-done",
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

  function close() {
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
      close();
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
      if (dir > 0) close();
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
    x.onclick = () => close();
    const h = el("h2", null);
    h.id = "nsvg-title";
    h.textContent = s.title;
    const p = el("p", null, s.body);
    const foot = el("div", "nsvg-foot");
    const total = state.steps.length;
    foot.append(el("span", "nsvg-count", `${state.news ? "Нове · " : ""}${i + 1} з ${total}`));
    if (!first) {
      const back = el("button", null, "Назад");
      back.type = "button";
      back.onclick = () => go(-1);
      foot.append(back);
    } else {
      const skip = el("button", null, "Пропустити");
      skip.type = "button";
      skip.onclick = () => close();
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

  function start(name, steps = TOURS[name], news = false) {
    close();
    state = { name, steps, news, i: 0, target: null };
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
    if (!first) return close();
    store.mark(steps);
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
    const seen = store.seen();
    const fresh = seen ? TOURS[name].filter((s) => !seen.has(s.id)) : [];
    if (!fresh.length) {
      lastPath = path;
      return;
    }
    /* Wait for the app to draw its menu or form before pointing at it. */
    const ready = name === "editor" ? find(TOURS.editor[2].target) : find([{ href: "/content/summaries" }]);
    if (!ready && ++waiting <= 20) return;
    lastPath = path;
    waiting = 0;
    if (fresh.length === TOURS[name].length) return start(name);
    /* Only what was added since: a step whose element is not on this page
       (e.g. «Користувачі» for an editor) waits for a page that has it. */
    const news = fresh.filter((s) => !s.target || find(s.target));
    if (news.length) start(name, news, true);
  }

  const style = el("style");
  style.textContent = css;
  document.head.append(style);
  setInterval(tick, 500);
})();
