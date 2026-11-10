import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { haze } from "./haze";
import { tiles } from "./kit";
import { every, later, listen, onScreen, reduced, teardown, wide } from "./life";
import { Scene, together, type Design } from "./scene";

gsap.registerPlugin(ScrollTrigger, SplitText);

const POSTER = 5.1;

export function start(): void {
  document.addEventListener("astro:page-load", init);
  document.addEventListener("astro:before-swap", teardown);
}

function init(): void {
  teardown();
  const root = document.querySelector<HTMLElement>("[data-home]");
  if (!root) return;
  const ctx = gsap.context(() => {
    backdrops(root);
    hero(root);
    how(root);
    again(root);
    compare(root);
    shapes(root);
    tiles(root);
    local(root);
    headings(root);
    mark(root);
  }, root);
  later(() => ctx.revert());
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

function scene(el: HTMLElement): Scene {
  const made = new Scene(el);
  later(() => made.kill());
  return made;
}

function backdrops(root: HTMLElement): void {
  root.querySelectorAll<HTMLCanvasElement>("[data-haze]").forEach((canvas, i) => haze(canvas, 3.1 + i * 7.3));
}

function stamp(time: number): string {
  const frames = Math.floor(time * 30);
  const pair = (value: number) => String(value).padStart(2, "0");
  return `${pair(Math.floor(frames / 1800))}:${pair(Math.floor(frames / 30) % 60)}:${pair(frames % 30)}`;
}

function hero(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>("[data-hero-scene]");
  const strip = root.querySelector<HTMLElement>("[data-strip]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-hero-toggle]");
  if (!stage || !strip || !toggle) return;
  const film = scene(stage);
  const lanes = strip.querySelector<HTMLElement>("[data-lanes]")!;
  const timecode = strip.querySelector<HTMLElement>("[data-timecode]")!;
  const playhead = strip.querySelector<HTMLElement>("[data-playhead]")!;
  const marksRoot = strip.querySelector<HTMLElement>("[data-marks]")!;
  const clips = new Map<string, HTMLElement>();

  lanes.style.setProperty("--len", String(film.length));
  for (const span of film.spans) {
    const clip = strip.querySelector<HTMLElement>(`[data-span="${span.id}"]`);
    if (!clip) continue;
    clip.style.setProperty("--a", String(span.from / film.length));
    clip.style.setProperty("--b", String((span.to - span.from) / film.length));
    clips.set(span.id, clip);
  }
  const take = film.spans.find((span) => span.id === "take")!;
  const actions = film.marks.filter((item) => item.id !== "title" && item.id !== "end");
  const dots = actions.map((item) => {
    const dot = document.createElement("i");
    dot.style.setProperty("--m", String((item.at - take.from) / (take.to - take.from)));
    marksRoot.append(dot);
    return dot;
  });

  let shown = "";
  let lit = -1;
  film.onTime = (time, length) => {
    playhead.style.setProperty("--p", String(time / length));
    timecode.textContent = stamp(time);
    const span = film.spans.findLast((item) => time >= item.from && time < item.to);
    if (span && span.id !== shown) {
      shown = span.id;
      clips.forEach((clip, id) => clip.classList.toggle("is-on", id === shown));
    }
    const passed = actions.findLastIndex((item) => time >= item.at);
    if (passed !== lit) {
      lit = passed;
      dots.forEach((dot, i) => dot.classList.toggle("is-on", i <= lit));
    }
  };

  let held = reduced();
  let visible = false;
  let scrubbing = false;
  const sync = () => {
    toggle.setAttribute("aria-pressed", String(held));
    toggle.setAttribute("aria-label", held ? "Play the film" : "Pause the film");
    if (held || !visible || scrubbing) film.pause();
    else film.play();
  };
  film.seek(held ? POSTER : 1.7);
  onScreen(stage, (seen) => {
    visible = seen;
    sync();
  });
  listen(toggle, "click", () => {
    held = !held;
    sync();
  });

  const seek = (event: PointerEvent) => {
    const box = lanes.getBoundingClientRect();
    film.seek(((event.clientX - box.left) / box.width) * film.length);
  };
  listen(strip, "pointerdown", (event) => {
    scrubbing = true;
    sync();
    seek(event);
    strip.setPointerCapture(event.pointerId);
  });
  listen(strip, "pointermove", (event) => {
    if (scrubbing) seek(event);
  });
  const release = () => {
    scrubbing = false;
    sync();
  };
  listen(strip, "pointerup", release);
  listen(strip, "pointercancel", release);
}

const LIGHTS: Record<string, string> = {
  goto: "goto",
  "click-new": "click",
  type: "type",
  enter: "keys",
  "click-share": "share",
  title: "title",
  end: "export",
};

function how(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>("[data-how]");
  if (!section) return;
  const pin = section.querySelector<HTMLElement>("[data-how-pin]")!;
  const editor = section.querySelector<HTMLElement>("[data-editor]")!;
  const items = [...section.querySelectorAll<HTMLElement>("[data-stage]")];
  const tag = section.querySelector<HTMLElement>("[data-how-tag]")!;
  const film = scene(section.querySelector<HTMLElement>("[data-how-scene]")!);
  const cards = [...editor.querySelectorAll<HTMLElement>("[data-node]")];
  const groups = [...editor.querySelectorAll<SVGGElement>("[data-wire]")];
  const board = editor.querySelector<HTMLElement>(".ox-board")!;
  const leads = ["open", "record", "clip", "sequence"];
  const names = ["", "Raw take", "Directed", "Finished film"];
  const modes = ["raw", "raw", "directed", "film"] as const;
  let current = -1;
  let visible = false;

  const build = gsap.timeline({ paused: true });
  for (let stage = 0; stage < 4; stage++) {
    const wires = groups.filter((group) => Number(group.dataset.wire) === stage);
    build.fromTo(
      cards.filter((card) => Number(card.dataset.at) === stage),
      { autoAlpha: 0, y: 12, scale: 0.9 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: "back.out(1.7)" },
      stage,
    );
    build.fromTo(
      wires.map((group) => group.querySelector(".ox-wire")),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.35, stagger: 0.07, ease: "power2.inOut" },
      stage + 0.18,
    );
    build.fromTo(
      wires.flatMap((group) => [...group.querySelectorAll(".ox-port")]),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2, stagger: 0.035 },
      stage + 0.18,
    );
  }
  build.set({}, {}, 4);
  const reach = (time: number, instant = false) => {
    if (instant || reduced()) {
      gsap.killTweensOf(build);
      build.time(time);
      return;
    }
    gsap.to(build, { time, duration: 0.55, ease: "power2.out", overwrite: true });
  };

  const pan = (id: string) => {
    const style = getComputedStyle(board);
    const zoom = Number(style.getPropertyValue("--zoom")) || 1;
    const width = Number(style.getPropertyValue("--bw"));
    const card = cards.find((item) => item.dataset.node === id);
    if (zoom <= 1 || !card) {
      board.style.setProperty("--pan", "0");
      return;
    }
    const view = width / zoom;
    const centre = card.offsetLeft + card.offsetWidth / 2;
    board.style.setProperty("--pan", String(Math.round(Math.min(0, Math.max(view - width, view / 2 - centre)))));
  };

  film.onMark = (id) => {
    if (current < 1) return;
    const target = LIGHTS[id];
    if (target) pan(target);
    cards.forEach((card) => {
      const on = card.dataset.node === target || (current === 1 && card.dataset.node === "record");
      card.classList.toggle("is-on", on);
    });
  };

  const set = (index: number) => {
    if (index === current) return;
    current = index;
    items.forEach((item, i) =>
      i === index ? item.setAttribute("aria-current", "step") : item.removeAttribute("aria-current"),
    );
    editor.dataset.at = String(index);
    tag.textContent = names[index];
    groups.forEach((group) => group.style.setProperty("--flow", index > 0 && Number(group.dataset.wire) <= index ? "0.7" : "0"));
    cards.forEach((card) => card.classList.remove("is-on"));
    pan(leads[index]);
    if (film.mode !== modes[index]) film.set({ mode: modes[index] });
    if (index === 0) {
      film.pause();
      film.seek(0);
    } else if (reduced()) {
      film.seek(POSTER);
    } else if (visible) {
      film.play(0);
    }
  };

  onScreen(
    section,
    (seen) => {
      visible = seen;
      if (!seen) film.pause();
      else if (current > 0 && !reduced()) film.play();
    },
    "0px",
    0.1,
  );

  if (wide() && !reduced()) {
    build.time(0);
    set(0);
    ScrollTrigger.create({
      trigger: section,
      start: "top 72%",
      once: true,
      onEnter: () => {
        if (build.time() < 0.95) reach(0.95);
      },
    });
    const trigger = ScrollTrigger.create({
      trigger: section,
      pin,
      start: "top top",
      end: () => `+=${window.innerHeight * 3.2}`,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const at = Math.min(3.999, self.progress * 4);
        const index = Math.floor(at);
        const local = Math.min(1, (at - index) / 0.4);
        reach(index === 0 ? 0.95 : index + local * 0.95);
        set(index);
      },
    });
    items.forEach((item, i) =>
      listen(item, "click", () => {
        const top = trigger.start + ((i + 0.5) / 4) * (trigger.end - trigger.start);
        window.scrollTo({ top, behavior: "smooth" });
      }),
    );
    return;
  }

  let touched = false;
  const go = (index: number) => {
    reach(index + 0.95, current === -1);
    set(index);
  };
  go(0);
  items.forEach((item, i) =>
    listen(item, "click", () => {
      touched = true;
      go(i);
    }),
  );
  every(7000, () => {
    if (visible && !touched && !reduced()) go((current + 1) % 4);
  });
}

