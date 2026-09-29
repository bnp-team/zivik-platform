/*
 * Дрібні покращення адмінки НаСвітло: текстові поля, які самі підлаштовують
 * висоту під текст.
 *
 * Адмінка EmDash задає висоту жорстко: довге поле «Текст» – 10 рядків, а
 * текстові підполя всередині списків (хронологія, події, примітки) – лише 3,
 * з полосою прокручування. Юридичний текст у три рядки не прочитати й не
 * відредагувати. Висоти в самій адмінці налаштувати не можна, тож цей файл,
 * який site/worker.ts додає до сторінок /_emdash/admin, тягне кожне поле за
 * текстом: не менше шести рядків, не більше 80% висоти вікна (далі –
 * прокручування всередині поля).
 *
 * Працює однаково в усіх браузерах (CSS `field-sizing` є не скрізь). Нічого не
 * зберігає й не змінює текст: лише висоту поля. Поля нашого власного
 * редактора JSON (.nsvj) тягнуться самі, їх не чіпаємо.
 */
(() => {
  if (window.__nsvTweaks) return;
  window.__nsvTweaks = true;

  const MIN = 96; /* px – шість рядків */
  const style = document.createElement("style");
  style.textContent = `textarea[data-nsv-grow]{min-height:${MIN}px;overflow-y:auto}`;
  document.head.appendChild(style);

  const fit = (t) => {
    if (!(t instanceof HTMLTextAreaElement) || t.closest(".nsvj")) return;
    if (t.offsetParent === null) return; /* згорнутий блок: розміру ще нема */
    const max = Math.max(MIN, Math.round(window.innerHeight * 0.8));
    t.setAttribute("data-nsv-grow", "");
    t.style.height = "auto";
    t.style.height = `${Math.min(Math.max(t.scrollHeight + 2, MIN), max)}px`;
  };
  const all = () => document.querySelectorAll("textarea").forEach(fit);

  let queued = false;
  const later = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      all();
    });
  };

  /* Друк, вставка, відкриття згорнутого рядка списку, нові поля. React ставить
     значення без події input, тож раз на секунду є ще й перевірка полів, що
     не влізли. */
  document.addEventListener("input", (e) => fit(e.target), true);
  document.addEventListener("toggle", later, true);
  window.addEventListener("resize", later);
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    document.querySelectorAll("textarea").forEach((t) => {
      if (!t.closest(".nsvj") && t.offsetParent !== null && t.scrollHeight > t.clientHeight + 3) fit(t);
    });
  }, 1000);
  later();
})();
