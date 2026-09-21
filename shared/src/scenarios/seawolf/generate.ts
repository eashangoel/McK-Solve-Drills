import type { Rng } from '../../rng.js';
import { SEAWOLF } from '../../config.js';
import { ATTRIBUTES, TRAITS, SITE_THEMES, microbeNames } from './data.js';
import type { Microbe, Range, Site, SeaWolfScenario, SeaWolfScenarioPublic, SitePublic } from './types.js';

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Every 3-element combination of indices. C(12,3) = 220, so enumeration is free. */
function trios(n: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < n - 2; i++)
    for (let j = i + 1; j < n - 1; j++)
      for (let k = j + 1; k < n; k++) out.push([i, j, k]);
  return out;
}

function avgAttr(ms: Microbe[], key: string): number {
  return ms.reduce((s, m) => s + m.attrs[key], 0) / ms.length;
}

function inRange(v: number, r: Range): boolean {
  // Averages are compared at one decimal place, matching what the UI shows.
  return round1(v) >= r.min - 1e-9 && round1(v) <= r.max + 1e-9;
}

/** The five constraints, evaluated independently so misses can be counted. */
export function evaluateTrio(
  site: { attributes: { key: string }[]; ranges: Record<string, Range>; desirableTrait: string; forbiddenTrait: string },
  chosen: Microbe[],
): { key: string; label: string; met: boolean; detail: string }[] {
  const checks = site.attributes.map((a) => {
    const avg = avgAttr(chosen, a.key);
    const r = site.ranges[a.key];
    return {
      key: a.key,
      label: a.key,
      met: chosen.length === SEAWOLF.finalTeam && inRange(avg, r),
      detail: `average ${round1(avg)} against ${r.min}–${r.max}`,
    };
  });

  const hasDesirable = chosen.some((m) => m.traits[site.desirableTrait]);
  const hasForbidden = chosen.some((m) => m.traits[site.forbiddenTrait]);

  return [
    ...checks,
    {
      key: `trait:${site.desirableTrait}`,
      label: site.desirableTrait,
      met: chosen.length === SEAWOLF.finalTeam && hasDesirable,
      detail: hasDesirable ? 'present in the trio' : 'absent from the trio',
    },
    {
      key: `trait:${site.forbiddenTrait}`,
      label: site.forbiddenTrait,
      met: chosen.length === SEAWOLF.finalTeam && !hasForbidden,
      detail: hasForbidden ? 'present, which disqualifies the trio' : 'correctly excluded',
    },
  ];
}

