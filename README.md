# Solve Trainer

A local practice harness for the three modules of McKinsey's Solve assessment:
Redrock Study, Sea Wolf, and Sustainable Futures Lab.

**These are original scenarios.** Nothing here reproduces McKinsey's questions,
data, or branding. The modules imitate the *mechanics* — data triage,
quantitative analysis under time pressure, constraint satisfaction, and
judgement with incomplete information — with numbers generated fresh on every
run so nothing is memorisable.

## Running it

```bash
npm install
npm run dev
```

The frontend is on <http://localhost:5173>, the API on <http://localhost:3001>.
`npm run dev` starts both.

## Deploying

Solve Trainer is built to run locally. The frontend can be deployed to Vercel
(`vercel.json` is included), but the backend cannot: it is an Express server
writing to a SQLite file, and Vercel's serverless runtime has no persistent
disk and no long-running process. A Vercel deployment therefore serves the UI
only, and every screen that calls `/api` will fail to load data.

To run the whole app somewhere other than your laptop you need a host with a
persistent disk, such as Railway, Fly.io or a small VPS, running `npm run dev`
or a production start command. Moving to Vercel properly would mean replacing
SQLite with a hosted database and turning the Express routes into serverless
functions.

## How your data is stored

Everything lives in `data/solvetrainer.db`, a plain SQLite file. It survives
restarts, and clearing browser storage or switching browsers does not touch it.
Back it up by copying that one file.

Schema migrations are append-only and tracked in `schema_migrations`, so an
existing database keeps its history when the app is updated.

## Scoring

Each session gets two independent 0-100 scores, mirroring the real
assessment's split.

**Product score** — correctness of what you submitted.

**Process score** — how you worked, from silently recorded telemetry. Four
components:

| Component | Weight | What it measures |
|---|---|---|
| Pacing | 35% | Time per stage against its budget, penalising both overrun and rushing |
| Decisiveness | 20% | Time from landing on a screen to the first real action |
| Revisions | 20% | How often a choice was reversed before being committed |
| Data discipline | 25% | Precision and recall of the material you pulled in |

Data discipline only applies to modules with a gathering stage; elsewhere its
weight is redistributed rather than scored as zero.

Combined score is 60% product, 40% process.

Raw events are kept in the `events` table, so the process formula can be
changed later and past sessions re-scored without losing history.

## Redrock Study

Four stages on one shared clock, in the order the real study uses.

1. **Investigation** — read the brief, then pull exhibits into a research
   journal. Four of the nine exhibits actually matter; the rest are plausible
   decoys. Only journalled exhibits are visible later, so under-collecting is
   fatal and over-collecting costs precision.
2. **Analysis** — four quantitative questions answerable only from the journal.
   Percentages, CAGR, weighted averages, break-even and payback.
3. **Report** — pick a recommendation, fill the numeric blanks, choose the
   supporting exhibit.
4. **Cases** — six independent rapid-fire questions, one exhibit each, drawn
   from eight generators. Two are served as multiple choice.

**The report cascades.** Its blanks are graded against *your own* analysis
answers, not the true ones. A figure carried through faithfully earns credit
even when the underlying analysis was wrong, so an early slip costs you once
rather than twice. The recommendation is judged the same way: right if it
follows from the number you computed.

Scoring weights within the product score: Investigation 15% (F1 of journal
precision and recall), Analysis 35%, Report 20%, Cases 30%.

There are four scenario templates, each regenerating its numbers on every run:
meal-kit market entry, fleet electrification, clinic capacity and subscription
pricing.

To add one, drop a file in `shared/src/scenarios/redrock/templates/` and append
it to that folder's `index.ts`.

## Sea Wolf

Three contaminated sites, four steps each, on one 30-minute clock.

1. **Priorities** — every constraint is visible; decide which two will actually
   bind. Graded against which two eliminate the most trios, computed by
   enumeration.
2. **Screening** — accept or reject each of twelve candidate cultures.
3. **Prospect pool** — narrow the accepted set to six.
4. **Treatment** — commit three. The working tray shows raw attribute values
   beside the target bands but computes no averages. Working them out is the
   skill.

**Scoring matches the real module.** Each site has exactly five constraints:
three attribute averages that must land inside their bands, one trait at least
one culture must carry, and one trait none may carry. A site scores 100 with
all five met and loses 20 per miss. The session's product score is the mean of
the three sites.

Screening quality does not touch the product score. Its precision and recall
feed the process score's data-discipline component, the same way Redrock's
exhibit triage does.

**Every site is guaranteed solvable.** The generator plants a valid trio first
and builds the tolerance bands around it, then enumerates all 220 possible
trios to tune difficulty. Across 450 generated sites the count of valid trios
ranged from 3 to 34, and a valid trio always fitted inside a six-culture
shortlist, so careful screening is always rewarded rather than punished by
luck.

## Sustainable Futures Lab

Thirteen decisions in 20 minutes, no arithmetic. You join a restoration
programme already under way and inherit a live problem.

The first task is a drag-to-rank prioritisation, matching the real module's
opening. The remaining twelve are multiple choice and move through three
phases: orientation, complications, then decisions under time pressure.

**Options carry graded points rather than being right or wrong.** Each question
has four options worth 100, 60, 25 and 0. The strongest is usually the one that
is proportionate to the evidence, transparent with the people affected, and
still decisive. Plausible-but-flawed choices earn real partial credit, so the
score separates good judgement from merely avoiding disasters.

The ranking is scored by displacement from the ideal order, weighted so
misplacing the top priority costs more than misordering the tail. A perfect
order scores 100, swapping the top two scores 81, and a full reversal scores
25.

There are 18 question templates across the three phases and three ranking
tasks. Every run fills detail slots — site, ecosystem, people, sponsor,
deadline, contaminant — from pools, so a repeated template does not read
identically.

The review afterwards shows your choice and the strongest option side by side
with the reasoning for each, plus your ranking against the ideal with an
explanation for every position.

To add a question, append it to the matching file in
`shared/src/scenarios/sfl/templates/`. Each needs exactly four options, one per
tier, each with a rationale.

## Layout

```
shared/     Types, config constants, seeded RNG, scenario generators + graders
server/     Express API, SQLite, scoring pipeline
client/     React + Vite UI
data/       The SQLite file
```

Scenario generation and grading are pure functions in `shared/src/scenarios/`
and know nothing about React. Adding a scenario template means adding one file
there; the server and UI need no changes.

## Adding a scenario template

Each game directory exports a `GameModule` with three required functions:
`generate` (seed in, scenario out, deterministic), `grade` (scenario + answers
in, score out), and `redact` (strips the answer key before the scenario reaches
the browser). An optional `augmentStages` fills in telemetry that depends on
the answer key, such as journal precision, which the browser cannot compute.

For a new Redrock scenario, add one file under
`shared/src/scenarios/redrock/templates/` exporting a `RedrockTemplate`, then
append it to the list in that folder's `index.ts`. Nothing else changes: the
server, the UI and the scoring pipeline pick it up automatically.

Every answer must be computed from the generated numbers rather than written by
hand, so a scenario cannot drift out of sync with its own answer key.

## Configuring timers

Settings page. Budgets are stored in the database and drive both the on-screen
clock and the pacing component of the process score. Defaults match the real
modules' published lengths: Redrock 35 minutes, Sea Wolf 30, Futures Lab 20.
