/**
 * Incompressible Navier-Stokes on the GPU (semi-Lagrangian "stable fluids").
 *
 * Per frame: advect velocity through itself → add vorticity confinement →
 * compute divergence → solve pressure with Jacobi iterations → subtract the
 * pressure gradient (making the field divergence-free) → advect dye.
 * Every step is a fragment shader over a ping-ponged float framebuffer.
 *
 * Framework-free on purpose: the React component owns the canvas element and
 * the sliders, this owns the GL. Params are read from a mutable object every
 * frame so moving a slider never re-creates anything.
 */

import { readBrand } from '~/lib/palette';

export interface FluidParams {
  /** Vorticity confinement — how much swirl is re-injected. */
  curl: number;
  /** Dye dissipation; higher fades faster. */
  fade: number;
  /** Splat radius as a fraction of the canvas. */
  scale: number;
}

export interface FluidHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
}

const SIM_RESOLUTION = 128;
const DYE_RESOLUTION = 512;
const PRESSURE_ITERATIONS = 20;
const VELOCITY_DISSIPATION = 0.2;
const PRESSURE_DECAY = 0.8;
const SPLAT_FORCE = 6000;

/* ---------------------------------------------------------------- shaders */

const VERT = `#version 300 es
precision highp float;
// Explicit location: the quad is bound to attribute 0 at setup, and relying
// on the linker to happen to pick 0 is not guaranteed.
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAG_COPY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float value;
void main () { fragColor = value * texture(uTexture, vUv); }`;

const FRAG_SPLAT = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`;

const FRAG_ADVECT = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  // Trace this cell backwards through the velocity field and sample there.
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`;

const FRAG_DIVERGENCE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  // Reflect at the walls so the fluid stays in the box.
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const FRAG_CURL = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
}`;

const FRAG_VORTICITY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;

  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
  velocity = clamp(velocity, -1000.0, 1000.0);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const FRAG_PRESSURE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const FRAG_GRADIENT = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const FRAG_DISPLAY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
void main () {
  vec3 c = texture(uTexture, vUv).rgb;
  // Tone down the very brightest dye so it never blows out to flat white.
  c = c / (c + vec3(0.65)) * 1.35;
  fragColor = vec4(c, 1.0);
}`;

/* ------------------------------------------------------------------ types */

interface Fbo {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach(id: number): number;
}

interface DoubleFbo {
  read: Fbo;
  write: Fbo;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  swap(): void;
}

interface Pointer {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  down: boolean;
  moved: boolean;
  color: [number, number, number];
}

/* -------------------------------------------------------------- the solver */

