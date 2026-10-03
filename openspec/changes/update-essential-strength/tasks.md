# Tasks

## 1. Rulerships Calculation Update

- [ ] 1.1 Update `src/calculations/rulerships.ts` so that positive dignities (domicile, exaltation, triplicity, term, face) award scores only when the planet itself is the ruler of that category, and verify unit tests.
- [ ] 1.2 Update `src/calculations/rulerships.ts` so that `peregrineScore` uses `-1` when `isPeregrine` is true and `0` otherwise, and verify unit tests.

## 2. Testing & Verification

- [ ] 2.1 Update and add unit tests in `src/calculations/rulerships.test.ts` to verify reference expectations (e.g. Mercury/Gemini = +8, Neptune/Capricorn = -1, Mars/Aquarius = -1, Mercury/Virgo = +9, Sun/Leo = +8, Sun/Libra = -4, Sun/Aquarius = -5, Moon/Cancer = +5, Uranus/Aquarius = +5, Neptune/Pisces = +5, Pluto/Scorpio = +5, Pluto/Aquarius = -4) and run unit tests.
- [ ] 2.2 Run full build via `npm run build` and verify successful compilation.
