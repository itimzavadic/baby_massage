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
  let ticking = false;
  let unlockTimer = 0;

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

  const sectionFromScroll = () => {
    const y = scroller.scrollTop + scroller.clientHeight * 0.45;
    let best = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= y) best = i;
    });
    return best;
  };

  const syncDots = () => {
    setActive(sectionFromScroll());
  };

  const unlock = () => {
    window.clearTimeout(unlockTimer);
    locked = false;
    syncDots();
  };

  const goTo = (next) => {
    next = clamp(next);
    if (next === index) {
      const top = sections[next].offsetTop;
      if (Math.abs(scroller.scrollTop - top) >= 8) scroller.scrollTop = top;
      return;
    }
    locked = true;
    setActive(next);
    window.clearTimeout(unlockTimer);

    sections[next].scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });

    const finish = () => {
      if (!locked) return;
      scroller.removeEventListener("scrollend", finish);
      unlock();
    };

    if (!reduced && "onscrollend" in window) {
      scroller.addEventListener("scrollend", finish, { once: true });
      unlockTimer = window.setTimeout(finish, 1400);
    } else {
      unlockTimer = window.setTimeout(finish, reduced ? 50 : lockMs);
    }
  };

  const canMove = (dir) => {
    const next = index + dir;
    return next >= 0 && next < sections.length;
  };

  const sectionAtEdge = (delta) => {
    const current = sections[index];
    if (current.scrollHeight <= current.clientHeight + 2) return true;
    const atTop = current.scrollTop <= 1;
    const atBottom =
      current.scrollTop + current.clientHeight >= current.scrollHeight - 2;
    return delta > 0 ? atBottom : atTop;
  };

  const clampScroll = () => {
    const max = sections[sections.length - 1].offsetTop;
    if (scroller.scrollTop > max) scroller.scrollTop = max;
    if (scroller.scrollTop < 0) scroller.scrollTop = 0;
  };

  scroller.addEventListener(
    "scroll",
    () => {
      clampScroll();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!locked) syncDots();
      });
    },
    { passive: true }
  );

  if (!reduced) {
    scroller.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) < 10) return;
        if (!sectionAtEdge(event.deltaY)) return;
        const dir = event.deltaY > 0 ? 1 : -1;
        event.preventDefault();
        if (locked || !canMove(dir)) return;
        goTo(index + dir);
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
      "touchmove",
      (event) => {
        const delta = touchStartY - event.touches[0].clientY;
        if (Math.abs(delta) < 10) return;
        if (!sectionAtEdge(delta)) return;
        event.preventDefault();
      },
      { passive: false }
    );

    scroller.addEventListener(
      "touchend",
      (event) => {
        const delta = touchStartY - event.changedTouches[0].clientY;
        if (Math.abs(delta) < 42 || locked) return;
        if (!sectionAtEdge(delta)) return;
        const dir = delta > 0 ? 1 : -1;
        if (!canMove(dir)) return;
        goTo(index + dir);
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

  syncDots();
})();
