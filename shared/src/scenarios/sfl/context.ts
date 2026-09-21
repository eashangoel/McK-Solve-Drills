import type { Rng } from '../../rng.js';
import type { SflContext } from './types.js';

const SITES = ['Thornmere', 'Halloway Flats', 'Blackwater Fen', 'Corrin Estuary', 'Aldergrove Marsh', 'Sable Point', 'Wrenwick Basin'];
const ECOSYSTEMS = ['tidal salt marsh', 'peat bog', 'river floodplain', 'mangrove fringe', 'seagrass meadow', 'coastal dune system'];
const PEOPLE = ['Priya Raman', 'Tomas Eckhart', 'Ada Nkemelu', 'Joon-ho Park', 'Mira Castellan', 'Devin Oyelaran', 'Sofia Brandt', 'Rafael Ibarra', 'Noor Haddad', 'Kit Ferreira'];
const ORGS = ['the Vandermeer Trust', 'the regional water authority', 'the Calloway Foundation', 'the coastal council', 'the national parks agency'];
const PARTNER_ORGS = ['a local fishing cooperative', 'a university field station', 'a community land trust', 'a volunteer monitoring network', 'an Indigenous stewardship council'];
const CONTAMINANTS = ['nitrate runoff', 'legacy pesticide residue', 'road-salt intrusion', 'sediment loading', 'microplastic accumulation'];
const SEASONS = ['the spring melt', 'the autumn storm season', 'the summer low-flow period', 'the winter migration window'];
const PRESSURES = ['a 15% budget reduction announced mid-project', 'a hiring freeze across the programme', 'a funder requesting quarterly rather than annual reporting', 'an unexpected equipment replacement cost'];

export function buildContext(rng: Rng): SflContext {
  const people = rng.sample(PEOPLE, 3);
  return {
    site: rng.pick(SITES),
    ecosystem: rng.pick(ECOSYSTEMS),
    sponsor: people[0],
    sponsorOrg: rng.pick(ORGS),
    lead: people[1],
    analyst: people[2],
    partner: rng.pick(PEOPLE),
    partnerOrg: rng.pick(PARTNER_ORGS),
    deadlineWeeks: rng.int(4, 11),
    daysLeft: rng.int(6, 19),
    budgetPressure: rng.pick(PRESSURES),
    contaminant: rng.pick(CONTAMINANTS),
    season: rng.pick(SEASONS),
  };
}

/** Replaces {{slot}} markers with values from the run's context. */
export function fill(text: string, ctx: SflContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = (ctx as unknown as Record<string, unknown>)[key];
    return v == null ? `{{${key}}}` : String(v);
  });
}
