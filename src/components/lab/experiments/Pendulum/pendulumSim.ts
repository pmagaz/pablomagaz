/**
 * Double pendulum simulation on a 2D canvas.
 *
 * The double pendulum is a canonical example of chaotic motion: two rigid
 * rods with bobs at the ends, the second pivoting from the first. Despite
 * obeying deterministic equations, tiny differences in starting angle
 * produce wildly different trajectories after a few swings.
 *
 * Physics uses the Lagrangian formulation, integrated with RK4 for stability.
 * A trail shows the path of the lower bob, fading over time.
 */

import { css, mix, readBrand, type Rgb } from '~/lib/palette';

export interface PendulumParams {
  /** Length ratio of second rod to first (0.5–1.5). */
  length2: number;
  /** Mass ratio of second bob to first (0.5–2). */
  mass2: number;
  /** Damping factor: 1 = none, lower = more friction. */
  damping: number;
}

export interface PendulumHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  reset(): void;
}

interface State {
  θ1: number; // angle of first rod from vertical
  θ2: number; // angle of second rod from vertical
  ω1: number; // angular velocity of first rod
  ω2: number; // angular velocity of second rod
}

/** Trail point for the lower bob's path. */
interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

// Gravity scaled for pixel-space pendulum lengths.
const G = 800;
const TRAIL_MAX_AGE = 12; // seconds before trail point fades out
const TRAIL_SAMPLE_INTERVAL = 0.004; // sample every ~4ms for very smooth curves

