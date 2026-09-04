/**
 * Rigid-body circles under gravity, on a 2D canvas.
 *
 * Semi-implicit Euler integration, walls with restitution, and pairwise
 * collisions resolved against a uniform spatial grid so the cost stays close
 * to linear in the number of balls rather than quadratic.
 *
 * The pointer is a moving obstacle: balls inside its radius are pushed out
 * and pick up the pointer's own velocity, so you can sweep them around.
 */

import { BRAND_RAMP, css, INK, mix, TINT } from '~/lib/palette';

export interface BallsParams {
  /** Downward acceleration, px/s². */
  gravity: number;
  /** Restitution — 1 is a perfect bounce, 0 is dead. */
  bounce: number;
  /** How many balls to simulate. */
  count: number;
}

export interface BallsHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  shake(): void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Proportional to area, so big balls shove small ones. */
  mass: number;
  fill: string;
}

const MIN_RADIUS = 5;
const MAX_RADIUS = 13;
const POINTER_RADIUS = 110;
const WALL_FRICTION = 0.985;
const MAX_SPEED = 2600;
/** Collision passes per frame — more is stabler when balls pile up. */
const RELAX_PASSES = 3;

export function createBallsSim(
  canvas: HTMLCanvasElement,
  params: BallsParams,
): BallsHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;

  const balls: Ball[] = [];
  const inkFill = css(INK);

  function randomBall(): Ball {
    const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
    // Mostly brand red, with a few lighter ones to give the pile depth.
    const base = BRAND_RAMP[Math.floor(Math.random() * BRAND_RAMP.length)]!;
    const lift = Math.random() * 0.25;
    return {
      x: Math.random() * width,
      y: Math.random() * height * 0.5,
      vx: (Math.random() - 0.5) * 220,
      vy: Math.random() * 120,
      r,
      mass: r * r,
      fill: css(mix(base, TINT, lift)),
    };
  }

  function syncCount(): void {
    const target = Math.round(params.count);
    while (balls.length < target) balls.push(randomBall());
    if (balls.length > target) balls.length = target;
  }

  function resize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;

    const hadSize = width > 0;
    // Keep the pile in proportion when the viewport changes.
    const scaleX = hadSize ? nextWidth / width : 1;
    const scaleY = hadSize ? nextHeight / height : 1;

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (hadSize) {
      for (const ball of balls) {
        ball.x *= scaleX;
        ball.y *= scaleY;
      }
    }
    return true;
  }

  resize();
  syncCount();

  /* ---------------------------------------------------------- pointer */

  const pointer = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false };

  function toLocal(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerMove(event: PointerEvent): void {
    const { x, y } = toLocal(event);
    if (!pointer.active) {
      pointer.x = x;
      pointer.y = y;
    }
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  }

  function onPointerLeave(): void {
    pointer.active = false;
    pointer.vx = 0;
    pointer.vy = 0;
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);

  /* ------------------------------------------------------- collisions */

  // Rebuilt each frame; cells hold indices into `balls`.
  const cellSize = MAX_RADIUS * 2;
  let grid = new Map<number, number[]>();

  function cellKey(cx: number, cy: number): number {
    // Cantor-ish pairing, good enough for a hash key.
    return cx * 73856093 + cy * 19349663;
  }

  function buildGrid(): void {
    grid = new Map();
    for (let i = 0; i < balls.length; i += 1) {
      const ball = balls[i]!;
      const cx = Math.floor(ball.x / cellSize);
      const cy = Math.floor(ball.y / cellSize);
      const key = cellKey(cx, cy);
      const bucket = grid.get(key);
      if (bucket) bucket.push(i);
      else grid.set(key, [i]);
    }
  }

  function resolvePair(a: Ball, b: Ball, restitution: number): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distanceSq = dx * dx + dy * dy;
    const minimum = a.r + b.r;
    if (distanceSq >= minimum * minimum || distanceSq === 0) return;

    const distance = Math.sqrt(distanceSq);
    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minimum - distance;

    // Separate proportionally to mass so heavy balls barely move.
    const total = a.mass + b.mass;
    const aShare = b.mass / total;
    const bShare = a.mass / total;
    a.x -= nx * overlap * aShare;
    a.y -= ny * overlap * aShare;
    b.x += nx * overlap * bShare;
    b.y += ny * overlap * bShare;

    // Exchange only the velocity along the collision normal.
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative > 0) return;
    const impulse = (-(1 + restitution) * relative) / total;
    a.vx -= impulse * b.mass * nx;
    a.vy -= impulse * b.mass * ny;
    b.vx += impulse * a.mass * nx;
    b.vy += impulse * a.mass * ny;
  }

  function collide(restitution: number): void {
    buildGrid();

    for (let i = 0; i < balls.length; i += 1) {
      const ball = balls[i]!;
      const cx = Math.floor(ball.x / cellSize);
      const cy = Math.floor(ball.y / cellSize);

      // The 3x3 neighbourhood covers every possible overlap.
      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const bucket = grid.get(cellKey(cx + ox, cy + oy));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue; // each pair once
            resolvePair(ball, balls[j]!, restitution);
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------- step */

  function step(dt: number): void {
    const gravity = params.gravity;
    const restitution = params.bounce;

    if (pointer.active) {
      pointer.vx = (pointer.x - pointer.px) / Math.max(dt, 1 / 240);
      pointer.vy = (pointer.y - pointer.py) / Math.max(dt, 1 / 240);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
    }

    for (const ball of balls) {
      ball.vy += gravity * dt;

      if (pointer.active) {
        const dx = ball.x - pointer.x;
        const dy = ball.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_RADIUS && distance > 0.001) {
          const strength = 1 - distance / POINTER_RADIUS;
          const nx = dx / distance;
          const ny = dy / distance;
          // Push out of the cursor, and carry some of its motion.
          ball.vx += nx * strength * 1600 * dt;
          ball.vy += ny * strength * 1600 * dt;
          ball.vx += pointer.vx * strength * 0.22;
          ball.vy += pointer.vy * strength * 0.22;
        }
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > MAX_SPEED) {
        ball.vx = (ball.vx / speed) * MAX_SPEED;
        ball.vy = (ball.vy / speed) * MAX_SPEED;
      }
    }

    for (let pass = 0; pass < RELAX_PASSES; pass += 1) {
      collide(restitution);

      for (const ball of balls) {
        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx) * restitution;
        } else if (ball.x + ball.r > width) {
          ball.x = width - ball.r;
          ball.vx = -Math.abs(ball.vx) * restitution;
        }

        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy) * restitution;
        } else if (ball.y + ball.r > height) {
          ball.y = height - ball.r;
          ball.vy = -Math.abs(ball.vy) * restitution;
          ball.vx *= WALL_FRICTION;
        }
      }
    }
  }

  function render(): void {
    ctx!.fillStyle = inkFill;
    ctx!.fillRect(0, 0, width, height);

    for (const ball of balls) {
      ctx!.beginPath();
      ctx!.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx!.fillStyle = ball.fill;
      ctx!.fill();
    }
  }

  /* ------------------------------------------------------------- loop */

  let frame = 0;
  let last = performance.now();
  let paused = false;
  let destroyed = false;

  function tick(now: number): void {
    if (destroyed) return;

    // Clamp dt so a backgrounded tab cannot teleport everything.
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!paused) {
      resize();
      syncCount();
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
    shake() {
      for (const ball of balls) {
        ball.vx += (Math.random() - 0.5) * 1400;
        ball.vy -= Math.random() * 900;
      }
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
