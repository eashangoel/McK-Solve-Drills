import type { RedrockTemplate } from '../types.js';
import { mealKits } from './mealKits.js';
import { fleetElectrification } from './fleetElectrification.js';
import { clinicCapacity } from './clinicCapacity.js';
import { subscriptionPricing } from './subscriptionPricing.js';

/** Add a new scenario by dropping a file here and appending it to this list. */
export const REDROCK_TEMPLATES: RedrockTemplate[] = [
  mealKits,
  fleetElectrification,
  clinicCapacity,
  subscriptionPricing,
];
