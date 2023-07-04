// Currently only working for a test scene with a single rectangular tile
// Lots of this will be refactored to support arrays returned by filters
const testScene = game.scenes.getName("TileTest")
const gridSize = testScene.grid.size

// Test item size in grid units, not pixels
let myItemSizeX = 1
let myItemSizeY = 1
let myItemRotated = false

// Start by filtering out any tiles that are too small contain the object (in either orientation) regardless of other considerations
const applicableTiles = game.scenes.getName("TileTest").tiles.filter(tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(myItemSizeX, myItemSizeY))

// TODO: Replace with iterator
let testTile = applicableTiles[0]

// Get an array of possible positions for the item to land if nothing was blocking its space
var tilePositions = [];
for(let rowNum of Array(testTile.height/gridSize).keys()){
    for(let colNum of Array(testTile.width/gridSize).keys()){
        let tilePosition = {
            "x1": testTile.x + (colNum * gridSize), "y1": testTile.y + (rowNum * gridSize), 
            "x2": testTile.x + (colNum * gridSize) + (myItemSizeX * gridSize), "y2": testTile.y + (rowNum * gridSize) + (myItemSizeY * gridSize)
        }
        if((tilePosition.x1 + (myItemSizeX * gridSize) <= testTile.x + testTile.width) && (tilePosition.y1 + (myItemSizeY * gridSize) <= testTile.y + testTile.height)){
            tilePositions.push(tilePosition)
        }
    }
}
console.log(tilePositions)

// Find any tokens that may already be over the tile's area
let blockingTokens = game.canvas.tokens.objects.children.filter(t => t.x >= testTile.x <= (testTile.x + testTile.width) && t.y >= testTile.y <=(testTile.y + testTile.height))

// Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens
// At least a few edge-cases happen here, specifically with differently-sized objects interacting. False-positives are most common.
for(let blockingToken of blockingTokens){
    tilePositions = tilePositions.filter(p => 
        p.x1 >= Math.max(blockingToken.x + blockingToken.w, blockingToken.x + myItemSizeX * gridSize) || blockingToken.x >= p.x2 || 
        p.y1 >= Math.max(blockingToken.y + blockingToken.h, blockingToken.y + myItemSizeY * gridSize) || blockingToken.y >= p.y2
        )
}
console.log(tilePositions)


if(! tilePositions.length){
    ui.notifications.warn("unable to find space for token");
    return;
}

// Choose an available slot and drop a test token
//// Someday we should sort this but in the current iteration the earlier indexes are all the 
//// furthest-upper-left, which is what I want anyway.
let dropPosition = tilePositions[0]
let itemActor = game.actors.getName("DMTest")
const itemTokenDoc = await itemActor.getTokenDocument({x: dropPosition.x1, y: dropPosition.y1, width: myItemSizeX, height: myItemSizeY})
const addedToken = await testScene.createEmbeddedDocuments("Token", [itemTokenDoc])