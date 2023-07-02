# Loadouts 2.0

The idea here is that we use hooks only, and actually load up inventory slots based on the tile 'slots' available to a given actor when they drag items into their inventories.

The most-desirable slots will be chosen first: i.e. if an added item can find an 'equipped' slot it will; if not it will try for a 'carried' slot; if that is unavailable it will be added to their stash; and if that is unavailable it will throw an error and not be added to the player's sheet at all.