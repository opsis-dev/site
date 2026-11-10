type Cleanup = () => void;

const cleanups: Cleanup[] = [];

export function later(fn: Cleanup): void {
  cleanups.push(fn);
}

export function teardown(): void {
  for (const clean of cleanups.splice(0)) clean();
}

export const reduced = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const wide = (): boolean => matchMedia("(min-width: 1001px)").matches;

export function onScreen(el: Element, change: (visible: boolean) => void, margin = "0px", threshold = 0.2): void {
  const io = new IntersectionObserver(([entry]) => change(entry.isIntersecting), { rootMargin: margin, threshold });
  io.observe(el);
  later(() => io.disconnect());
}

export function listen<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  fn: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void {
  target.addEventListener(type, fn, options);
  later(() => target.removeEventListener(type, fn, options));
}

export function every(ms: number, fn: () => void): void {
  const id = window.setInterval(fn, ms);
  later(() => window.clearInterval(id));
}