function buildSite(rng: Rng, index: number, theme: (typeof SITE_THEMES)[number]): Site {
  const attributes = rng.sample(ATTRIBUTES, 3);
  const traitPool = rng.sample(TRAITS, 4);
  const names = microbeNames((a, n) => rng.sample(a, n), SEAWOLF.candidates);

  const candidates: Microbe[] = names.map((name, i) => ({
    id: `s${index}-m${i}`,
    name,
    attrs: Object.fromEntries(attributes.map((a) => [a.key, rng.int(1, 10)])),
    traits: Object.fromEntries(traitPool.map((t) => [t.key, rng.bool(0.4)])),
  }));

  // Plant a guaranteed-valid trio, then build the site's requirements around it.
  const plantedIdx = rng.sample([...candidates.keys()], SEAWOLF.finalTeam);
  const planted = plantedIdx.map((i) => candidates[i]);

  // Desirable trait: one the planted trio actually carries.
  let desirable = traitPool.find((t) => planted.some((m) => m.traits[t.key]))?.key;
  if (!desirable) {
    desirable = rng.pick(traitPool).key;
    planted[0].traits[desirable] = true;
  }

  // Forbidden trait: one no planted member carries.
  const forbiddenOptions = traitPool.filter(
    (t) => t.key !== desirable && !planted.some((m) => m.traits[t.key]),
  );
  let forbidden: string;
  if (forbiddenOptions.length) {
    forbidden = rng.pick(forbiddenOptions).key;
  } else {
    forbidden = rng.pick(traitPool.filter((t) => t.key !== desirable)).key;
    for (const m of planted) m.traits[forbidden] = false;
  }

  // Ranges centred on the planted trio's averages. Width is tuned below so the
  // puzzle is neither trivial nor a needle in a haystack.
  const combos = trios(candidates.length);
  const buildRanges = (halfWidth: number): Record<string, Range> =>
    Object.fromEntries(
      attributes.map((a) => {
        const centre = avgAttr(planted, a.key);
        return [
          a.key,
          {
            min: round1(Math.max(1, centre - halfWidth)),
            max: round1(Math.min(10, centre + halfWidth)),
          },
        ];
      }),
    );

  const countValid = (ranges: Record<string, Range>) => {
    const site = { attributes, ranges, desirableTrait: desirable!, forbiddenTrait: forbidden };
    return combos.filter((c) =>
      evaluateTrio(site, c.map((i) => candidates[i])).every((x) => x.met),
    ).length;
  };

  let halfWidth = rng.float(0.7, 1.3, 2);
  let ranges = buildRanges(halfWidth);
  let valid = countValid(ranges);

  // Target roughly 3-35 valid trios out of 220.
  for (let attempt = 0; attempt < 14; attempt++) {
    if (valid >= 3 && valid <= 35) break;
    halfWidth = valid > 35 ? Math.max(0.25, halfWidth - 0.18) : Math.min(3.2, halfWidth + 0.22);
    ranges = buildRanges(halfWidth);
    valid = countValid(ranges);
  }

  const siteCore = { attributes, ranges, desirableTrait: desirable, forbiddenTrait: forbidden };

  const validCombos = combos.filter((c) =>
    evaluateTrio(siteCore, c.map((i) => candidates[i])).every((x) => x.met),
  );
  const viable = new Set<string>();
  for (const c of validCombos) for (const i of c) viable.add(candidates[i].id);

  // Binding constraints: the two that eliminate the most trios on their own.
  const passCounts = [
    ...attributes.map((a) => ({
      key: a.key,
      passes: combos.filter((c) => inRange(avgAttr(c.map((i) => candidates[i]), a.key), ranges[a.key])).length,
    })),
    {
      key: `trait:${desirable}`,
      passes: combos.filter((c) => c.some((i) => candidates[i].traits[desirable!])).length,
    },
    {
      key: `trait:${forbidden}`,
      passes: combos.filter((c) => !c.some((i) => candidates[i].traits[forbidden])).length,
    },
  ];
  const binding = [...passCounts].sort((a, b) => a.passes - b.passes).slice(0, 2).map((x) => x.key);

  return {
    id: `site-${index}`,
    name: theme.name,
    setting: theme.setting,
    brief: `${theme.name} is ${theme.setting} carrying ${theme.contaminant}. Select a treatment trio whose averaged profile sits inside every tolerance band. One organism must carry the required trait, and none may carry the disqualifying one.`,
    attributes,
    ranges,
    traits: traitPool,
    desirableTrait: desirable,
    forbiddenTrait: forbidden,
    candidates,
    viableIds: [...viable],
    bindingKeys: binding,
    validTrioCount: validCombos.length,
    exampleTrio: validCombos.length
      ? validCombos[0].map((i) => candidates[i].id)
      : [],
  };
}

export function generateSeaWolf(rng: Rng): { templateId: string; scenario: SeaWolfScenario } {
  const themes = rng.sample(SITE_THEMES, SEAWOLF.sitesPerSession);
  const sites = themes.map((t, i) => buildSite(rng, i, t));

  return {
    templateId: `seawolf-${themes.map((t) => t.name.split(' ')[0].toLowerCase()).join('-')}`,
    scenario: {
      templateId: 'seawolf',
      title: 'Coastal remediation programme',
      brief: `Three contaminated sites need treatment. For each, screen the candidate cultures, narrow them to a prospect pool, and commit a trio whose averaged profile satisfies every tolerance the site sets.`,
      sites,
    },
  };
}

/** Strips the answer key before the scenario reaches the browser. */
export function redactSeaWolf(s: SeaWolfScenario): SeaWolfScenarioPublic {
  return {
    templateId: s.templateId,
    title: s.title,
    brief: s.brief,
    sites: s.sites.map((site): SitePublic => {
      const { viableIds, bindingKeys, validTrioCount, exampleTrio, ...rest } = site;
      return rest;
    }),
  };
}
