const testScene = game.scenes.getName("TileTest")
const gridSize = testScene.grid.size

// Test item size in grid units, not pixels
const myItemSizeX = 2
const myItemSizeY = 2
let myItemRotated = false

// Start by filtering out any tiles that couldn't contain the object regardless of other considerations
/// We'll use the grid size here, again? Seems easier to grok, by establishing this primitive 'slot' idea
const applicableTiles = game.scenes.getName("TileTest").tiles.filter(tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(myItemSizeX, myItemSizeY))

// Get an array of possible positions for the item to land
let testTile = applicableTiles[0]
var tilePositions = [];

// Process possible positions
for(let rowNum of Array(testTile.height/gridSize).keys()){
    for(let colNum of Array(testTile.width/gridSize).keys()){
        let tilePosition = {"x1": testTile.x + (colNum * gridSize), "y1": testTile.y + (rowNum * gridSize), "x2": testTile.x + (colNum * gridSize) + (myItemSizeX * gridSize), "y2": testTile.y + (rowNum * gridSize) + (myItemSizeY * gridSize)}
        if((tilePosition.x1 + (myItemSizeX * gridSize) <= testTile.x + testTile.width) && (tilePosition.y1 + (myItemSizeY * gridSize) <= testTile.y + testTile.height)){
            tilePositions.push(tilePosition)
        }
    }
}
console.log(tilePositions)

/*
// Process column positions
var rotatedTilePositions = [];
for(let colNum of Array(testTile.width/gridSize).keys()){
    console.log("processing column " + colNum)
    for(let rowNum of Array(testTile.height/(myItemSizeX*gridSize)).keys()){
        let tilePosition = {"x": testTile.x + (rowNum * gridSize), "y": testTile.y + (colNum * gridSize)}
        rotatedTilePositions.push(tilePosition)
    }
}

const positionSet = new Set(tilePositions)
//console.log(tilePositions)
//console.log(rotatedTilePositions)
console.log(positionSet)
*/

// Find any tokens that may already be over the tile's area
let blockingTokens = game.canvas.tokens.objects.children.filter(t => t.x >= testTile.x <= (testTile.x + testTile.width) && t.y >= testTile.y <=(testTile.y + testTile.height))

for(let blockingToken of blockingTokens){
    tilePositions = tilePositions.filter(p => 
        p.x1 >= Math.max(blockingToken.x + blockingToken.width, blockingToken.x + myItemSizeX * gridSize) || blockingToken.x >= p.x2 || 
        p.y1 >= Math.max(blockingToken.y + blockingToken.height, blockingToken.y + myItemSizeY * gridSize) || blockingToken.y >= p.y2
        )
}

console.log(tilePositions)
// Filter potential itemPositions by removing those that are already covered by other tokens

if(! tilePositions.length){
    ui.notifications.warn("unable to find space for token");
    return;
}

/*
for(let blockingToken of blockingTokens){
    tilePositions = tilePositions.filter(p => p.x1 >= Math.max((blockingToken.x + blockingToken.w), (blockingToken.x + myItemSizeX * gridSize)) || blockingToken.x >= p.x2 || p.y1 >= Math.max((blockingToken.y + blockingToken.height), (blockingToken.y + myItemSizeY * gridSize)) || blockingToken.y >= p.y2)
}
*/

// Choose an available slot and drop a test token
//// Someday we should sort this but in the current iteration the earlier indexes are all the 
//// furthest-upper-left, which is what I want anyway.
let dropPosition = tilePositions[0]
let itemActor = game.actors.getName("DMTest")
const itemTokenDoc = await itemActor.getTokenDocument({x: dropPosition.x1, y: dropPosition.y1, width: myItemSizeX, height: myItemSizeY})
const addedToken = await testScene.createEmbeddedDocuments("Token", [itemTokenDoc])


console.log(filteredTilePositions)