function again(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>("[data-again]");
  if (!section) return;
  const screen = section.querySelector<HTMLElement>("[data-again-screen]")!;
  const film = scene(section.querySelector<HTMLElement>("[data-again-scene]")!);
  const picks = [...section.querySelectorAll<HTMLButtonElement>("[data-again-pick]")];
  const run = section.querySelector<HTMLButtonElement>("[data-run]")!;
  const label = section.querySelector<HTMLElement>("[data-run-label]")!;
  const log = section.querySelector<HTMLElement>("[data-run-log]")!;
  const bar = section.querySelector<HTMLElement>("[data-run-bar]")!;
  const steps = [...section.querySelectorAll<HTMLElement>("[data-run-steps] li")];
  const names: Record<Design, string> = { a: "last month's design", b: "today's design" };
  const other = (design: Design): Design => (design === "a" ? "b" : "a");
  let version: Design = "a";
  let visible = false;
  let running = false;

  const settle = (design: Design) => {
    version = design;
    picks.forEach((pick) => pick.setAttribute("aria-checked", String(pick.dataset.againPick === design)));
    label.textContent = `Run on ${names[other(design)]}`;
  };
  const show = () => {
    if (reduced()) film.seek(POSTER);
    else if (visible) film.play(0);
  };
  const mark = (index: number, state: string) => steps[index]?.setAttribute("data-state", state);

  onScreen(screen, (seen) => {
    visible = seen;
    if (seen && !reduced()) film.play();
    else film.pause();
  });
  if (reduced()) film.seek(POSTER);

  picks.forEach((pick) =>
    listen(pick, "click", () => {
      const design = pick.dataset.againPick as Design;
      if (design === version || running) return;
      steps.forEach((step) => step.removeAttribute("data-state"));
      film.set({ design, mode: "directed" });
      settle(design);
      log.textContent = `Recorded on ${names[design]}.`;
      show();
    }),
  );

  listen(run, "click", () => {
    if (running) return;
    const target = other(version);
    const quick = reduced();
    const speed = 2.6;
    running = true;
    run.disabled = true;
    steps.forEach((step) => step.removeAttribute("data-state"));
    screen.classList.add("is-running", "is-swapping");
    log.textContent = `Recording the same actions on ${names[target]}.`;
    mark(0, "doing");

    const tl = gsap.timeline({
      onComplete: () => {
        running = false;
        run.disabled = false;
        screen.classList.remove("is-running", "is-recording", "is-swapping");
        gsap.set(bar, { scaleX: 0 });
        settle(target);
        log.textContent = `Done. Same project, ${names[target]}.`;
      },
    });
    later(() => tl.kill());
    tl.call(
      () => {
        film.set({ design: target, mode: "raw" });
        screen.classList.remove("is-swapping");
        screen.classList.add("is-recording");
        if (quick) film.seek(POSTER);
        else {
          film.tl.timeScale(speed);
          film.play(0);
        }
      },
      [],
      quick ? 0.01 : 0.4,
    );
    const recorded = quick ? 0.05 : 0.4 + film.length / speed;
    tl.call(
      () => {
        mark(0, "done");
        mark(1, "doing");
        log.textContent = "Moving the camera in on each action.";
        screen.classList.remove("is-recording");
        film.set({ mode: "directed" });
        show();
      },
      [],
      recorded,
    );
    tl.call(
      () => {
        mark(1, "done");
        mark(2, "doing");
        log.textContent = "Building the film.";
      },
      [],
      recorded + (quick ? 0.02 : 1.1),
    );
    tl.call(() => mark(2, "done"), [], recorded + (quick ? 0.04 : 2));
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: recorded + (quick ? 0.04 : 2), ease: "none" }, 0);
  });
}

