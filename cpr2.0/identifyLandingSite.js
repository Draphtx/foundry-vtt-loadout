/* 
What we want to do here is:
 - get the scene's grid size
 - determine how big the itemActor is in grid terms
 - find a player's available inventory slots in the loadout scene
   - filter those slot tiles by size; i.e. if the entire tile can't hold the itemActor's x:y, then don't bother searching***
 - figure out what objects are already inside of those tiles based on x:y coords
   - figure out what is left, and whether there is room for the new item
   - also, slot tiles should probably be weighted somehow, so the item is most-likey to end up in the most-desirable slot; i.e. equip (read: holster) if possible, 
     and if not put on back possible, and if not put in bag if possile, and if not put in stash if possible...and if not, show an error and throw a dialog to add the item without an accompanying token
 - based on the preference weight of the applicable tiles, pick the most-desirable slot for the itemActor
   - **** THIS IS THE PART THAT I NEED THE MOST HELP WITH: A GOOD WAY TO MAKE A SHORTLIST OF COORDINATES THAT WILL FIT THE ITEMACTOR
 - find the upper-left x:y of the available tile slot
 - ???
 - profit

*** we can also use this to throw an error - by getting this information before the item is actually created in the sheet, we can basically say, "Naw dawg, shit's full."
    We could also look at ways to give the 'luggage' inventories an 'equipped' status (maybe just make items for duffle, briefcase etc that the players can equip?) so that things 
    get dumped in there appropriately
 */



 // SNIPPETS //

// Find token locations within a tile's coordinates
 game.canvas.tokens.objects.children.filter(t => t.x > 500 && t.x < 800)

  // We will use flags to store tile names, weights, and owners
  canvas.tiles.controlled[0].document.update({"flags.loadout": {"owner": "2c3FBQlOdTjaDNp9", "weight": 0, "state": "equipped"}})