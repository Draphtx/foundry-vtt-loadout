# foundry-vtt-loadouts

### 2.4.4a
- Fixed a bug with tile deletion
- Fixed nameplates settings
- Fixed bug with updating non-Loadouts tokens

### 2.4.3a
- Fixed tile sorting bug that was causing improper weight comparisons
- Fixed stacking bugs around token names
- Dialogue promise fixes for addAnyway and addRemote conditions

### 2.4.1a
- Lots of refactoring to support future extensibility & maintainability

### 2.3.6a
- Trying to figure out why configs aren't getting registered - maybe the other functionality (i.e. retrieving the system's types) isn't available at init time

### 2.3.5a
- Breaking final ties to cyberpunk
- Minor readme updates
- Trying to fix manifest compatibility issue

### 2.3.2a
- Item stacking support implemented
- BREAKING changes to item configurations and macros
- System agnosticism for core module (!!)

### 2.2.3a
- Fixed some bugs with placement after dynamic token changes
- Created compendium of weapon items pre-configured for Loadouts/CPR
- Updated the settings to only contain what is currently-supported

### 2.2.2a
- Dynamic token pre-release
- Lots of flag and minor name revisions that will break backwards compatibility

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