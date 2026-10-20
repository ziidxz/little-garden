(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- soft reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- pick a flower ---------- */
  const flowers = Array.from(document.querySelectorAll(".flower"));
  const flowerNote = document.getElementById("flower-note");
  const flowerNoteText = flowerNote ? flowerNote.querySelector("p") : null;
  const petalColours = ["#c7d6b5", "#9db38c", "#d4a09a", "#f8f4e7", "#dfe7c8"];

  const sendPetals = (flower) => {
    if (reduceMotion) return;

    const rect = flower.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.34;

    for (let i = 0; i < 7; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.setAttribute("aria-hidden", "true");
      petal.style.setProperty("--x", `${originX + (Math.random() * 34 - 17)}px`);
      petal.style.setProperty("--y", `${originY + (Math.random() * 20 - 10)}px`);
      petal.style.setProperty("--dx", `${Math.random() * 92 - 46}px`);
      petal.style.setProperty("--dy", `${-38 - Math.random() * 78}px`);
      petal.style.setProperty("--rot", `${Math.random() * 220 - 110}deg`);
      petal.style.setProperty("--c", petalColours[i % petalColours.length]);
      document.body.appendChild(petal);
      window.setTimeout(() => petal.remove(), 1000);
    }
  };

  flowers.forEach((flower) => {
    flower.addEventListener("click", () => {
      flowers.forEach((other) => {
        other.classList.remove("is-picked");
        other.setAttribute("aria-pressed", "false");
      });

      flower.classList.add("is-picked");
      flower.setAttribute("aria-pressed", "true");

      const note = flower.dataset.note;
      if (note && flowerNoteText && flowerNote) {
        flowerNoteText.textContent = note;
        if (!reduceMotion) {
          flowerNote.animate(
            [
              { opacity: 0.35, translate: "0 5px" },
              { opacity: 1, translate: "0 0" }
            ],
            { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
          );
        }
      }

      sendPetals(flower);
    });
  });

  /* ---------- tiny secret ---------- */
  const dialog = document.getElementById("secret-dialog");
  const secretTrigger = document.getElementById("secret-trigger");
  const dialogClose = document.getElementById("dialog-close");

  const openSecret = () => {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  };

  const closeSecret = () => {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  };

  if (secretTrigger) secretTrigger.addEventListener("click", openSecret);
  if (dialogClose) dialogClose.addEventListener("click", closeSecret);

  if (dialog) {
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) closeSecret();
    });
  }

  /* ---------- looping garden sound ---------- */
  const audio = document.getElementById("bg-music");
  const soundToggle = document.getElementById("sound-toggle");

  if (audio && soundToggle) {
    const soundLabel = soundToggle.querySelector(".sound-label");
    let fadeFrame = null;
    let pauseTimer = null;

    audio.volume = 0;

    const fadeTo = (target, duration = 900, done) => {
      if (fadeFrame) window.cancelAnimationFrame(fadeFrame);

      const start = audio.volume;
      const started = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        audio.volume = Math.min(1, Math.max(0, start + (target - start) * eased));

        if (progress < 1) {
          fadeFrame = window.requestAnimationFrame(step);
        } else if (typeof done === "function") {
          done();
        }
      };

      fadeFrame = window.requestAnimationFrame(step);
    };

    const setPlaying = (playing) => {
      soundToggle.setAttribute("aria-pressed", playing ? "true" : "false");
      soundToggle.setAttribute(
        "aria-label",
        playing ? "Pause the little garden loop" : "Play the little garden loop"
      );
      if (soundLabel) soundLabel.textContent = playing ? "sound on" : "sound off";
    };

    soundToggle.addEventListener("click", () => {
      if (pauseTimer) {
        window.clearTimeout(pauseTimer);
        pauseTimer = null;
      }

      if (audio.paused) {
        soundToggle.classList.add("is-loading");
        if (soundLabel) soundLabel.textContent = "one sec";

        const started = audio.play();

        if (started && typeof started.catch === "function") {
          started.catch(() => {
            soundToggle.classList.remove("is-loading");
            setPlaying(false);
          });
        }
      } else {
        setPlaying(false);
        fadeTo(0, 520, () => {
          pauseTimer = window.setTimeout(() => {
            audio.pause();
            pauseTimer = null;
          }, 40);
        });
      }
    });

    audio.addEventListener("playing", () => {
      soundToggle.classList.remove("is-loading");
      setPlaying(true);
      fadeTo(0.45, 1000);
    });

    audio.addEventListener("pause", () => {
      soundToggle.classList.remove("is-loading");
      setPlaying(false);
    });

    audio.addEventListener("error", () => {
      soundToggle.classList.remove("is-loading");
      if (soundLabel) soundLabel.textContent = "no sound";
      soundToggle.setAttribute("aria-pressed", "false");
    });
  }
})();
