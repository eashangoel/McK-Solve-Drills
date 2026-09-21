import type { AttributeDef, TraitDef } from './types.js';

/** Vocabulary the generator draws on. Add entries freely. */

export const ATTRIBUTES: AttributeDef[] = [
  { key: 'rigidity', label: 'Cell-wall rigidity', blurb: 'Resistance to shear in moving water.' },
  { key: 'motility', label: 'Motility', blurb: 'How far a colony spreads from its release point.' },
  { key: 'salinity', label: 'Salinity tolerance', blurb: 'Survivable range of dissolved salt.' },
  { key: 'uptake', label: 'Uptake rate', blurb: 'Speed of contaminant absorption.' },
  { key: 'thermal', label: 'Thermal range', blurb: 'Breadth of survivable water temperature.' },
  { key: 'density', label: 'Colony density', blurb: 'Cells per millilitre at steady state.' },
  { key: 'adhesion', label: 'Substrate adhesion', blurb: 'Grip on sediment and hard surfaces.' },
];

export const TRAITS: TraitDef[] = [
  { key: 'photo', label: 'Photosynthetic' },
  { key: 'spore', label: 'Spore-forming' },
  { key: 'anaerobic', label: 'Anaerobic' },
  { key: 'bioluminescent', label: 'Bioluminescent' },
  { key: 'acidophilic', label: 'Acid-tolerant' },
  { key: 'encapsulated', label: 'Encapsulated' },
];

export const SITE_THEMES: { name: string; setting: string; contaminant: string }[] = [
  { name: 'Kestrel Shoal', setting: 'a shallow tidal flat', contaminant: 'agricultural nitrate runoff' },
  { name: 'Vantor Basin', setting: 'a deep enclosed bay', contaminant: 'heavy-metal sediment' },
  { name: 'Coldwater Reach', setting: 'a cold northern estuary', contaminant: 'spilled hydrocarbons' },
  { name: 'Mirek Channel', setting: 'a fast-moving strait', contaminant: 'microplastic particulate' },
  { name: 'Saltmarsh Gate', setting: 'a brackish marsh outflow', contaminant: 'phosphate loading' },
  { name: 'Thorne Deep', setting: 'a low-oxygen trench', contaminant: 'sulphide accumulation' },
  { name: 'Alder Bight', setting: 'a sheltered river mouth', contaminant: 'pulp-mill effluent' },
];

/** Microbe name parts, combined into plausible binomials. */
const GENUS = [
  'Halomonas', 'Pseudovibrio', 'Marinobacter', 'Thalassospira', 'Oceanibacter',
  'Nitratireductor', 'Sulfitobacter', 'Glaciecola', 'Pelagibacter', 'Roseovarius',
  'Alcanivorax', 'Colwellia',
];
const SPECIES = [
  'arctica', 'litoralis', 'profunda', 'salina', 'vesiculosa', 'tenuis', 'robusta',
  'pallida', 'fulva', 'nodosa', 'gracilis', 'densa', 'mobilis', 'caerulea',
];

export function microbeNames(pick: <T>(a: readonly T[], n: number) => T[], count: number): string[] {
  const g = pick(GENUS, Math.min(count, GENUS.length));
  const s = pick(SPECIES, Math.min(count, SPECIES.length));
  return Array.from({ length: count }, (_, i) => `${g[i % g.length]} ${s[i % s.length]}`);
}
