# Design

## Context

- See proposal.md for motivation.
- Current implementation in `src/calculations/rulerships.ts` computes positive dignity scores whenever a category is active or participating, and sets `peregrineScore = isPeregrine ? -5 : 0`.

## Goals / Non-Goals

**Goals:**
- Implement unified scoring rules where positive essential dignities (+5, +4, +3, +2, +1) are awarded exclusively when the planet itself rules the category.
- Set peregrine score to `-1` when `isPeregrine` is true.
- Maintain existing negative scores for own detriment (`-5`) and own fall (`-4`).

**Non-Goals:**
- Modify any aspects, house systems, Swiss Ephemeris calculations, or other engine files.

## Decisions

- **Decision 1**: Restrict positive scores to direct rulership match (`planetId === categoryRuler`).
  - *Rationale*: Aligns with traditional rules where a planet only gains dignity points from being the ruler of the sign, exaltation, triplicity, term, or face.
- **Decision 2**: Update peregrine penalty from `-5` to `-1`.
  - *Rationale*: Corrects traditional weighting for peregrine planets.

## Risks / Trade-offs

- [Score changes for charts with peregrine or non-ruling triplicity/terms] → Mitigation: Comprehensive unit tests in `rulerships.test.ts`.
