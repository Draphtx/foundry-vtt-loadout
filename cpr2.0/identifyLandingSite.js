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

  // How to rotate our token
  canvas.tokens.controlled[0].document.update({rotation: 270})

  // This is how we can create a rotated Assault Rifle that is properly scaled.
  // The scale values will always be the item width
let itemActor = game.actors.getName("Assault Rifle")
const itemTokenDoc = await itemActor.getTokenDocument({x: 0, y: 0, rotation: 90, width: 3, height: 1, texture: {scaleX: 4, scaleY: 4}})
const addedToken = await game.scenes.current.createEmbeddedDocuments("Token", [itemTokenDoc])

//
//
// Full script for looking for player tokens by ownership, applicability, and weight
const playerId = "2c3FBQlOdTjaDNp9"
const testScene = game.scenes.getName("TileTest")
const gridSize = testScene.grid.size

// Start testing using some random items
cprWeapons = ["Combat Knife", "Assault Rifle", "Grenade (Incendiary)", "Sword", "Baseball Bat", "Medium Pistol"]
randomWeapon = cprWeapons[Math.floor(Math.random()*cprWeapons.length)]
selectedWeapon = game.actors.getName(randomWeapon)

// Test item size in grid units, not pixels
let itemSizeX = selectedWeapon.prototypeToken.width
let itemSizeY = selectedWeapon.prototypeToken.height
let itemRotated = false

// Get all loadout tiles from the loadout scene
loadoutTiles = testScene.tiles.filter(tile => tile.flags.loadout)

// filter loadout tiles to those owner by the character and those large enough to accommodate the item
const applicableTiles = loadoutTiles.filter(tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(itemSizeX, itemSizeY) && tile.flags.loadout.owner == playerId)

// lambda to sort player's loadout tiles by weight (preference) 0-5, arbitrarily
const sortedTiles = applicableTiles.sort((a, b) => a.flags.loadout.weight < b.flags.loadout.weight ? -1 : 1);

console.log("Tiles that will fit item " + randomWeapon)
console.log(sortedTiles)