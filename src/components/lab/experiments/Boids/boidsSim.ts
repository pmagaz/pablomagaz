/**
 * Boids flocking simulation on a 2D canvas.
 *
 * Implements Craig Reynolds' three rules for emergent flocking behavior:
 * 1. Separation: steer to avoid crowding local flockmates
 * 2. Alignment: steer towards the average heading of local flockmates
 * 3. Cohesion: steer to move toward the average position of local flockmates
 *
 * The cursor acts as a predator that boids flee from.
 */

import { css, mix, readBrand } from '~/lib/palette';

export interface BoidsParams {
  /** Number of boids in the flock. */
  count: number;
  /** Separation force weight. */
  separation: number;
  /** Alignment force weight. */
  alignment: number;
  /** Cohesion force weight. */
  cohesion: number;
}

export interface BoidsHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  scatter(): void;
}

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const MAX_SPEED = 200;
const MAX_FORCE = 800;
const PERCEPTION_RADIUS = 60;
const SEPARATION_RADIUS = 25;
const PREDATOR_RADIUS = 120;
const PREDATOR_FORCE = 400;

export function createBoidsSim(
  canvas: HTMLCanvasElement,
  params: BoidsParams,
): BoidsHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;

  const brand = readBrand();
  const stageFill = css(brand.stage);

  const boids: Boid[] = [];

  function randomBoid(): Boid {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  }

  function syncCount(): void {
    const target = Math.round(params.count);
    while (boids.length < target) boids.push(randomBoid());
    if (boids.length > target) boids.length = target;
  }

  function resize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;

    const hadSize = width > 0;
    const scaleX = hadSize ? nextWidth / width : 1;
    const scaleY = hadSize ? nextHeight / height : 1;

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (hadSize) {
      for (const boid of boids) {
        boid.x *= scaleX;
        boid.y *= scaleY;
      }
    }
    return true;
  }

  resize();
  syncCount();

  /* ---------------------------------------------------------- pointer */

  const pointer = { x: 0, y: 0, active: false };

  function toLocal(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerMove(event: PointerEvent): void {
    const { x, y } = toLocal(event);
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  }

  function onPointerLeave(): void {
    pointer.active = false;
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);

  /* ---------------------------------------------------------- flocking */

  function limit(vx: number, vy: number, max: number): { vx: number; vy: number } {
    const mag = Math.hypot(vx, vy);
    if (mag > max && mag > 0) {
      return { vx: (vx / mag) * max, vy: (vy / mag) * max };
    }
    return { vx, vy };
  }

  function step(dt: number): void {
    syncCount();

    const sepWeight = params.separation;
    const aliWeight = params.alignment;
    const cohWeight = params.cohesion;

    for (const boid of boids) {
      let sepX = 0, sepY = 0, sepCount = 0;
      let aliX = 0, aliY = 0, aliCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (const other of boids) {
        if (other === boid) continue;

        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const dist = Math.hypot(dx, dy);

        if (dist < SEPARATION_RADIUS && dist > 0) {
          sepX -= dx / dist;
          sepY -= dy / dist;
          sepCount++;
        }

        if (dist < PERCEPTION_RADIUS) {
          aliX += other.vx;
          aliY += other.vy;
          aliCount++;

          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      let ax = 0, ay = 0;

      // Separation
      if (sepCount > 0) {
        sepX /= sepCount;
        sepY /= sepCount;
        const mag = Math.hypot(sepX, sepY);
        if (mag > 0) {
          ax += (sepX / mag) * MAX_FORCE * sepWeight;
          ay += (sepY / mag) * MAX_FORCE * sepWeight;
        }
      }

      // Alignment
      if (aliCount > 0) {
        aliX /= aliCount;
        aliY /= aliCount;
        const desiredVx = aliX - boid.vx;
        const desiredVy = aliY - boid.vy;
        const limited = limit(desiredVx, desiredVy, MAX_FORCE * aliWeight);
        ax += limited.vx;
        ay += limited.vy;
      }

      // Cohesion
      if (cohCount > 0) {
        cohX /= cohCount;
        cohY /= cohCount;
        const desiredVx = cohX - boid.x;
        const desiredVy = cohY - boid.y;
        const mag = Math.hypot(desiredVx, desiredVy);
        if (mag > 0) {
          ax += (desiredVx / mag) * MAX_FORCE * cohWeight * 0.5;
          ay += (desiredVy / mag) * MAX_FORCE * cohWeight * 0.5;
        }
      }

      // Flee from predator (cursor)
      if (pointer.active) {
        const dx = boid.x - pointer.x;
        const dy = boid.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < PREDATOR_RADIUS && dist > 0) {
          const strength = 1 - dist / PREDATOR_RADIUS;
          ax += (dx / dist) * PREDATOR_FORCE * strength;
          ay += (dy / dist) * PREDATOR_FORCE * strength;
        }
      }

      // Apply acceleration
      boid.vx += ax * dt;
      boid.vy += ay * dt;

      // Limit speed
      const limited = limit(boid.vx, boid.vy, MAX_SPEED);
      boid.vx = limited.vx;
      boid.vy = limited.vy;

      // Update position
      boid.x += boid.vx * dt;
      boid.y += boid.vy * dt;

      // Wrap around edges
      if (boid.x < 0) boid.x += width;
      if (boid.x > width) boid.x -= width;
      if (boid.y < 0) boid.y += height;
      if (boid.y > height) boid.y -= height;
    }
  }

  function render(): void {
    ctx!.fillStyle = stageFill;
    ctx!.fillRect(0, 0, width, height);

    for (const boid of boids) {
      const angle = Math.atan2(boid.vy, boid.vx);
      const speed = Math.hypot(boid.vx, boid.vy);
      const t = Math.min(speed / MAX_SPEED, 1);

      // Color based on speed
      const color = mix(brand.ember, brand.red, t);

      ctx!.save();
      ctx!.translate(boid.x, boid.y);
      ctx!.rotate(angle);

      // Draw triangle boid
      const size = 6;
      ctx!.beginPath();
      ctx!.moveTo(size * 1.5, 0);
      ctx!.lineTo(-size, -size * 0.6);
      ctx!.lineTo(-size, size * 0.6);
      ctx!.closePath();
      ctx!.fillStyle = css(color, 0.9);
      ctx!.fill();

      ctx!.restore();
    }
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
    scatter() {
      for (const boid of boids) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 100;
        boid.vx = Math.cos(angle) * speed;
        boid.vy = Math.sin(angle) * speed;
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
