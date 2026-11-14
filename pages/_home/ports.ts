export const ports = {
  browser: { word: "Browser", color: "#38bdf8" },
  recording: { word: "Recording", color: "#f97316" },
  style: { word: "Style", color: "#fbbf24" },
  clip: { word: "Clip", color: "#a78bfa" },
  transition: { word: "Transition", color: "#e879f9" },
  file: { word: "File", color: "#60a5fa" },
} as const;

export type PortKind = keyof typeof ports;

export interface Port {
  kind: PortKind;
  label?: string;
}

export interface Spec {
  title: string;
  category: string;
  color: string;
  icon: string;
  inputs: Port[];
  outputs: Port[];
}

const browser = "#38bdf8";
const capture = "#f97316";
const camera = "#fb923c";
const text = "#a78bfa";
const timeline = "#f472b6";
const output = "#f43f5e";
const neutral = "#71717a";

export const specs = {
  open: { title: "Open browser", category: "Browser", color: browser, icon: "app-window", inputs: [], outputs: [{ kind: "browser" }] },
  record: {
    title: "Record take",
    category: "Record",
    color: capture,
    icon: "video",
    inputs: [{ kind: "browser" }],
    outputs: [{ kind: "recording" }, { kind: "browser" }],
  },
  clip: {
    title: "Clip from take",
    category: "Camera",
    color: camera,
    icon: "scan-search",
    inputs: [{ kind: "recording" }, { kind: "style" }],
    outputs: [{ kind: "clip" }],
  },
  title: { title: "Title card", category: "Text & overlays", color: text, icon: "heading", inputs: [], outputs: [{ kind: "clip" }] },
  sequence: {
    title: "Sequence",
    category: "Timeline",
    color: timeline,
    icon: "layers",
    inputs: [{ kind: "transition" }, { kind: "clip", label: "Clip 1" }, { kind: "clip", label: "Clip 2" }],
    outputs: [{ kind: "clip" }],
  },
  export: { title: "Export video", category: "Export", color: output, icon: "clapperboard", inputs: [{ kind: "clip" }], outputs: [{ kind: "file" }] },
  note: { title: "Note", category: "Organise", color: neutral, icon: "sticky-note", inputs: [], outputs: [] },
} satisfies Record<string, Spec>;

export type SpecId = keyof typeof specs;

export const word = (port: Port): string => port.label ?? ports[port.kind].word;
