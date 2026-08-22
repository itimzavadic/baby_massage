(() => {
  const scroller = document.getElementById("scroller");
  const sections = [...document.querySelectorAll("[data-section]")];
  const dots = [...document.querySelectorAll(".dot")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lockMs = 820;

  if (!scroller || !sections.length) return;

  let index = 0;
  let locked = false;
  let touchStartY = 0;

  const clamp = (value) => Math.max(0, Math.min(sections.length - 1, value));

  const setActive = (next) => {
    index = next;
    dots.forEach((dot, i) => {
      const on = i === next;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const goTo = (next) => {
    next = clamp(next);
    if (next === index) return;
    locked = true;
    setActive(next);
    sections[next].scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      locked = false;
    }, lockMs);
  };

  const sectionAtEdge = (delta) => {
    const current = sections[index];
    if (current.scrollHeight <= current.clientHeight + 2) return true;
    const atTop = current.scrollTop <= 1;
    const atBottom =
      current.scrollTop + current.clientHeight >= current.scrollHeight - 2;
    return delta > 0 ? atBottom : atTop;
  };

  if (!reduced) {
    scroller.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) < 10) return;
        if (!sectionAtEdge(event.deltaY)) return;
        event.preventDefault();
        if (locked) return;
        goTo(index + (event.deltaY > 0 ? 1 : -1));
      },
      { passive: false }
    );

    scroller.addEventListener(
      "touchstart",
      (event) => {
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    scroller.addEventListener(
      "touchend",
      (event) => {
        const delta = touchStartY - event.changedTouches[0].clientY;
        if (Math.abs(delta) < 42 || locked) return;
        if (!sectionAtEdge(delta)) return;
        goTo(index + (delta > 0 ? 1 : -1));
      },
      { passive: true }
    );
  }

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || event.target.isContentEditable) {
      return;
    }
    if ((event.key === " " || event.key === "Enter") && ["BUTTON", "A"].includes(tag)) {
      return;
    }
    const down = ["ArrowDown", "PageDown", " "].includes(event.key);
    const up = ["ArrowUp", "PageUp"].includes(event.key);
    if (down) {
      event.preventDefault();
      goTo(index + 1);
    } else if (up) {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(sections.length - 1);
    }
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => goTo(Number(dot.dataset.index)));
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const targetIndex = sections.findIndex((section) => section.id === id);
      if (targetIndex < 0) return;
      event.preventDefault();
      goTo(targetIndex);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || locked) return;
        const next = sections.indexOf(entry.target);
        if (next >= 0) setActive(next);
      });
    },
    { root: reduced ? null : scroller, threshold: 0.55 }
  );

  sections.forEach((section) => observer.observe(section));

  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const cards = [...carousel.querySelectorAll(".carousel-card")];
  const pips = [...carousel.querySelectorAll(".carousel-progress i")];
  let slide = 0;
  let timer;

  const showSlide = (next) => {
    slide = (next + cards.length) % cards.length;
    cards.forEach((card, i) => card.classList.toggle("is-active", i === slide));
    pips.forEach((pip, i) => pip.classList.toggle("is-active", i === slide));
  };

  showSlide(0);

  const start = () => {
    if (reduced || cards.length < 2) return;
    stop();
    timer = window.setInterval(() => showSlide(slide + 1), 4000);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
  };

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);
  start();
})();
