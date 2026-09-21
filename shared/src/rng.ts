/**
 * Deterministic seeded RNG (mulberry32). Every scenario is generated from an
 * integer seed that we persist, so any past run can be regenerated exactly.
 */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  /** float in [0,1) */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** integer in [min,max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** float in [min,max) rounded to `decimals` */
  float(min: number, max: number, decimals = 1): number {
    const v = min + this.next() * (max - min);
    const p = 10 ** decimals;
    return Math.round(v * p) / p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  /** Fisher-Yates, returns a new array */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** n distinct members */
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }
  bool(pTrue = 0.5): boolean {
    return this.next() < pTrue;
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
