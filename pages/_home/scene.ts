import { gsap } from "gsap";

export type Mode = "raw" | "directed" | "film";
export type Design = "a" | "b";

export interface Mark {
  id: string;
  label: string;
  at: number;
}

export interface Span {
  id: string;
  from: number;
  to: number;
}

interface View {
  x: number;
  y: number;
  scale: number;
}

const WINDOW_WIDTH = 1280;
const ZOOM: Record<string, number> = { "16:9": 1.34, "9:16": 1.5, "1:1": 1.26, "4:5": 1.4 };
const TYPED = "Launch day";

export class Scene {
  readonly root: HTMLElement;
  tl: gsap.core.Timeline = gsap.timeline({ paused: true });
  marks: Mark[] = [];
  spans: Span[] = [];
  length = 0;
  onMark?: (id: string) => void;
  onTime?: (time: number, length: number) => void;

  private readonly cam: HTMLElement;
  private readonly win: HTMLElement;
  private readonly animated: Element[];
  private readonly loop: boolean;

  constructor(root: HTMLElement, options: { loop?: boolean } = {}) {
    this.root = root;
    this.loop = options.loop ?? true;
    this.cam = this.one("[data-cam]");
    this.win = this.one("[data-window]");
    this.animated = [
      this.cam,
      ...root.querySelectorAll(
        "[data-cursor], [data-ripple], [data-key], [data-title], [data-title-eyebrow], [data-title-line], [data-title-edge], [data-end], [data-end-line], [data-end-address], [data-rows], [data-row], [data-fresh], [data-part], [data-late], [data-caret], [data-count-a], [data-count-b], [data-share-a], [data-share-b], [data-toast], [data-t]",
      ),
    ];
    this.build();
  }

  get mode(): Mode {
    return (this.root.dataset.mode as Mode) ?? "film";
  }

  get design(): Design {
    return (this.root.dataset.design as Design) ?? "a";
  }

  set(next: { mode?: Mode; design?: Design }): void {
    if (next.mode) this.root.dataset.mode = next.mode;
    if (next.design) this.root.dataset.design = next.design;
    this.build();
  }

  play(from?: number): void {
    if (from !== undefined) this.tl.time(from);
    this.tl.play();
  }

  pause(): void {
    this.tl.pause();
  }

  seek(time: number): void {
    this.tl.time(Math.max(0, Math.min(this.length - 0.001, time)));
  }

  kill(): void {
    this.tl.kill();
    gsap.set(this.animated, { clearProps: "all" });
  }

  private one<T extends HTMLElement = HTMLElement>(selector: string): T {
    return this.root.querySelector<T>(selector)!;
  }

  private all(selector: string): HTMLElement[] {
    return [...this.root.querySelectorAll<HTMLElement>(selector)];
  }

  private centre(el: HTMLElement): { x: number; y: number } {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    let node: HTMLElement | null = el;
    while (node && node !== this.win) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
  }

