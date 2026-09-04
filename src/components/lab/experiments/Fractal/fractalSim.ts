/**
 * The Mandelbrot set, one fragment shader, one full-screen pass.
 *
 * Escape-time iteration with a smooth (fractional) iteration count, so the
 * bands blend instead of stepping. Drag to pan. Colour comes from the site
 * palette: the interior is ink, the exterior ramps red → ember → tint.
 */

import { EMBER, INK, RED, TINT } from '~/lib/palette';

export interface FractalParams {
  /** Maximum escape iterations. More detail, more cost. */
  iterations: number;
  /** Zoom exponent; actual zoom is 0.4 * 10^zoomExp. */
  zoomExp: number;
  /** Rotates the colour ramp, 0-1. */
  colorShift: number;
}

export interface FractalHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  recenter(): void;
}

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
void main () { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uIterations;
uniform float uColorShift;
uniform vec3 uInk;
uniform vec3 uRed;
uniform vec3 uEmber;
uniform vec3 uTint;

vec3 ramp (float t) {
  t = fract(t);
  if (t < 0.34) return mix(uInk, uRed, t / 0.34);
  if (t < 0.67) return mix(uRed, uEmber, (t - 0.34) / 0.33);
  return mix(uEmber, uTint, (t - 0.67) / 0.33);
}

void main () {
  // Square pixels, vertical axis normalised, origin in the middle.
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  vec2 c = uCenter + uv / uZoom;

  vec2 z = vec2(0.0);
  float i = 0.0;
  // Constant bound with an early break: required by GLSL ES, and lets the
  // iteration count stay a live uniform.
  for (int n = 0; n < 2000; n++) {
    if (i >= uIterations) break;
    // z = z^2 + c
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 256.0) break;
    i += 1.0;
  }

  if (i >= uIterations) {
    fragColor = vec4(uInk, 1.0);
    return;
  }

  // Smooth iteration count removes the visible banding.
  float smoothed = i + 1.0 - log2(max(log2(length(z)), 1e-6));
  fragColor = vec4(ramp(smoothed * 0.035 + uColorShift), 1.0);
}`;

export function createFractalSim(
  canvas: HTMLCanvasElement,
  params: FractalParams,
): FractalHandle | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl) return null;

  function compile(type: number, source: string): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.error('[fractal] shader compile failed:', gl!.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[fractal] program link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    center: gl.getUniformLocation(program, 'uCenter'),
    zoom: gl.getUniformLocation(program, 'uZoom'),
    iterations: gl.getUniformLocation(program, 'uIterations'),
    colorShift: gl.getUniformLocation(program, 'uColorShift'),
    ink: gl.getUniformLocation(program, 'uInk'),
    red: gl.getUniformLocation(program, 'uRed'),
    ember: gl.getUniformLocation(program, 'uEmber'),
    tint: gl.getUniformLocation(program, 'uTint'),
  };

  gl.uniform3f(uniforms.ink, INK[0], INK[1], INK[2]);
  gl.uniform3f(uniforms.red, RED[0], RED[1], RED[2]);
  gl.uniform3f(uniforms.ember, EMBER[0], EMBER[1], EMBER[2]);
  gl.uniform3f(uniforms.tint, TINT[0], TINT[1], TINT[2]);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  /* --- view state --- */

  const HOME: [number, number] = [-0.75, 0];
  const center: [number, number] = [...HOME];

  function zoom(): number {
    return 0.4 * Math.pow(10, params.zoomExp);
  }

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  /* --- drag to pan --- */

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    // Convert pixel movement into complex-plane movement at this zoom.
    const scale = 1 / (rect.height * zoom());
    center[0] -= (event.clientX - lastX) * scale;
    center[1] += (event.clientY - lastY) * scale;
    lastX = event.clientX;
    lastY = event.clientY;
  }

  function onPointerUp(event: PointerEvent): void {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  /* --- loop --- */

  let frame = 0;
  let paused = false;
  let destroyed = false;

  function draw(): void {
    if (destroyed) return;

    if (!paused) {
      resize();
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl!.uniform2f(uniforms.center, center[0], center[1]);
      gl!.uniform1f(uniforms.zoom, zoom());
      gl!.uniform1f(uniforms.iterations, params.iterations);
      gl!.uniform1f(uniforms.colorShift, params.colorShift);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    frame = window.requestAnimationFrame(draw);
  }

  frame = window.requestAnimationFrame(draw);

  function onVisibility(): void {
    paused = document.hidden;
  }

  document.addEventListener('visibilitychange', onVisibility);

  return {
    setPaused(next: boolean) {
      paused = next;
    },
    recenter() {
      center[0] = HOME[0];
      center[1] = HOME[1];
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('visibilitychange', onVisibility);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
