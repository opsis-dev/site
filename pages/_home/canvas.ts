import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rounded, type Point } from "./graph";
import { later, reduced } from "./life";
import { ports } from "./ports";

const SVG = "http://www.w3.org/2000/svg";

const color = (kind: string | undefined) => (ports as Record<string, { color: string }>)[kind ?? "file"]?.color ?? ports.file.color;

export function canvas(root: HTMLElement): void {
  selection(root);
  edges(root);
}

function selection(root: HTMLElement): void {
  const box = root.querySelector<HTMLElement>("[data-sel]");
  const hero = box?.closest<HTMLElement>(".ox-hero");
  const title = hero?.querySelector<HTMLElement>(".ox-hero-title");
  if (!box || !hero || !title) return;
  const place = () => {
    const a = title.getBoundingClientRect();
    const b = hero.getBoundingClientRect();
    const right = Math.max(
      a.left + 10,
      ...[...title.querySelectorAll<HTMLElement>(".ox-hero-line > span")].map((span) => {
        const range = document.createRange();
        range.selectNodeContents(span);
        return range.getBoundingClientRect().right;
      }),
    );
    gsap.set(box, {
      x: a.left - b.left - 22,
      y: a.top - b.top - 14,
      width: right - a.left + 44,
      height: a.height + 22,
    });
  };
  place();
  sized(hero, place);
  document.fonts.ready.then(place);

  const handles = box.querySelectorAll(".sel-h");
  const chip = box.querySelector(".sel-chip");
  const out = box.querySelector(".sel-out");
  if (reduced()) return;

  const hand = cursor(hero);
  const reach = { p: 0 };
  const tl = gsap.timeline({ delay: 1.15 });
  later(() => tl.kill());
  tl.set(box, { clipPath: "inset(0 100% 100% 0 round 14px)" }, 0);
  tl.set([handles, chip, out], { autoAlpha: 0 }, 0);
  tl.call(() => {
    const at = gsap.getProperty(box, "x") as number;
    const top = gsap.getProperty(box, "y") as number;
    gsap.set(hand, { x: at - 6, y: top - 4 });
  });
  tl.to(hand, { autoAlpha: 1, duration: 0.25 });
  tl.to(reach, {
    p: 1,
    duration: 1.1,
    ease: "power2.inOut",
    onUpdate: () => {
      const left = gsap.getProperty(box, "x") as number;
      const top = gsap.getProperty(box, "y") as number;
      const width = gsap.getProperty(box, "width") as number;
      const height = gsap.getProperty(box, "height") as number;
      gsap.set(box, { clipPath: `inset(0 ${(1 - reach.p) * 100}% ${(1 - reach.p) * 100}% 0 round 14px)` });
      gsap.set(hand, { x: left + width * reach.p, y: top + height * reach.p });
    },
  });
  tl.set(box, { clipPath: "none" });
  tl.fromTo(handles, { scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, stagger: 0.05, ease: "back.out(3)" }, "+=0.05");
  tl.fromTo(chip, { y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, "<0.1");
  tl.fromTo(out, { x: -8 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out" }, "<0.1");
  tl.to(hand, { x: "+=60", y: "+=50", autoAlpha: 0, duration: 0.6, ease: "power2.in" }, "<");
}

interface Edge {
  from: HTMLElement;
  to: HTMLElement;
  source: HTMLElement;
  frame: HTMLElement | null;
  line: Line;
  start: number;
  end: number;
  done: boolean;
}

function edges(root: HTMLElement): void {
  const frames = [...root.querySelectorAll<HTMLElement>("[data-frame]")];
  const start = root.querySelector<HTMLElement>("[data-start-out]");
  const download = root.querySelector<HTMLElement>(".ox-download");
  const button = download?.querySelector<HTMLElement>(".ox-button-main");
  if (!frames.length || !start || !download || !button) return;
  const chained = frames.filter((frame) => frame.querySelector("[data-frame-in]"));
  const svg = overlay(root, "ed");
  const pairs: { from: HTMLElement; to: HTMLElement; source: HTMLElement; frame: HTMLElement | null }[] = [];
  let previous: { out: HTMLElement; source: HTMLElement; kind?: string } = {
    out: start,
    source: start.closest<HTMLElement>(".cv-start")!,
    kind: "browser",
  };
  for (const frame of chained) {
    const kind = previous.kind;
    const inputs = [...frame.querySelectorAll<HTMLElement>("[data-frame-in]")];
    const target = inputs.find((port) => port.dataset.kind === kind) ?? inputs[0];
    pairs.push({ from: previous.out, to: target.querySelector("i")!, source: previous.source, frame });
    const out = frame.querySelector<HTMLElement>("[data-frame-out='0']");
    if (!out) break;
    previous = { out: out.querySelector("i")!, source: frame, kind: out.dataset.kind };
  }
  pairs.push({ from: previous.out, to: button, source: previous.source, frame: null });

  const list: Edge[] = pairs.map((pair) => {
    const kind = pair.frame ? pair.to.parentElement?.dataset.kind : "file";
    return { ...pair, line: line(svg, color(kind), reduced()), start: 0, end: 0, done: false };
  });

  const measure = () => {
    const origin = root.getBoundingClientRect();
    const width = root.clientWidth;
    const local = (el: Element, side: "centre" | "left" = "centre"): Point => {
      const box = el.getBoundingClientRect();
      return [
        (side === "left" ? box.left - 6 : box.left + box.width / 2) - origin.left,
        box.top + box.height / 2 - origin.top,
      ];
    };
    for (const edge of list) {
      const a = local(edge.from);
      const b = local(edge.to, edge.frame ? "centre" : "left");
      const own = edge.source.getBoundingClientRect();
      const next = edge.source.nextElementSibling?.getBoundingClientRect();
      const gap = next ? (own.bottom + next.top) / 2 - origin.top : own.bottom + 40 - origin.top;
      const right = Math.min(width - 10, own.right - origin.left + 20, a[0] + 28);
      const lane = Math.max(right, a[0] + 18);
      const left = edge.frame
        ? Math.max(10, Math.min(b[0] - 22, edge.frame.getBoundingClientRect().left - origin.left - 18))
        : Math.max(10, own.left - origin.left - 18);
      edge.line.set(rounded([a, [lane, a[1]], [lane, gap], [left, gap], [left, b[1]], b], 14));
      edge.start = a[1];
      edge.end = b[1];
    }
    update();
  };

  const states = frames.filter((frame) => frame.querySelector("[data-frame-state]"));
  const words: Record<string, string> = { waiting: "Waiting", running: "Running", done: "Done" };
  const update = () => {
    const origin = root.getBoundingClientRect();
    const reach = ahead() - origin.top;
    for (const edge of list) {
      const p = Math.min(1, Math.max(0, (reach - edge.start) / Math.max(1, edge.end - edge.start)));
      if (!reduced()) edge.line.path.style.strokeDashoffset = String(1 - p);
      const done = p >= 1;
      if (done === edge.done) continue;
      edge.done = done;
      edge.line.on(done);
      if (edge.frame) edge.to.parentElement?.classList.toggle("is-fed", done);
      else download.classList.toggle("is-plugged", done);
    }
    for (const frame of states) {
      const box = frame.getBoundingClientRect();
      const top = box.top - origin.top;
      const bottom = box.bottom - origin.top;
      const state = reach < top + 40 ? "waiting" : reach < bottom - 120 ? "running" : "done";
      if (frame.dataset.state === state) continue;
      frame.dataset.state = state;
      const word = frame.querySelector<HTMLElement>("[data-frame-word]");
      if (word) word.textContent = words[state];
    }
  };

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  ScrollTrigger.addEventListener("refresh", measure);
  sized(root, measure);
  later(() => {
    window.removeEventListener("scroll", onScroll);
    ScrollTrigger.removeEventListener("refresh", measure);
    cancelAnimationFrame(frame);
  });
  measure();
}

function make<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const el = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  parent?.append(el);
  return el;
}

function overlay(host: HTMLElement, className: string): SVGSVGElement {
  const svg = make("svg", { class: className, "aria-hidden": "true" });
  host.append(svg);
  later(() => svg.remove());
  return svg;
}

function cursor(host: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  el.className = "mk";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    '<svg viewBox="0 0 28 28"><path class="mk-arrow" d="M5 3.5v18.2l4.9-4.5 3.2 7.3 3.4-1.5-3.2-7.2 6.6-.4z"/></svg>';
  host.append(el);
  later(() => el.remove());
  gsap.set(el, { autoAlpha: 0 });
  return el;
}

interface Line {
  g: SVGGElement;
  path: SVGPathElement;
  set: (d: string) => void;
  on: (flowing: boolean) => void;
}

function line(svg: SVGSVGElement, color: string, drawn = false): Line {
  const g = make("g", { class: "ed-line" }, svg);
  g.style.setProperty("--c", color);
  const path = make("path", { class: "ed-wire", pathLength: 1 }, g);
  const flow = make("path", { class: "ed-flow", pathLength: 1 }, g);
  if (!drawn) path.style.strokeDashoffset = "1";
  return {
    g,
    path,
    set: (d) => {
      path.setAttribute("d", d);
      flow.setAttribute("d", d);
    },
    on: (flowing) => g.classList.toggle("is-on", flowing),
  };
}

function sized(host: Element, fn: () => void): void {
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fn);
  });
  observer.observe(host);
  later(() => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  });
}

function ahead(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const left = Math.max(0, max - window.scrollY);
  const boost = Math.max(0, 1 - left / window.innerHeight) * 0.36;
  return window.innerHeight * (0.62 + boost);
}