function compare(root: HTMLElement): void {
  const frame = root.querySelector<HTMLElement>("[data-compare-frame]");
  if (!frame) return;
  const range = frame.querySelector<HTMLInputElement>("[data-compare-range]")!;
  const films = [...frame.querySelectorAll<HTMLElement>("[data-compare-scene]")].map(scene);
  const pair = together(films);
  const split = (value: number) => frame.style.setProperty("--split", `${value}%`);
  let touched = false;
  let hinted = false;

  listen(range, "input", () => {
    touched = true;
    split(Number(range.value));
  });
  if (reduced()) films.forEach((film) => film.seek(POSTER));

  onScreen(
    frame,
    (visible) => {
      if (!visible || reduced()) {
        pair.pause();
        return;
      }
      pair.play();
      if (hinted) return;
      hinted = true;
      const state = { v: 50 };
      gsap
        .timeline({ delay: 0.6 })
        .to(state, { v: 26, duration: 1.1, ease: "power2.inOut" })
        .to(state, { v: 74, duration: 1.6, ease: "power2.inOut" })
        .to(state, { v: 50, duration: 1.1, ease: "power2.inOut" })
        .eventCallback("onUpdate", () => {
          if (touched) return;
          split(state.v);
          range.value = String(Math.round(state.v));
        });
    },
    "0px",
    0.35,
  );
}

