import { gsap } from "gsap";
import { later, onScreen, reduced } from "./life";
import { Scene } from "./scene";

interface Player {
  play: () => void;
  pause: () => void;
  still: () => void;
}

const from = (tl: gsap.core.Timeline, poster: number): Player => ({
  play: () => tl.play(),
  pause: () => tl.pause(),
  still: () => tl.pause(poster),
});

function device(tile: HTMLElement): Player {
  const scene = new Scene(tile.querySelector<HTMLElement>("[data-tile-scene]")!);
  const laptop = tile.querySelector("[data-laptop]");
  const lid = tile.querySelector("[data-lid]");
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 });
  tl.fromTo(
    laptop,
    { rotationY: -40, rotationX: 26, scale: 0.78, autoAlpha: 0 },
    { rotationY: 0, rotationX: 8, scale: 1.1, autoAlpha: 1, duration: 2.6, ease: "power3.inOut" },
    0,
  );
  tl.fromTo(lid, { rotationX: -86 }, { rotationX: 0, duration: 1.7, ease: "power3.out" }, 0.35);
  tl.call(() => scene.play(0), [], 0.9);
  tl.to(laptop, { rotationY: 7, rotationX: 6, duration: 6.2, ease: "sine.inOut" }, 2.6);
  tl.to(laptop, { rotationY: 38, rotationX: 24, scale: 0.8, autoAlpha: 0, duration: 1.3, ease: "power3.in" }, 8.8);
  tl.to(lid, { rotationX: -70, duration: 1.3, ease: "power3.in" }, 8.8);
  later(() => {
    tl.kill();
    scene.kill();
  });
  return {
    play: () => {
      tl.play();
      if (tl.time() > 0.9) scene.play();
    },
    pause: () => {
      tl.pause();
      scene.pause();
    },
    still: () => {
      tl.pause(4);
      scene.seek(5.2);
    },
  };
}

function captions(tile: HTMLElement): Player {
  const scene = new Scene(tile.querySelector<HTMLElement>("[data-tile-scene]")!);
  const lines = [...tile.querySelectorAll<HTMLElement>("[data-caption]")];
  const words = lines.flatMap((line) => [...line.children] as HTMLElement[]);
  let speaking: gsap.core.Timeline | null = null;

  const say = (id: string) => {
    const line = lines.find((item) => item.dataset.caption === id);
    if (!line && id !== "goto") return;
    speaking?.kill();
    gsap.set(words, { opacity: 0, y: 10 });
    words.forEach((word) => word.classList.remove("is-now"));
    if (!line) return;
    const spoken = [...line.children] as HTMLElement[];
    speaking = gsap.timeline();
    spoken.forEach((word, i) => {
      speaking!.to(word, { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" }, i * 0.27);
      speaking!.call(
        () => {
          spoken.forEach((other) => other.classList.toggle("is-now", other === word));
        },
        [],
        i * 0.27,
      );
    });
  };
  scene.onMark = say;
  later(() => {
    speaking?.kill();
    scene.kill();
  });
  return {
    play: () => {
      scene.play();
      speaking?.play();
    },
    pause: () => {
      scene.pause();
      speaking?.pause();
    },
    still: () => {
      scene.seek(3.4);
      const spoken = [...lines[1].children] as HTMLElement[];
      gsap.set(spoken, { opacity: 1 });
      spoken[spoken.length - 1].classList.add("is-now");
    },
  };
}

function type(tile: HTMLElement): Player {
  const lines = [...tile.querySelectorAll<HTMLElement>("[data-line]")];
  const chip = tile.querySelector<HTMLElement>("[data-line-name]")!;
  const names = (tile.querySelector<HTMLTemplateElement>("[data-line-names]")?.innerHTML ?? "").split("|");
  const tl = gsap.timeline({ paused: true, repeat: -1 });
  const slot = 2.5;
  tl.set(lines, { autoAlpha: 0 }, 0);
  lines.forEach((line, i) => {
    const at = i * slot;
    const text = line.firstElementChild!;
    tl.set(line, { autoAlpha: 1 }, at);
    tl.call(() => void (chip.textContent = names[i] ?? ""), [], at);
    if (line.dataset.line === "mask") {
      tl.fromTo(text, { yPercent: 115 }, { yPercent: 0, duration: 0.95, ease: "expo.out" }, at);
    } else if (line.dataset.line === "blur") {
      tl.fromTo(
        text,
        { opacity: 0, filter: "blur(16px)", scale: 1.08 },
        { opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.2, ease: "power2.out" },
        at,
      );
    } else if (line.dataset.line === "track") {
      tl.fromTo(
        text,
        { opacity: 0, letterSpacing: "0.42em" },
        { opacity: 1, letterSpacing: "-0.045em", duration: 1.25, ease: "expo.out" },
        at,
      );
    } else {
      tl.fromTo(
        text,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: `steps(${text.textContent?.length ?? 12})` },
        at,
      );
    }
    tl.to(line, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, at + slot - 0.35);
  });
  later(() => tl.kill());
  return from(tl, 1.4);
}

function cuts(tile: HTMLElement): Player {
  const cards = [...tile.querySelectorAll<HTMLElement>("[data-cut]")];
  const [one, two, three, four] = cards;
  const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power3.inOut" } });
  tl.set([two, three, four], { autoAlpha: 0 }, 0);
  tl.set(two, { autoAlpha: 1, zIndex: 2 }, 1.1);
  tl.fromTo(two, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75 }, 1.1);
  tl.set(three, { autoAlpha: 1, zIndex: 3 }, 2.9);
  tl.fromTo(three, { yPercent: 100 }, { yPercent: 0, duration: 0.75 }, 2.9);
  tl.fromTo(two, { yPercent: 0 }, { yPercent: -100, duration: 0.75 }, 2.9);
  tl.set(four, { autoAlpha: 1, zIndex: 4 }, 4.7);
  tl.fromTo(four, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.85 }, 4.7);
  tl.set(one, { zIndex: 5 }, 6.5);
  tl.fromTo(one, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.8, immediateRender: false }, 6.5);
  tl.to(four, { scale: 0.86, duration: 0.8 }, 6.5);
  tl.set({}, {}, 7.6);
  later(() => tl.kill());
  return from(tl, 2);
}

