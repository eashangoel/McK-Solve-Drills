/** Data shapes for the Sea Wolf constraint-matching module. */

export interface AttributeDef {
  key: string;
  label: string;
  /** Short explanation shown on the site brief. */
  blurb: string;
}

export interface TraitDef {
  key: string;
  label: string;
}

export interface Microbe {
  id: string;
  name: string;
  /** attribute key -> value on a 1-10 scale */
  attrs: Record<string, number>;
  /** trait key -> present */
  traits: Record<string, boolean>;
}

export interface Range {
  min: number;
  max: number;
}

export interface Site {
  id: string;
  name: string;
  setting: string;
  brief: string;
  /** The three numeric attributes this site constrains. */
  attributes: AttributeDef[];
  /** attribute key -> permitted range for the AVERAGE of the chosen trio. */
  ranges: Record<string, Range>;
  /** Every trait in play at this site. */
  traits: TraitDef[];
  /** At least one chosen microbe must carry this. */
  desirableTrait: string;
  /** No chosen microbe may carry this. */
  forbiddenTrait: string;
  candidates: Microbe[];

  /* ---- answer key ---- */
  /** Microbes that appear in at least one fully valid trio. */
  viableIds: string[];
  /** The two constraints hardest to satisfy, by enumeration. */
  bindingKeys: string[];
  /** How many of the possible trios satisfy every constraint. */
  validTrioCount: number;
  /** One worked example of a valid trio. */
  exampleTrio: string[];
}

export interface SeaWolfScenario {
  templateId: string;
  title: string;
  brief: string;
  sites: Site[];
}

export type SitePublic = Omit<Site, 'viableIds' | 'bindingKeys' | 'validTrioCount' | 'exampleTrio'>;

export interface SeaWolfScenarioPublic {
  templateId: string;
  title: string;
  brief: string;
  sites: SitePublic[];
}

export interface SiteAnswer {
  /** The two characteristics the candidate chose to prioritise. */
  priorities: string[];
  /** Microbe ids accepted into the site pool (rest were rejected). */
  accepted: string[];
  /** Narrowed prospect pool. */
  shortlist: string[];
  /** Final treatment trio. */
  trio: string[];
}

export interface SeaWolfAnswers {
  /** site id -> answer */
  sites: Record<string, SiteAnswer>;
}
