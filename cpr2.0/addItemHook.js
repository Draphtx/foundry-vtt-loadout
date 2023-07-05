// Currently only working for a test scene with a single rectangular tile
// Currently only working for square tiles < 3 units
// Lots of this will be refactored to support arrays returned by filters
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

// Start by filtering out any tiles that are too small contain the object (in either orientation) regardless of other considerations
const applicableTiles = game.scenes.getName("TileTest").tiles.filter(tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(itemSizeX, itemSizeY))

// TODO: Replace with iterator
let testTile = applicableTiles[0]

// Get an array of possible positions for the item to land if nothing was blocking its space
function getTilePositions(itemSizeL, itemSizeH){
    for(let rowNum of Array(testTile.height/gridSize).keys()){
        for(let colNum of Array(testTile.width/gridSize).keys()){
            let tilePosition = {
                "x1": testTile.x + (colNum * gridSize), "y1": testTile.y + (rowNum * gridSize), 
                "x2": testTile.x + (colNum * gridSize) + (itemSizeL * gridSize), "y2": testTile.y + (rowNum * gridSize) + (itemSizeH * gridSize),
            }
            if((tilePosition.x1 + (itemSizeL * gridSize) <= testTile.x + testTile.width) && (tilePosition.y1 + (itemSizeH * gridSize) <= testTile.y + testTile.height)){
                tilePositions.push(tilePosition)
            }
        }
    }
    // Find any tokens that may already be over the tile's area
    let blockingTokens = game.canvas.tokens.objects.children.filter(t => t.x >= testTile.x <= (testTile.x + testTile.width) && t.y >= testTile.y <=(testTile.y + testTile.height))

    // Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens.
    // There is something going on here with the use of the myItemSize * gridSize that makes me have to do this extra step of determining 
    // which filter to use...this should be refactorable to a single filter but my brain is refusing to deal with it right now.
    for(let blockingToken of blockingTokens){
            // If the blockingToken is >= the new item, the item should use the filter but with Math.max
        if(blockingToken.w >= itemSizeL * gridSize || blockingToken.h > itemSizeH * gridSize){
            tilePositions = tilePositions.filter(p => 
                p.x1 >= Math.max(blockingToken.x + blockingToken.w, blockingToken.x + itemSizeL * gridSize) || blockingToken.x >= p.x2 || 
                p.y1 >= Math.max(blockingToken.y + blockingToken.h, blockingToken.y + itemSizeH * gridSize) || blockingToken.y >= p.y2
                )
        // If the blockingToken is < the new item, the item should use the filter but with Math.min
        } else {
            tilePositions = tilePositions.filter(p => 
                p.x1 >= Math.min(blockingToken.x + blockingToken.w, blockingToken.x + itemSizeL * gridSize) || blockingToken.x >= p.x2 || 
                p.y1 >= Math.min(blockingToken.y + blockingToken.h, blockingToken.y + itemSizeH * gridSize) || blockingToken.y >= p.y2
                )
        }
    }
    return tilePositions;
}
var tilePositions = [];
tilePositions = getTilePositions(itemSizeX, itemSizeY)

if((! tilePositions.length) && (itemSizeX != itemSizeY)){
    console.log("analyzing rotated positons")
    tilePositions = getTilePositions(itemSizeY, itemSizeX)
    if(tilePositions.length){
        itemRotated = true
    }
}

if(! tilePositions.length){
    ui.notifications.warn("unable to find space for " + selectedWeapon.prototypeToken.name + " token in (" + itemSizeX + "," + itemSizeY + ") or (" + itemSizeY + "," + itemSizeX + ")");
    return;
}

// Choose an available slot and drop a test token
//// Someday we should sort this but in the current iteration the earlier indexes are all the 
//// furthest-upper-left, which is what I want anyway.
let dropPosition = tilePositions[0]
let itemActor = game.actors.getName(selectedWeapon.prototypeToken.name)
var itemTokenDoc
console.log(itemRotated)
if(itemRotated == true){
    console.log("creating rotated token")
    itemTokenDoc = await itemActor.getTokenDocument({x: dropPosition.x1, y: dropPosition.y1, width: itemSizeY, height: itemSizeX, rotation: 90, texture: {scaleX: itemSizeY, scaleY: itemSizeY}})
} else {
    itemTokenDoc = await itemActor.getTokenDocument({x: dropPosition.x1, y: dropPosition.y1, width: itemSizeX, height: itemSizeY, texture: {scaleX: itemSizeX, scaleY: itemSizeX}})
}
const addedToken = await testScene.createEmbeddedDocuments("Token", [itemTokenDoc])