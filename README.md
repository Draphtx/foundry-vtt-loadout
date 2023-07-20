# foundry-vtt-loadout
## A visual loadout system for Cyberpunk Red

Current work is on a visual inventory ('loadout') system for Cyberpunk Red, which will then be ported to Adventures in Middle Earth. This should give me a good idea of the variables that need to be user-set to make a system-agnostic module. 

The idea is to give the GM a quick way to see what the party 'looks' like in-game. The worlds of Cyberpunk and, nominally, AiME place a lot of emphasis on the way that characters present to others; a heavily-armed party dressed like Rockerboys with guns strapped to every inch of their bodies would evoke a very different response than a well-dressed, low-key crew.

When items are added to a player's inventory, a token-based representation of that item is added to the loadout screen, if applicable. A basic algo identifies free spaces within a series of tiles that are assigned to the player and attempts to place the item in a preferred 'slot'.