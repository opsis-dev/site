const sky = "#38bdf8";
const orange = "#f97316";
const camera = "#fb923c";
const amber = "#fbbf24";
const violet = "#a78bfa";
const green = "#34d399";
const pink = "#f472b6";
const rose = "#f43f5e";

export const nodes = {
  open: { title: "Open browser", icon: "app-window", color: sky },
  goto: { title: "Go to page", icon: "globe", color: sky },
  click: { title: "Click", icon: "mouse-pointer-click", color: sky },
  type: { title: "Type text", icon: "text-cursor-input", color: sky },
  keys: { title: "Press keys", icon: "keyboard", color: sky },
  share: { title: "Click", icon: "mouse-pointer-click", color: sky },
  record: { title: "Record take", icon: "video", color: orange },
  cursor: { title: "Cursor", icon: "mouse-pointer-2", color: amber },
  frame: { title: "Window frame", icon: "panel-top", color: camera },
  backdrop: { title: "Backdrop", icon: "wallpaper", color: camera },
  clip: { title: "Clip from take", icon: "scan-search", color: camera },
  title: { title: "Title card", icon: "heading", color: violet },
  music: { title: "Music", icon: "music", color: green },
  sequence: { title: "Sequence", icon: "layers", color: pink },
  export: { title: "Export video", icon: "clapperboard", color: rose },
} as const;

export type NodeId = keyof typeof nodes;

export const board = { width: 1160, height: 296 };
export const card = { width: 136, height: 44 };

const rowA = 30;
const rowB = 126;
const rowC = 222;
const column = (index: number) => 20 + index * 162;

export const placed: { id: NodeId; x: number; y: number; stage: number }[] = [
  { id: "open", x: column(0), y: rowA, stage: 0 },
  { id: "goto", x: column(1), y: rowA, stage: 0 },
  { id: "click", x: column(2), y: rowA, stage: 0 },
  { id: "type", x: column(3), y: rowA, stage: 0 },
  { id: "keys", x: column(4), y: rowA, stage: 0 },
  { id: "share", x: column(5), y: rowA, stage: 0 },
  { id: "record", x: column(6), y: rowA, stage: 1 },
  { id: "cursor", x: column(0), y: rowB, stage: 2 },
  { id: "frame", x: column(1), y: rowB, stage: 2 },
  { id: "backdrop", x: column(2), y: rowB, stage: 2 },
  { id: "clip", x: column(4), y: rowB, stage: 2 },
  { id: "title", x: column(3), y: rowC, stage: 3 },
  { id: "sequence", x: column(5), y: rowB, stage: 3 },
  { id: "music", x: column(5), y: rowC, stage: 3 },
  { id: "export", x: column(6), y: rowB, stage: 3 },
];

export type Point = [number, number];

const at = (id: NodeId) => placed.find((node) => node.id === id)!;
const out = (id: NodeId): Point => [at(id).x + card.width, at(id).y + card.height / 2];
const into = (id: NodeId, dy = 0): Point => [at(id).x, at(id).y + card.height / 2 + dy];

export function rounded(points: Point[], radius = 10): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const before = Math.min(radius, Math.hypot(x - px, y - py) / 2);
    const after = Math.min(radius, Math.hypot(nx - x, ny - y) / 2);
    const ax = x - Math.sign(x - px) * before;
    const ay = y - Math.sign(y - py) * before;
    const bx = x + Math.sign(nx - x) * after;
    const by = y + Math.sign(ny - y) * after;
    d += ` L${ax} ${ay} Q${x} ${y} ${bx} ${by}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

const straight = (from: NodeId, to: NodeId): Point[] => [out(from), into(to)];
const elbow = (from: NodeId, to: NodeId, gap = 12): Point[] => {
  const [x1, y1] = out(from);
  const [x2, y2] = into(to);
  return [
    [x1, y1],
    [x2 - gap, y1],
    [x2 - gap, y2],
    [x2, y2],
  ];
};

const back: Point[] = (() => {
  const [x1, y1] = out("record");
  const [x2, y2] = into("clip", 10);
  const lane = (rowA + card.height + rowB) / 2;
  return [
    [x1, y1],
    [x1 + 16, y1],
    [x1 + 16, lane],
    [x2 - 16, lane],
    [x2 - 16, y2],
    [x2, y2],
  ];
})();

const wire = (points: Point[], color: string, stage: number) => ({
  d: rounded(points),
  color,
  stage,
  from: points[0],
  to: points[points.length - 1],
});

export const wires = [
  wire(straight("open", "goto"), sky, 0),
  wire(straight("goto", "click"), sky, 0),
  wire(straight("click", "type"), sky, 0),
  wire(straight("type", "keys"), sky, 0),
  wire(straight("keys", "share"), sky, 0),
  wire(straight("share", "record"), sky, 1),
  wire(straight("cursor", "frame"), amber, 2),
  wire(straight("frame", "backdrop"), amber, 2),
  wire(straight("backdrop", "clip"), amber, 2),
  wire(back, orange, 2),
  wire(straight("clip", "sequence"), violet, 3),
  wire(elbow("title", "sequence", 14), violet, 3),
  wire(straight("sequence", "export"), violet, 3),
  wire(elbow("music", "export"), green, 3),
];