  private build(): void {
    const playing = !this.tl.paused();
    this.tl.kill();
    gsap.set(this.animated, { clearProps: "all" });

    const { mode, design } = this;
    const raw = mode === "raw";
    const film = mode === "film";
    const W = Number(this.root.dataset.w);
    const H = Number(this.root.dataset.h);
    const winH = this.win.offsetHeight;
    const zoom = ZOOM[this.root.dataset.shape ?? "16:9"] ?? 1.3;

    const cursor = this.one("[data-cursor]");
    const ripple = this.one("[data-ripple]");
    const key = this.one("[data-key]");
    const rows = this.one("[data-rows]");
    const row = this.all("[data-row]");
    const fresh = this.one("[data-fresh]");
    const parts = this.all("[data-part]");
    const late = this.all("[data-late]");
    const caret = this.one("[data-caret]");
    const typed = this.one("[data-typed]");
    const field = this.one('[data-t="name"]');
    const create = this.one('[data-t="new"]');
    const share = this.one('[data-t="share"]');
    const toast = this.one("[data-toast]");

    const fit = raw ? W / WINDOW_WIDTH : Math.min((W * 0.86) / WINDOW_WIDTH, (H * 0.84) / winH);
    const home: View = { scale: fit, x: (W - WINDOW_WIDTH * fit) / 2, y: (H - winH * fit) / 2 };
    const pad = 34;
    const clamp = (value: number, size: number, stage: number) => {
      if (size <= stage) return (stage - size) / 2;
      return Math.min(pad, Math.max(stage - size - pad, value));
    };
    const focus = (el: HTMLElement, nudge = 0): View => {
      const point = this.centre(el);
      return {
        scale: zoom,
        x: clamp(W / 2 - (point.x + nudge) * zoom, WINDOW_WIDTH * zoom, W),
        y: clamp(H / 2 - point.y * zoom, winH * zoom, H),
      };
    };

    const tl = gsap.timeline({
      paused: true,
      repeat: this.loop ? -1 : 0,
      defaults: { ease: "power3.out" },
      onUpdate: () => this.onTime?.(tl.time(), this.length),
    });
    const marks: Mark[] = [];
    const spans: Span[] = [];
    const mark = (id: string, label: string, at: number) => {
      marks.push({ id, label, at });
      tl.call(() => this.onMark?.(id), [], at);
    };

    const start = { x: WINDOW_WIDTH * 0.52, y: winH * 0.78 };
    typed.textContent = "";
    tl.set(this.cam, { x: home.x, y: home.y, scale: home.scale }, 0);
    tl.set(cursor, { x: start.x, y: start.y, scale: 1 }, 0);
    tl.set([...parts, ...late], { autoAlpha: 0 }, 0);
    tl.set(this.one("[data-share-b]"), { autoAlpha: 0 }, 0);
    tl.set(this.one("[data-count-b]"), { yPercent: 100 }, 0);
    tl.set(toast, { autoAlpha: 0, y: 14, scale: 0.94 }, 0);
    tl.set(ripple, { opacity: 0 }, 0);
    tl.set(fresh, { "--fresh": 0 }, 0);
    tl.set(field, { "--ring": 0.55 }, 0);
    if (design === "a") tl.set(rows, { y: -fresh.offsetHeight }, 0);

    const move = (el: HTMLElement, at: number, duration: number, nudge = 0) => {
      const point = this.centre(el);
      const x = point.x + nudge;
      const y = point.y + 4;
      if (raw) {
        tl.to(cursor, { x, y, duration: duration * 0.8, ease: "none" }, at + duration * 0.2);
        return;
      }
      tl.to(cursor, { x, duration, ease: "power3.inOut" }, at);
      tl.to(cursor, { y, duration, ease: "power2.inOut" }, at);
    };
    const look = (view: View, at: number, duration: number) => {
      if (raw) return;
      tl.to(this.cam, { ...view, duration, ease: "power3.inOut" }, at);
    };
    const click = (el: HTMLElement, at: number, nudge = 0) => {
      tl.to(cursor, { scale: 0.82, duration: 0.09, ease: "power2.out" }, at);
      tl.to(cursor, { scale: 1, duration: 0.3, ease: "back.out(2.4)" }, at + 0.1);
      tl.to(el, { scale: 0.96, duration: 0.09, ease: "power2.out" }, at);
      tl.to(el, { scale: 1, duration: 0.35, ease: "back.out(2)" }, at + 0.1);
      if (raw) return;
      const point = this.centre(el);
      tl.fromTo(
        ripple,
        { x: point.x + nudge, y: point.y + 4, scale: 0.25, opacity: 0.85 },
        { scale: 2.1, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false },
        at + 0.02,
      );
    };

    let t = 0;

    if (film) {
      const title = this.one("[data-title]");
      const edge = this.one("[data-title-edge]");
      mark("title", "Title card", 0);
      tl.fromTo(this.one("[data-title-eyebrow]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1);
      tl.fromTo(
        this.all("[data-title-line]"),
        { yPercent: 112 },
        { yPercent: 0, duration: 0.95, stagger: 0.1, ease: "expo.out" },
        0.18,
      );
      tl.fromTo(
        title,
        { clipPath: "inset(0% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 100%)", duration: 0.85, ease: "power3.inOut" },
        1.75,
      );
      tl.fromTo(edge, { x: 0, opacity: 1 }, { x: W, duration: 0.85, ease: "power3.inOut" }, 1.75);
      spans.push({ id: "title", from: 0, to: 2.2 });
      t = 1.95;
    }

    const takeFrom = t;
    mark("goto", "Go to page", t);
    tl.fromTo(row, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.045 }, t);
    t += 0.75;

    mark("click-new", "Click", t);
    move(create, t, 0.95);
    look(focus(create, -80), t + 0.05, 1.05);
    t += 1;
    click(create, t);
    if (design === "a") tl.to(rows, { y: 0, duration: 0.55, ease: "power3.out" }, t + 0.12);
    tl.to(fresh, { "--fresh": 1, duration: 0.4 }, t + 0.12);
    tl.to(parts, { autoAlpha: 1, duration: 0.35, stagger: 0.05 }, t + 0.25);
    t += 0.65;

    mark("type", "Type text", t);
    move(field, t, 0.6, -40);
    look(focus(field, 60), t, 0.85);
    t += 0.7;
    const state = { n: 0 };
    tl.set(state, { n: 0 }, 0);
    tl.to(
      state,
      {
        n: TYPED.length,
        duration: 1.15,
        ease: "none",
        onUpdate: () => {
          typed.textContent = TYPED.slice(0, Math.round(state.n));
        },
      },
      t,
    );
    t += 1.3;

    mark("enter", "Press keys", t);
    if (!raw) {
      tl.fromTo(key, { opacity: 0, y: 18, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, t - 0.05);
      tl.to(key, { y: 4, scale: 0.96, duration: 0.08, ease: "power2.out" }, t + 0.3);
      tl.to(key, { y: 0, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, t + 0.4);
      tl.to(key, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, t + 1.05);
    }
    tl.set(caret, { display: "none" }, t + 0.35);
    tl.to(field, { "--ring": 0, duration: 0.3 }, t + 0.35);
    tl.to(late, { autoAlpha: 1, duration: 0.4, stagger: 0.07 }, t + 0.4);
    tl.to(this.one("[data-count-a]"), { yPercent: -100, duration: 0.5, ease: "power3.inOut" }, t + 0.4);
    tl.to(this.one("[data-count-b]"), { yPercent: 0, duration: 0.5, ease: "power3.inOut" }, t + 0.4);
    t += 0.9;

    mark("click-share", "Click", t);
    move(share, t, 0.85);
    look(focus(share, design === "a" ? -60 : 0), t, 0.95);
    t += 0.9;
    click(share, t);
    tl.to(this.one("[data-share-a]"), { autoAlpha: 0, duration: 0.2 }, t + 0.1);
    tl.to(this.one("[data-share-b]"), { autoAlpha: 1, duration: 0.25 }, t + 0.18);
    tl.to(toast, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, t + 0.22);
    t += 1.45;

    look(home, t, 0.95);
    tl.to(toast, { autoAlpha: 0, y: -8, duration: 0.3, ease: "power2.in" }, t + 0.35);
    t += 1.05;
    spans.push({ id: "take", from: takeFrom, to: film ? t + 0.45 : t + 0.5 });

    if (film) {
      const end = this.one("[data-end]");
      mark("end", "Title card", t);
      tl.fromTo(
        end,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power3.inOut" },
        t,
      );
      tl.fromTo(
        this.all("[data-end-line]"),
        { yPercent: 112 },
        { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "expo.out" },
        t + 0.35,
      );
      tl.fromTo(
        this.one("[data-end-address]"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        t + 0.7,
      );
      spans.push({ id: "end", from: t, to: t + 2.7 });
      t += 2.7;
    } else {
      t += 0.5;
    }

    tl.set({}, {}, t);
    this.tl = tl;
    this.marks = marks;
    this.spans = spans;
    this.length = t;
    tl.progress(0.0001);
    if (playing) tl.play();
  }
}

export function together(scenes: Scene[]): { play: () => void; pause: () => void } {
  const [lead, ...rest] = scenes;
  return {
    play: () => {
      const at = lead.tl.time();
      for (const scene of rest) scene.tl.time(at);
      for (const scene of scenes) scene.tl.play();
    },
    pause: () => {
      for (const scene of scenes) scene.tl.pause();
    },
  };
}
