# foundry-vtt-macros
## A series of macros for 5e, Cyberpunk Red, and Adventures in Middle Earth

Current work is on a visual inventory ('loadout') system for Cyberpunk Red, which will then be ported to Adventures in Middle Earth. This should give me a good idea of the variables that need to be user-set to make a system-agnostic module. 

The idea is to give the GM a quick way to see what the party 'looks' like in-game. The worlds of Cyberpunk and, nominally, AiME place a lot of emphasis on the way that characters present to others; a heavily-armed party dressed like Rockerboys with guns strapped to every inch of their bodies would evoke a very different response than a well-dressed, low-key crew.

By using [Monk's Active Tiles](https://foundryvtt.com/packages/monks-active-tiles), a loadout screen can be arranged with the included macros triggered the creation or movement of tokens that represent various item types.

When a player places such a *token* onto their loadout screen, the corresponding in-game *item* is added to their inventory, and the two are linked by the token's id. This allows for differentiation between multiple items of the same type.

See the README.md in the individual game system/loadout folders for additional information.

Test commit