export function createFluidSim(
  canvas: HTMLCanvasElement,
  params: FluidParams,
): FluidHandle | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) return null;

  // Rendering to float textures is an extension even in WebGL2.
  const floatExt = gl.getExtension('EXT_color_buffer_float');
  if (!floatExt) return null;
  // Half-float textures are filterable in core WebGL2 — the extension only
  // governs *rendering* to them, so linear is always safe here.
  const filtering = gl.LINEAR;

  /* --- program helpers --- */

  function compile(type: number, source: string): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.error('[fluid] shader compile failed:', gl!.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  if (!vertexShader) return null;

  interface Program {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
  }

  function createProgram(fragmentSource: string): Program | null {
    const fragment = compile(gl!.FRAGMENT_SHADER, fragmentSource);
    if (!fragment) return null;

    const program = gl!.createProgram();
    if (!program) return null;
    gl!.attachShader(program, vertexShader!);
    gl!.attachShader(program, fragment);
    gl!.linkProgram(program);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
      console.error('[fluid] program link failed:', gl!.getProgramInfoLog(program));
      return null;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i += 1) {
      const info = gl!.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl!.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  }

  const programs = {
    copy: createProgram(FRAG_COPY),
    splat: createProgram(FRAG_SPLAT),
    advect: createProgram(FRAG_ADVECT),
    divergence: createProgram(FRAG_DIVERGENCE),
    curl: createProgram(FRAG_CURL),
    vorticity: createProgram(FRAG_VORTICITY),
    pressure: createProgram(FRAG_PRESSURE),
    gradient: createProgram(FRAG_GRADIENT),
    display: createProgram(FRAG_DISPLAY),
  };

  if (Object.values(programs).some((p) => p === null)) return null;
  const P = programs as { [K in keyof typeof programs]: Program };

  /* --- fullscreen quad --- */

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target: Fbo | null): void {
    if (target === null) {
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    } else {
      gl!.viewport(0, 0, target.width, target.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
    }
    gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
  }

  /* --- framebuffers --- */

  function createFbo(w: number, h: number, internal: number, format: number, filter: number): Fbo {
    const texture = gl!.createTexture()!;
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internal, w, h, 0, format, gl!.HALF_FLOAT, null);

    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
    gl!.viewport(0, 0, w, h);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      attach(id: number) {
        gl!.activeTexture(gl!.TEXTURE0 + id);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFbo(
    w: number,
    h: number,
    internal: number,
    format: number,
    filter: number,
  ): DoubleFbo {
    let fbo1 = createFbo(w, h, internal, format, filter);
    let fbo2 = createFbo(w, h, internal, format, filter);
    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      get read() {
        return fbo1;
      },
      set read(value: Fbo) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value: Fbo) {
        fbo2 = value;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  function resolution(target: number): { width: number; height: number } {
    const aspect = gl!.drawingBufferWidth / gl!.drawingBufferHeight || 1;
    const ratio = aspect < 1 ? 1 / aspect : aspect;
    const min = Math.round(target);
    const max = Math.round(target * ratio);
    return aspect > 1 ? { width: max, height: min } : { width: min, height: max };
  }

  let dye: DoubleFbo;
  let velocity: DoubleFbo;
  let divergence: Fbo;
  let curlFbo: Fbo;
  let pressure: DoubleFbo;

  function initFramebuffers(): void {
    const sim = resolution(SIM_RESOLUTION);
    const dyeRes = resolution(DYE_RESOLUTION);

    dye = createDoubleFbo(dyeRes.width, dyeRes.height, gl!.RGBA16F, gl!.RGBA, filtering);
    velocity = createDoubleFbo(sim.width, sim.height, gl!.RG16F, gl!.RG, filtering);
    divergence = createFbo(sim.width, sim.height, gl!.R16F, gl!.RED, gl!.NEAREST);
    curlFbo = createFbo(sim.width, sim.height, gl!.R16F, gl!.RED, gl!.NEAREST);
    pressure = createDoubleFbo(sim.width, sim.height, gl!.R16F, gl!.RED, gl!.NEAREST);
  }

  /* --- canvas sizing --- */

  function resizeCanvas(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  resizeCanvas();
  initFramebuffers();

  /* --- dye colours ---
     Read from the design tokens, so tokens.css stays the only place any
     colour in the project is declared. */

  const PALETTE = readBrand().ramp;

  function splatColor(): [number, number, number] {
    const base = PALETTE[Math.floor(Math.random() * PALETTE.length)]!;
    // Slight per-splat variation so overlapping strokes still read apart.
    const gain = 0.18 + Math.random() * 0.1;
    return [base[0] * gain, base[1] * gain, base[2] * gain];
  }

  /* --- splats --- */

  function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    gl!.useProgram(P.splat.program);
    gl!.uniform1i(P.splat.uniforms.uTarget!, velocity.read.attach(0));
    gl!.uniform1f(P.splat.uniforms.aspectRatio!, canvas.width / canvas.height);
    gl!.uniform2f(P.splat.uniforms.point!, x, y);
    gl!.uniform3f(P.splat.uniforms.color!, dx, dy, 0);
    gl!.uniform1f(P.splat.uniforms.radius!, splatRadius() / 100);
    blit(velocity.write);
    velocity.swap();

    gl!.uniform1i(P.splat.uniforms.uTarget!, dye.read.attach(0));
    gl!.uniform3f(P.splat.uniforms.color!, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  }

  function splatRadius(): number {
    let radius = params.scale;
    const aspect = canvas.width / canvas.height;
    if (aspect > 1) radius *= aspect;
    return radius;
  }

  function splatPointer(pointer: Pointer): void {
    splat(pointer.x, pointer.y, pointer.dx * SPLAT_FORCE, pointer.dy * SPLAT_FORCE, pointer.color);
  }

  /** A drifting stroke so the canvas is alive before anyone touches it. */
  function randomSplat(): void {
    const color = splatColor();
    const x = Math.random();
    const y = Math.random();
    const dx = 1000 * (Math.random() - 0.5);
    const dy = 1000 * (Math.random() - 0.5);
    splat(x, y, dx, dy, color.map((c) => c * 8) as [number, number, number]);
  }

  /* --- pointer state --- */

  const pointers = new Map<number, Pointer>();

  function pointerFrom(event: PointerEvent): Pointer {
    const existing = pointers.get(event.pointerId);
    if (existing) return existing;
    const created: Pointer = {
      id: event.pointerId,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      down: false,
      moved: false,
      color: splatColor(),
    };
    pointers.set(event.pointerId, created);
    return created;
  }

  function normalized(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      // GL's origin is bottom-left.
      y: 1 - (event.clientY - rect.top) / rect.height,
    };
  }

  function onPointerDown(event: PointerEvent): void {
    const pointer = pointerFrom(event);
    const { x, y } = normalized(event);
    pointer.down = true;
    pointer.moved = false;
    pointer.x = x;
    pointer.y = y;
    pointer.dx = 0;
    pointer.dy = 0;
    pointer.color = splatColor();
  }

  function onPointerMove(event: PointerEvent): void {
    const pointer = pointerFrom(event);
    const { x, y } = normalized(event);
    // Hover moves the dye too, just without a fresh colour.
    pointer.dx = (x - pointer.x) * 5;
    pointer.dy = (y - pointer.y) * 5;
    pointer.x = x;
    pointer.y = y;
    pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0;
  }

  function onPointerUp(event: PointerEvent): void {
    const pointer = pointers.get(event.pointerId);
    if (pointer) pointer.down = false;
    pointers.delete(event.pointerId);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  /* --- context loss --- */

  let contextLost = false;

  function onContextLost(event: Event): void {
    event.preventDefault();
    contextLost = true;
  }

  function onContextRestored(): void {
    contextLost = false;
    initFramebuffers();
  }

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  /* --- the step --- */

  function step(dt: number): void {
    gl!.disable(gl!.BLEND);

    // Vorticity confinement: measure curl, then push velocity back along it.
    gl!.useProgram(P.curl.program);
    gl!.uniform2f(P.curl.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.curl.uniforms.uVelocity!, velocity.read.attach(0));
    blit(curlFbo);

    gl!.useProgram(P.vorticity.program);
    gl!.uniform2f(P.vorticity.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.vorticity.uniforms.uVelocity!, velocity.read.attach(0));
    gl!.uniform1i(P.vorticity.uniforms.uCurl!, curlFbo.attach(1));
    gl!.uniform1f(P.vorticity.uniforms.curl!, params.curl);
    gl!.uniform1f(P.vorticity.uniforms.dt!, dt);
    blit(velocity.write);
    velocity.swap();

    // Divergence of the velocity field.
    gl!.useProgram(P.divergence.program);
    gl!.uniform2f(P.divergence.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.divergence.uniforms.uVelocity!, velocity.read.attach(0));
    blit(divergence);

    // Decay the previous pressure guess, then relax towards the solution.
    gl!.useProgram(P.copy.program);
    gl!.uniform1i(P.copy.uniforms.uTexture!, pressure.read.attach(0));
    gl!.uniform1f(P.copy.uniforms.value!, PRESSURE_DECAY);
    blit(pressure.write);
    pressure.swap();

    gl!.useProgram(P.pressure.program);
    gl!.uniform2f(P.pressure.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.pressure.uniforms.uDivergence!, divergence.attach(0));
    for (let i = 0; i < PRESSURE_ITERATIONS; i += 1) {
      gl!.uniform1i(P.pressure.uniforms.uPressure!, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // Make the field incompressible.
    gl!.useProgram(P.gradient.program);
    gl!.uniform2f(P.gradient.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.gradient.uniforms.uPressure!, pressure.read.attach(0));
    gl!.uniform1i(P.gradient.uniforms.uVelocity!, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // Advect velocity through itself, then carry the dye along.
    gl!.useProgram(P.advect.program);
    gl!.uniform2f(P.advect.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.advect.uniforms.uVelocity!, velocity.read.attach(0));
    gl!.uniform1i(P.advect.uniforms.uSource!, velocity.read.attach(0));
    gl!.uniform1f(P.advect.uniforms.dt!, dt);
    gl!.uniform1f(P.advect.uniforms.dissipation!, VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    gl!.uniform1i(P.advect.uniforms.uVelocity!, velocity.read.attach(0));
    gl!.uniform1i(P.advect.uniforms.uSource!, dye.read.attach(1));
    gl!.uniform1f(P.advect.uniforms.dissipation!, params.fade);
    blit(dye.write);
    dye.swap();
  }

  function render(): void {
    gl!.useProgram(P.display.program);
    gl!.uniform1i(P.display.uniforms.uTexture!, dye.read.attach(0));
    blit(null);
  }

  /* --- the loop --- */

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now();
  let sinceSplat = 0;
  let frame = 0;
  let paused = false;
  let destroyed = false;

  // Seed a few strokes so the first frame is already interesting.
  for (let i = 0; i < 12; i += 1) randomSplat();

  function tick(now: number): void {
    if (destroyed) return;

    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!paused && !contextLost) {
      if (resizeCanvas()) initFramebuffers();

      for (const pointer of pointers.values()) {
        if (pointer.moved) {
          pointer.moved = false;
          splatPointer(pointer);
        }
      }

      // Idle motion, unless the visitor asked for less of it.
      if (!reducedMotion) {
        sinceSplat += dt;
        if (sinceSplat > 3.5) {
          sinceSplat = 0;
          randomSplat();
        }
      }

      step(dt);
      render();
    }

    frame = window.requestAnimationFrame(tick);
  }

  frame = window.requestAnimationFrame(tick);

  function onVisibility(): void {
    paused = document.hidden;
    if (!paused) last = performance.now();
  }

  document.addEventListener('visibilitychange', onVisibility);

  return {
    setPaused(next: boolean) {
      paused = next;
      if (!next) last = performance.now();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      document.removeEventListener('visibilitychange', onVisibility);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