function terminal(tile: HTMLElement): Player {
  const typed = tile.querySelector<HTMLElement>("[data-term-typed]")!;
  const caret = tile.querySelector<HTMLElement>("[data-term-caret]")!;
  const outs = [...tile.querySelectorAll<HTMLElement>("[data-term-out]")];
  const command = "./deploy --preview";
  const state = { n: 0 };
  let theme = 0;
  const tl = gsap.timeline({
    paused: true,
    repeat: -1,
    onRepeat: () => {
      theme = (theme + 1) % 3;
      tile.dataset.theme = String(theme);
    },
  });
  tl.set(outs, { autoAlpha: 0 }, 0);
  tl.set(state, { n: 0 }, 0);
  tl.call(() => void (typed.textContent = ""), [], 0);
  tl.to(
    state,
    {
      n: command.length,
      duration: 1.2,
      ease: "none",
      onUpdate: () => void (typed.textContent = command.slice(0, Math.round(state.n))),
    },
    0.5,
  );
  tl.set(caret, { display: "none" }, 1.9);
  tl.to(outs, { autoAlpha: 1, duration: 0.01, stagger: 0.75 }, 2.1);
  tl.fromTo(
    tile.querySelector(".kt-term-window"),
    { scale: 0.94 },
    { scale: 1.05, duration: 6, ease: "none" },
    0,
  );
  tl.set({}, {}, 6);
  later(() => tl.kill());
  return from(tl, 4.5);
}

function chart(tile: HTMLElement): Player {
  const bars = tile.querySelectorAll("[data-bar]");
  const num = tile.querySelector<HTMLElement>("[data-chart-num]")!;
  const state = { n: 0 };
  const tl = gsap.timeline({ paused: true, repeat: -1 });
  tl.set(state, { n: 0 }, 0);
  tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 1, stagger: 0.08, ease: "expo.out" }, 0.2);
  tl.to(
    state,
    { n: 48, duration: 1.7, ease: "power2.out", onUpdate: () => void (num.textContent = String(Math.round(state.n))) },
    0.2,
  );
  tl.to(bars, { scaleY: 0, duration: 0.5, stagger: 0.03, ease: "power3.in" }, 4.6);
  tl.set({}, {}, 5.4);
  later(() => tl.kill());
  return from(tl, 3);
}

function keys(tile: HTMLElement): Player {
  const combos = [...tile.querySelectorAll<HTMLElement>("[data-combo]")];
  const tl = gsap.timeline({ paused: true, repeat: -1 });
  const slot = 1.7;
  tl.set(combos, { autoAlpha: 0 }, 0);
  combos.forEach((combo, i) => {
    const at = i * slot;
    const caps = combo.children;
    tl.set(combo, { autoAlpha: 1, y: 0 }, at);
    tl.fromTo(
      caps,
      { opacity: 0, y: 18, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.32, stagger: 0.11, ease: "back.out(2.2)" },
      at,
    );
    tl.to(caps, { y: 5, duration: 0.08, ease: "power2.out" }, at + 0.7);
    tl.to(caps, { y: 0, duration: 0.3, ease: "back.out(3)" }, at + 0.8);
    tl.to(combo, { autoAlpha: 0, y: -10, duration: 0.25, ease: "power2.in" }, at + slot - 0.3);
  });
  later(() => tl.kill());
  return from(tl, 0.9);
}

const makers: Record<string, (tile: HTMLElement) => Player> = { device, captions, type, cuts, terminal, chart, keys };

export function tiles(root: HTMLElement): void {
  for (const tile of root.querySelectorAll<HTMLElement>("[data-tile]")) {
    const make = makers[tile.dataset.tile ?? ""];
    if (!make) continue;
    const player = make(tile);
    if (reduced()) {
      player.still();
      continue;
    }
    onScreen(tile, (visible) => (visible ? player.play() : player.pause()), "0px", 0.2);
  }
}
