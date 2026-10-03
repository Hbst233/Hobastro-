# Spec Delta

## Purpose

Defines precise traditional astrological rules for calculating essential strength and dignity scores for planets in zodiac signs, including correct category scoring and peregrine valuation.

## ADDED Requirements

### Requirement: Essential Dignity and Debility Scoring
The system SHALL calculate essential dignity and debility scores for planets based on traditional rulership, exaltation, triplicity, terms, faces, detriment, and fall.

#### Scenario: Planet in domicile and triplicity
- **WHEN** Mercury is calculated in Gemini
- **THEN** Domicile score is +5, Triplicity score is +3, Term and Face scores are 0, and total positive dignity score is +8.

#### Scenario: Planet in detriment or fall
- **WHEN** Sun is calculated in Libra
- **THEN** Detriment score is -5.

#### Scenario: Planet with no dignity or debility is peregrine
- **WHEN** Neptune is calculated in Capricorn
- **THEN** Peregrine status is true and peregrine score is -1.

#### Scenario: Planet with dignity is not peregrine
- **WHEN** Neptune is calculated in Pisces
- **THEN** Domicile status is true and peregrine score is 0.
