# Proposal

## Why

The calculation of essential strength and dignity scores in `rulerships.ts` currently assigns a score of `-5` for peregrine planets and incorrectly handles scoring for categories where the planet is not the ruler (e.g. assigning positive scores for triplicity, terms, or faces when the planet is not the ruler). This update aligns the scoring mechanism precisely with traditional astrological rules: positive scores apply only when the planet rules the category, and peregrine status awards a `-1` penalty instead of `-5`.

## What Changes

- **Modify `essentialStrength` calculation logic in `src/calculations/rulerships.ts`**:
  - Update positive dignity scoring so that points are awarded only if the planet itself is the ruler of the respective category (`domicile`, `exaltation`, `triplicity`, `term`, `face`). If another planet rules, the category score is `0`.
  - Update `peregrineScore` calculation: `peregrineScore = isPeregrine ? -1 : 0`.
  - Update `isPeregrine` definition: a planet is peregrine if it has no essential dignity and no debility (`hasDignity && !hasDebility`).

## Capabilities

### New Capabilities
- `essential-strength`: Updated calculation rules for essential dignities, debilities, and peregrine status in astrological calculations.

### Modified Capabilities
- None.

## Impact

- Affected code: `src/calculations/rulerships.ts` and unit tests in `src/calculations/rulerships.test.ts`.
- No impact on Swiss Ephemeris binaries, `astroEngine.ts`, `aspectEngine.ts`, or chart generation data structures other than the returned essential strength scores.
