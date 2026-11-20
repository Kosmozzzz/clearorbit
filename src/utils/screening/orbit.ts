/**
 * Circular-orbit mechanics used by the conjunction screener, the deorbit planner and the clean-up planner.
 * Units: kilometres, seconds, radians (degrees only at the edges, where people type them).
 */

/** Earth's gravitational parameter, km³/s² (WGS-84). */
export const MU = 398600.4418
/** Earth's equatorial radius, km (WGS-84). */
export const R_EARTH = 6378.137

export const DEG = Math.PI / 180

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** One object on a circular orbit. Angles in radians; `u0` is the argument of latitude at t = 0. */
export interface CircularOrbit {
  id: number
  /** Altitude above the equatorial radius, km. */
  alt: number
  inc: number
  raan: number
  u0: number
}

export function radiusOf(alt: number): number {
  return R_EARTH + alt
}

/** Speed on a circular orbit, km/s. */
export function circularSpeed(alt: number): number {
  return Math.sqrt(MU / radiusOf(alt))
}

/** Orbital period, s. */
export function period(alt: number): number {
  const r = radiusOf(alt)
  return 2 * Math.PI * Math.sqrt((r * r * r) / MU)
}

/** Mean motion, rad/s. */
export function meanMotion(alt: number): number {
  const r = radiusOf(alt)
  return Math.sqrt(MU / (r * r * r))
}

/**
 * Position and velocity in the Earth-centred inertial frame at time t (s).
 * Two-body motion only: over a screening window of one or two orbits, J2 and drag move objects by far less than the
 * distances compared here (see the limitations in the research plan).
 */
export function stateAt(o: CircularOrbit, t: number, out: { r: Vec3; v: Vec3 }): void {
  const r = radiusOf(o.alt)
  const n = meanMotion(o.alt)
  const u = o.u0 + n * t
  const cu = Math.cos(u)
  const su = Math.sin(u)
  const cO = Math.cos(o.raan)
  const sO = Math.sin(o.raan)
  const ci = Math.cos(o.inc)
  const si = Math.sin(o.inc)
  out.r.x = r * (cO * cu - sO * su * ci)
  out.r.y = r * (sO * cu + cO * su * ci)
  out.r.z = r * su * si
  const s = r * n
  out.v.x = s * (-cO * su - sO * cu * ci)
  out.v.y = s * (-sO * su + cO * cu * ci)
  out.v.z = s * cu * si
}

/** Angle between two orbital planes, radians (spherical law of cosines on the orbit normals). */
export function planeAngle(inc1: number, raan1: number, inc2: number, raan2: number): number {
  const c = Math.cos(inc1) * Math.cos(inc2) + Math.sin(inc1) * Math.sin(inc2) * Math.cos(raan1 - raan2)
  return Math.acos(Math.min(1, Math.max(-1, c)))
}

/** Total Δv (km/s) of a two-burn Hohmann transfer between circular orbits. */
export function hohmannDv(alt1: number, alt2: number): number {
  const r1 = radiusOf(alt1)
  const r2 = radiusOf(alt2)
  if (r1 === r2) return 0
  const a = (r1 + r2) / 2
  const dv1 = Math.abs(Math.sqrt(MU * (2 / r1 - 1 / a)) - Math.sqrt(MU / r1))
  const dv2 = Math.abs(Math.sqrt(MU / r2) - Math.sqrt(MU * (2 / r2 - 1 / a)))
  return dv1 + dv2
}

/** Δv (km/s) to turn a circular orbit's plane by `angle` radians at speed v: 2·v·sin(θ/2). */
export function planeChangeDv(alt: number, angle: number): number {
  return 2 * circularSpeed(alt) * Math.sin(angle / 2)
}

/** Single retro burn from a circular orbit that drops the perigee to `perigeeAlt` (km/s). */
export function deorbitBurnDv(alt: number, perigeeAlt: number): number {
  const r1 = radiusOf(alt)
  const rp = radiusOf(perigeeAlt)
  if (rp >= r1) return 0
  const vCirc = Math.sqrt(MU / r1)
  const vApo = Math.sqrt((2 * MU * rp) / (r1 * (r1 + rp)))
  return vCirc - vApo
}

/** Standard gravity, m/s², for the rocket equation. */
export const G0 = 9.80665

/** Propellant mass (kg) needed for a Δv (km/s) by a spacecraft of wet mass m0 (kg) with specific impulse isp (s). */
export function propellantMass(m0: number, dvKms: number, isp: number): number {
  return m0 * (1 - Math.exp((-dvKms * 1000) / (isp * G0)))
}