export function createPendulumSim(
  canvas: HTMLCanvasElement,
  params: PendulumParams,
): PendulumHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;

  const brand = readBrand();
  const stageFill = css(brand.stage);
  const bobFill = css(brand.red);
  const rodColor = css(brand.onInk, 0.6);

  // Base length of first rod, scaled to canvas
  let L1 = 1;
  let pivotX = 0;
  let pivotY = 0;

  // Masses (m1 is normalized to 1)
  const m1 = 1;

  // State — start with high energy for frequent flips and crossings
  let state: State = {
    θ1: Math.PI * 0.9,
    θ2: Math.PI * 0.85,
    ω1: 0,
    ω2: 0,
  };

  // Trail
  const trail: TrailPoint[] = [];
  let trailTimer = 0;

  function resize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale pendulum — smaller for more intricate trail patterns
    const maxExtent = Math.min(width, height) * 0.22;
    L1 = maxExtent;

    // Pivot at center of canvas
    pivotX = width / 2;
    pivotY = height / 2;

    // Clear trail on resize to avoid visual artifacts
    trail.length = 0;

    return true;
  }

  resize();

  /**
   * Computes angular accelerations using Lagrangian mechanics.
   * These equations come from the Euler-Lagrange equations for the system.
   */
  function derivatives(s: State, L2: number, m2: number): { dω1: number; dω2: number } {
    const { θ1, θ2, ω1, ω2 } = s;
    const Δθ = θ1 - θ2;
    const sinΔ = Math.sin(Δθ);
    const cosΔ = Math.cos(Δθ);

    // Denominator common to both accelerations
    const denom = 2 * m1 + m2 - m2 * Math.cos(2 * Δθ);

    // Angular acceleration of first pendulum
    const num1 =
      -G * (2 * m1 + m2) * Math.sin(θ1) -
      m2 * G * Math.sin(θ1 - 2 * θ2) -
      2 * sinΔ * m2 * (ω2 * ω2 * L2 + ω1 * ω1 * L1 * cosΔ);
    const dω1 = num1 / (L1 * denom);

    // Angular acceleration of second pendulum
    const num2 =
      2 *
      sinΔ *
      (ω1 * ω1 * L1 * (m1 + m2) +
        G * (m1 + m2) * Math.cos(θ1) +
        ω2 * ω2 * L2 * m2 * cosΔ);
    const dω2 = num2 / (L2 * denom);

    return { dω1, dω2 };
  }

  /**
   * RK4 integration step for better accuracy with chaotic systems.
   */
  function integrate(dt: number, L2: number, m2: number, damping: number): void {
    const s = state;

    // k1
    const d1 = derivatives(s, L2, m2);
    const k1 = {
      θ1: s.ω1,
      θ2: s.ω2,
      ω1: d1.dω1,
      ω2: d1.dω2,
    };

    // k2
    const s2: State = {
      θ1: s.θ1 + k1.θ1 * dt * 0.5,
      θ2: s.θ2 + k1.θ2 * dt * 0.5,
      ω1: s.ω1 + k1.ω1 * dt * 0.5,
      ω2: s.ω2 + k1.ω2 * dt * 0.5,
    };
    const d2 = derivatives(s2, L2, m2);
    const k2 = {
      θ1: s2.ω1,
      θ2: s2.ω2,
      ω1: d2.dω1,
      ω2: d2.dω2,
    };

    // k3
    const s3: State = {
      θ1: s.θ1 + k2.θ1 * dt * 0.5,
      θ2: s.θ2 + k2.θ2 * dt * 0.5,
      ω1: s.ω1 + k2.ω1 * dt * 0.5,
      ω2: s.ω2 + k2.ω2 * dt * 0.5,
    };
    const d3 = derivatives(s3, L2, m2);
    const k3 = {
      θ1: s3.ω1,
      θ2: s3.ω2,
      ω1: d3.dω1,
      ω2: d3.dω2,
    };

    // k4
    const s4: State = {
      θ1: s.θ1 + k3.θ1 * dt,
      θ2: s.θ2 + k3.θ2 * dt,
      ω1: s.ω1 + k3.ω1 * dt,
      ω2: s.ω2 + k3.ω2 * dt,
    };
    const d4 = derivatives(s4, L2, m2);
    const k4 = {
      θ1: s4.ω1,
      θ2: s4.ω2,
      ω1: d4.dω1,
      ω2: d4.dω2,
    };

    // Combine
    state = {
      θ1: s.θ1 + (dt / 6) * (k1.θ1 + 2 * k2.θ1 + 2 * k3.θ1 + k4.θ1),
      θ2: s.θ2 + (dt / 6) * (k1.θ2 + 2 * k2.θ2 + 2 * k3.θ2 + k4.θ2),
      ω1: (s.ω1 + (dt / 6) * (k1.ω1 + 2 * k2.ω1 + 2 * k3.ω1 + k4.ω1)) * damping,
      ω2: (s.ω2 + (dt / 6) * (k1.ω2 + 2 * k2.ω2 + 2 * k3.ω2 + k4.ω2)) * damping,
    };
  }

  function bobPositions(
    L2: number,
  ): { x1: number; y1: number; x2: number; y2: number } {
    const x1 = pivotX + L1 * Math.sin(state.θ1);
    const y1 = pivotY + L1 * Math.cos(state.θ1);
    const x2 = x1 + L2 * Math.sin(state.θ2);
    const y2 = y1 + L2 * Math.cos(state.θ2);
    return { x1, y1, x2, y2 };
  }

  function step(dt: number): void {
    const L2 = L1 * params.length2;
    const m2 = params.mass2;
    const damping = params.damping;

    // Substep for stability
    const substeps = 4;
    const subDt = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      integrate(subDt, L2, m2, Math.pow(damping, subDt));
    }

    // Sample trail
    trailTimer += dt;
    if (trailTimer >= TRAIL_SAMPLE_INTERVAL) {
      trailTimer = 0;
      const { x2, y2 } = bobPositions(L2);
      trail.push({ x: x2, y: y2, age: 0 });
    }

    // Age and prune trail
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i]!.age += dt;
      if (trail[i]!.age > TRAIL_MAX_AGE) {
        trail.splice(i, 1);
      }
    }
  }

  function render(): void {
    const L2 = L1 * params.length2;
    const m2 = params.mass2;

    ctx!.fillStyle = stageFill;
    ctx!.fillRect(0, 0, width, height);

    const { x1, y1, x2, y2 } = bobPositions(L2);

    // Draw trail as smooth curves with fading segments
    if (trail.length > 2) {
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      // Draw segments with varying opacity based on age
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1]!;
        const p1 = trail[i]!;
        const alpha = Math.pow(1 - p1.age / TRAIL_MAX_AGE, 1.5);

        if (alpha < 0.02) continue;

        ctx!.beginPath();
        ctx!.moveTo(p0.x, p0.y);

        // Use quadratic curve through midpoint for smoother lines
        if (i < trail.length - 1) {
          const p2 = trail[i + 1]!;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx!.quadraticCurveTo(p1.x, p1.y, midX, midY);
        } else {
          ctx!.lineTo(p1.x, p1.y);
        }

        const color = mix(brand.red, brand.ember, p1.age / TRAIL_MAX_AGE);
        ctx!.strokeStyle = css(color, alpha * 0.85);
        ctx!.lineWidth = 1.5 + alpha * 1.5;
        ctx!.stroke();
      }
    }

    // Draw rods
    ctx!.strokeStyle = rodColor;
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(pivotX, pivotY);
    ctx!.lineTo(x1, y1);
    ctx!.lineTo(x2, y2);
    ctx!.stroke();

    // Draw pivot
    ctx!.fillStyle = rodColor;
    ctx!.beginPath();
    ctx!.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx!.fill();

    // Draw bobs (size proportional to mass)
    const r1 = 10 + m1 * 4;
    const r2 = 10 + m2 * 4;

    ctx!.fillStyle = bobFill;
    ctx!.beginPath();
    ctx!.arc(x1, y1, r1, 0, Math.PI * 2);
    ctx!.fill();

    ctx!.fillStyle = css(brand.ember);
    ctx!.beginPath();
    ctx!.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx!.fill();
  }

  /* ------------------------------------------------------------- loop */

  let frame = 0;
  let last = performance.now();
  let paused = false;
  let destroyed = false;

  function tick(now: number): void {
    if (destroyed) return;

    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!paused) {
      resize();
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
    reset() {
      // Start with high energy for frequent flips and crossings
      state = {
        θ1: Math.PI * (0.85 + (Math.random() - 0.5) * 0.2),
        θ2: Math.PI * (0.8 + (Math.random() - 0.5) * 0.2),
        ω1: 0,
        ω2: 0,
      };
      trail.length = 0;
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