function shapes(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>("[data-shapes]");
  if (!section) return;
  const row = section.querySelector<HTMLElement>(".ox-shapes-row")!;
  const films = [...section.querySelectorAll<HTMLElement>("[data-shape-scene]")].map(scene);
  const set = together(films);
  if (reduced()) {
    films.forEach((film) => film.seek(POSTER));
    return;
  }
  onScreen(row, (visible) => (visible ? set.play() : set.pause()), "0px", 0.15);
}

function local(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>("[data-api]");
  if (!panel) return;
  const calls = [...panel.querySelectorAll<HTMLElement>("[data-call]")];
  const notes = calls.map((call) => call.querySelector("em"));
  const cards = [...panel.querySelectorAll<HTMLElement>("[data-node]")];
  const card = (id: string) => cards.find((item) => item.dataset.node === id)!;
  const wire = panel.querySelector(`[data-api-wire="title"]`)!;
  const light = (id?: string) => cards.forEach((item) => item.classList.toggle("is-on", item.dataset.node === id));
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6, defaults: { ease: "power3.out" } });
  later(() => tl.kill());

  tl.call(light, [], 0);
  tl.set(calls, { opacity: 0.32 }, 0);
  tl.set(notes, { autoAlpha: 0, x: -8 }, 0);
  tl.set(card("title"), { autoAlpha: 0, y: 12, scale: 0.9 }, 0);
  tl.set(wire.querySelector(".ox-wire"), { strokeDashoffset: 1 }, 0);
  tl.set(wire.querySelectorAll(".ox-port"), { autoAlpha: 0 }, 0);
  calls.forEach((call, i) => {
    const at = 0.5 + i * 1.05;
    tl.to(call, { opacity: 1, duration: 0.3 }, at);
    tl.to(notes[i], { autoAlpha: 1, x: 0, duration: 0.45 }, at + 0.15);
  });
  tl.to(card("title"), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 1.7);
  tl.to(wire.querySelector(".ox-wire"), { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 2.75);
  tl.to(wire.querySelectorAll(".ox-port"), { autoAlpha: 1, duration: 0.2 }, 2.75);
  ["clip", "title", "sequence", "export"].forEach((id, i) => tl.call(light, [id], 3.9 + i * 0.7));
  tl.call(light, [], 6.9);
  tl.set({}, {}, 7.6);

  if (reduced()) {
    tl.pause(3.3);
    return;
  }
  onScreen(panel, (visible) => (visible ? tl.play() : tl.pause()), "0px", 0.3);
}

function headings(root: HTMLElement): void {
  if (reduced()) return;
  for (const heading of root.querySelectorAll<HTMLElement>("[data-split]")) {
    SplitText.create(heading, {
      type: "lines",
      mask: "lines",
      linesClass: "ox-split-line",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 112,
          duration: 1.05,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        }),
    });
  }
}

function mark(root: HTMLElement): void {
  const wire = root.querySelector<SVGPathElement>("[data-mark-wire]");
  if (!wire || reduced()) return;
  const nodes = root.querySelectorAll<SVGCircleElement>("[data-mark-node]");
  gsap
    .timeline({ scrollTrigger: { trigger: wire, start: "top 85%", once: true } })
    .fromTo(wire, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power3.inOut" })
    .from(nodes, { scale: 0.4, opacity: 0, transformOrigin: "50% 50%", duration: 0.7, stagger: 0.12, ease: "back.out(2.2)" }, 0.5);
}
