# foundry-vtt-loadouts

### 2.1.10a
- Module facelift: cover and screenshots added to module manifest

### 2.1.9a
- Updated equipped overlay for better quality & visibility
- Added basic token movement hook to update item's equipped state based on landing tile when moved by a user
- TODO: Try to make this a preUpdateItem hook so that the item cannot be moved unless the checks pass?

### 2.1.8b
- Bundle artwork folder with release (needed for overlays)

### 2.1.8a
- Additional error-catching
- Improved console & ui logging
- Basic equipped item overlay

### 2.1.7a
- Support for multiple Loadouts scenes
- BREAKING: all flag references changed from `loadout` to `loadouts`

### 2.1.0a
- Work on initial module skeleton

### 2.0.2a
- Code cleanup & significant refactors
- Improved detection and filtering of all loadout-related objects
- Preparation for migration to an actual module

### 2.0.1a
- Initial working prototype; all basic functionality in place