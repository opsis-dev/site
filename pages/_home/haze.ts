import { later, onScreen, reduced } from "./life";

const vertex = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const fragment = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform float d;
uniform float s;
uniform vec2 c;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+17.;a*=.5;}return v;}
float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
float b8(vec2 a){return b4(.5*a)*.25+b2(a);}
void main(){
  vec2 cell=floor(gl_FragCoord.xy/d);
  vec2 uv=cell*d/r;
  vec2 p=(cell*d-.5*r)/r.y;
  vec2 q=vec2(fbm(p*1.25+vec2(s,t*.035)),fbm(p*1.25+vec2(4.7-t*.03,s)));
  float f=fbm(p*1.05+1.9*q+s);
  float glow=smoothstep(.34,.86,f);
  float reach=clamp(.95*r.x/r.y,.42,.95);
  float place=smoothstep(reach,0.,distance((uv-c)*vec2(r.x/r.y,1.),vec2(0.)));
  float v=clamp(place*(.22+.78*glow),0.,1.);
  float on=step(b8(cell)+.02,v*.92);
  vec3 base=vec3(.0431,.0431,.0549);
  vec3 ink=mix(vec3(.42,.15,.06),vec3(.988,.42,.2),v);
  gl_FragColor=vec4(mix(base,ink,on*.62),1.);
}`;

export function haze(canvas: HTMLCanvasElement, seed: number): void {
  const [focusX, focusY] = (canvas.dataset.haze || "0.5,0.5").split(",").map(Number);
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) {
    canvas.style.display = "none";
    return;
  }
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.style.display = "none";
    return;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const size = gl.getUniformLocation(program, "r");
  const time = gl.getUniformLocation(program, "t");
  const dot = gl.getUniformLocation(program, "d");
  gl.uniform1f(gl.getUniformLocation(program, "s"), seed);
  gl.uniform2f(gl.getUniformLocation(program, "c"), focusX, focusY);

  const still = reduced();
  let frame = 0;
  let visible = false;
  let last = 0;

  const draw = (now: number) => {
    frame = 0;
    if (now - last > 40 || still) {
      last = now;
      gl.uniform1f(time, still ? 8 : now / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (visible && !still && !document.hidden) frame = requestAnimationFrame(draw);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    const ratio = Math.min(devicePixelRatio, 1.5);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(size, width, height);
    gl.uniform1f(dot, Math.max(2, Math.round(3 * ratio)));
    last = 0;
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  onScreen(
    canvas,
    (seen) => {
      visible = seen;
      if (seen) wake();
    },
    "0px",
    0,
  );
  document.addEventListener("visibilitychange", wake);
  later(() => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", wake);
  });
}
