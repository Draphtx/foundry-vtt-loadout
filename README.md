# foundry-vtt-loadouts
## A Loadouts system for Cyberpunk Red
Loadouts allows the GM to create visual Loadouts of any variety and style that are updated by and interact with the character's normal inventory actions.

The goal of Loadouts is to allow GMs and players to better visualize their character's weaponry, dress, and other visual elements that normally go unchecked in VTT games but which may provide a great deal of additional character and narrative development opportunities.

## Additional context
Current work is on a visual inventory ('loadout') system for Cyberpunk Red, which will then be ported to Adventures in Middle Earth (5e system). This should give me a good idea of the scope necessary to make a system-agnostic module.

The idea is to give the GM a quick way to see what the party 'looks' like in-game. The worlds of Cyberpunk and, nominally, AiME place a lot of emphasis on the way that characters present to others; a heavily-armed party dressed like Rockerboys with guns strapped to every inch of their bodies would evoke a very different response than a well-dressed, low-key crew. Yet without any visual cues, it is easy for both players and GMs to overlook the visual 'state' of a character.

## How it works
When applicable items (CPR weapons & grenades, currently) are added to a player's inventory, a token-based representation of that item is added to a dedicated Loadouts Foundry scene. This scene contains Loadouts tiles that can be assigned different properties, including player ownership.

A basic algo identifies free spaces within a series of tiles that are assigned to the player and attempts to place a token representing the item into a preferred 'slot'. As the player's slots fill up, items will be placed in ever-less-desirable locations, with the result that eventually a player must run out of physical carrying space.

## Features
- When a weapon is added to a player's inventory, a token representing that weapon is automatically slotted into their Loadouts slots (tiles)
- When a player fires a weapon or otherwise changes its equip state or magazine count, these changes are reflected in the linked tokens
- When a player drags a token into a different space in their Loadout, the represented item's equip state is changed to match
- If a player deletes a weapon from their inventory, the linked token is deleted from their Loadout.

## Basic usage
_As this is in an alpha stage and many customization elements are still in development, these directions may change quickly._

1. Create a scene to use for your Loadouts (in the future the module will include a test scene) and populate it with tiles representing the characters' 'slots.'
2. Use the included macro `setLoadoutsScene` to flag the current scene as a Loadouts scene.
3. Select one or more tiles and use the included macro `setLoadoutsTiles` to configure them as Loadouts tiles.

Like it? Love it?
https://www.buymeacoffee.com/draphtx