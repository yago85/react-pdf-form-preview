# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-22

### Added

- Added stronger accessibility support for interactive PDF field overlays.
- Added keyboard support for overlay actions, including `Enter`, `Space`, and `F2` for inline editing flows.
- Added `fieldLabels` for human-readable accessibility labels and overlay labels.
- Added `fieldLabelSource` with `manual-first`, `pdf-first`, `manual-only`, and `pdf-only` strategies.
- Added support for reading field labels from PDF metadata (`TU`, then `TM`) as an accessibility label source.
- Added accessibility-focused tests covering announcements, keyboard support, and label resolution behavior.

### Changed

- Improved live region announcements for active field state and filled/empty status.
- Updated overlay semantics so non-interactive highlights are hidden from assistive technology.
- Updated the demo and README to document and demonstrate accessibility label resolution behavior.
- Added ESLint setup and `npm run lint` for package validation.
- Added GitHub Actions CI to run lint, typecheck, tests, and build on push and pull requests.
- Updated dev dependencies to remove reported audit vulnerabilities.

### Fixed

- Fixed `pdf-first` label resolution so raw field IDs such as `client_name` are no longer treated as PDF metadata labels.
- Fixed test coverage around updated overlay accessibility semantics.
