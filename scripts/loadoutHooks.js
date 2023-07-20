// CREATE ITEM HOOK
//// Responsible for adding items to a character's loadout when (applicable) items are added to the 
//// character's inventory in the character sheet.
Hooks.on("createItem", (document, options, userid) => addLoadoutItem(document));

// Verifies that the item is something that we want to handle in the loadout system
function verifyItemSuitability(itemDocument){
    // Do not try to handle item management for NPCs
    if(itemDocument.parent.type != "character"){
        return false;
    }

    // Only handle weapons and, by extension, grenades
    if((! itemDocument.type == "weapon") && (! itemDocument.type == "ammo")){
        return false;
    } else if(itemDocument.type == "ammo"){
        itemIsGrenade = [
            "Grenade (Armor Piercing)",
            "Grenade (Biotoxin)",
            "Grenade (EMP)",
            "Grenade (Flashbang)",
            "Grenade (Incendiary)",
            "Grenade (Poison)",
            "Grenade (Sleep)",
            "Grenade (Smoke)",
            "Grenade (Teargas)"
        ].includes(itemDocument.name)
        if(! itemIsGrenade){
            return false;
        } else { 
            return true; 
        }
    // Exclude some items that are not currently covered by the system
    } else if(itemDocument.type == "weapon"){
        itemIsExcluded = [
            "Martial Arts",
            "Battleglove",
            "Rippers",
            "Unarmed",
            "Thrown Weapon"
        ].includes(itemDocument.name)
        if(itemIsExcluded){
            console.log("CPR Weapon item explicitly excluded from loadout")
            return false;
        } else { 
            return true; 
        }
    }
}

// Get the weapon's actor representation
function findItemActor(itemDocument){
    let selectedItemActor = game.actors.getName(
        itemDocument.name.split(" (Poor)")[0].split(" (Excellent)")[0]  // Same actor regardless of weapon quality
        )
    if(( selectedItemActor == null) || (selectedItemActor == undefined)){
        return false;
    } else {
        return selectedItemActor;
    }
}

// Do a cursory filtering of the tiles that may be able to accomodate the item according to their geometry and ownership flags
function findValidTiles(itemDocument, loadoutScene, gridSize, itemOrientation){
    const validTiles = loadoutScene.tiles.filter(
        tile => tile.flags.loadout).filter(
            tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(itemOrientation.size_x, itemOrientation.size_y) && 
            tile.flags.loadout.owner == itemDocument.parent.id)
    
    // Return the valid tiles, sorted by preference weight
    return validTiles.sort((a, b) => a.flags.loadout.weight < b.flags.loadout.weight ? -1 : 1);
}

// Find the available positions (if any) for the item in each tile
function processTilePositions(validTiles, gridSize, itemOrientation){
    var tilePositions = [];
    var selectedTile = null
    for(const loadoutTile of validTiles){
        console.log("checking tile " + loadoutTile.id)
        tilePositions = getTilePositions(loadoutTile, gridSize, itemOrientation.size_x, itemOrientation.size_y)

        if(! tilePositions.length){
            if(itemOrientation.size_x != itemOrientation.size_y){
                tilePositions = getTilePositions(loadoutTile, gridSize, itemOrientation.size_y, itemOrientation.size_x)
                if(tilePositions.length){
                    itemOrientation.rotation = 90
                }
            }
        }
        if(tilePositions.length){
            selectedTile = loadoutTile;
            break;
        }
    };

    // Get an array of possible positions for the item to land if nothing was blocking its space
    function getTilePositions(loadoutTile, gridSize, itemSizeL, itemSizeH){
        // TODO: need a way to 'reserve' certain slots at the tile configuration level, such that the whole slot is used (preferably)
        //// Currently we are covering for this by highly-prioritizing single-item slots, but that's just smoke & mirrors
        let itemPositions = []
        for(let rowNum of Array(loadoutTile.height/gridSize).keys()){
            for(let colNum of Array(loadoutTile.width/gridSize).keys()){
                let tilePosition = {
                    "x1": loadoutTile.x + (colNum * gridSize), "y1": loadoutTile.y + (rowNum * gridSize), 
                    "x2": loadoutTile.x + (colNum * gridSize) + (itemSizeL * gridSize), "y2": loadoutTile.y + (rowNum * gridSize) + (itemSizeH * gridSize),
                }
                if((tilePosition.x1 + (itemSizeL * gridSize) <= loadoutTile.x + loadoutTile.width) && (tilePosition.y1 + (itemSizeH * gridSize) <= loadoutTile.y + loadoutTile.height)){
                    itemPositions.push(tilePosition)
                }
            }
        }
        // Find any tokens that may already be over the tile's area
        let blockingTokens = game.canvas.tokens.objects.children.filter(
            t => t.x >= loadoutTile.x <= (loadoutTile.x + loadoutTile.width) && 
                 t.y >= loadoutTile.y <=(loadoutTile.y + loadoutTile.height))

        // Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens.
        // There is something going on here with the use of the myItemSize * gridSize that makes me have to do this extra step of determining 
        // which filter to use...this should be refactorable to a single filter but my brain is refusing to deal with it right now.
        for(let blockingToken of blockingTokens){
                // If the blockingToken is >= the new item, the item should use the filter but with Math.max
            if(blockingToken.w >= itemSizeL * gridSize || blockingToken.h > itemSizeH * gridSize){
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.max(blockingToken.x + blockingToken.w, blockingToken.x + itemSizeL * gridSize) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.max(blockingToken.y + blockingToken.h, blockingToken.y + itemSizeH * gridSize) || blockingToken.y >= p.y2
                    )
            // If the blockingToken is < the new item, the item should use the filter but with Math.min
            } else {
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.min(blockingToken.x + blockingToken.w, blockingToken.x + itemSizeL * gridSize) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.min(blockingToken.y + blockingToken.h, blockingToken.y + itemSizeH * gridSize) || blockingToken.y >= p.y2
                    )
            }
        }
        return itemPositions;
    }
    return [selectedTile, tilePositions]
}

// Place the itemActor token in the loadout scene
async function placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument, loadoutScene){
    
    // We will set the token's disposition value based on the item's quality
    const dispositionMap = {
        "poor": -1, 
        "standard": 0, 
        "excellent": 1
    }

    // Set the basic configuration for the dropped token
    let itemTokenSettings = {
        name: itemDocument.name,
        disposition: dispositionMap[itemDocument.system.quality],           // Set the token disposition
        displayName: 30,                                                    // Show nameplate when hovered by anyone
        flags: {loadout: {"item": itemDocument.id}},                        // Link the token to the item by id
        x: validPositions[0].x1,                                            // First-available position's x coord
        y: validPositions[0].y1,                                            // First-available position's y coord
        rotation: itemOrientation.rotation                                  // Token's rotation
    }

    // Set scaling based on rotation
    if(! itemOrientation.rotation == true){
        itemTokenSettings.width = itemOrientation.size_x;
        itemTokenSettings.height = itemOrientation.size_y;
    } else {
        itemTokenSettings.width = itemOrientation.size_y;
        itemTokenSettings.height = itemOrientation.size_x;
        itemTokenSettings.texture = {
            scaleX: itemOrientation.size_y, 
            scaleY: itemOrientation.size_y
        }
    }

    // Set the token's 'health' bar to represent magazine contents, if available
    // TODO: Look at giving each weapon actor one of its own items in its inventory; then we can use the
    //// magazine attribute to fill the bars instead of hijacking hp
    if(("magazine" in itemDocument.system) && (itemDocument.system.magazine.max != 0)){
        itemTokenSettings.displayBars = 50;  // Set visibility for the 'hp' bar
        itemTokenSettings.actorData = {
            system: {
                derivedStats: {
                    hp: {
                        max: itemDocument.system.magazine.max,
                        value: itemDocument.system.magazine.value
                    }
                }
            }
        }
    }

    // Define the tokenDocument settings for the itemActor
    itemTokenDoc = await selectedItemActor.getTokenDocument(itemTokenSettings)

    // Create the token in the loadout scene
    const addedToken = await loadoutScene.createEmbeddedDocuments("Token", [itemTokenDoc])

    // Send a notification
    if(selectedTile.flags.loadout.state == "owned"){
        ui.notifications.warn(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadout.type + ", which is not carried"
            )
    } else {
        ui.notifications.info(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadout.type
            )
    }
}

async function addLoadoutItem(itemDocument) {
    // Perform checks to ensure that the item is one we will try to handle using the loadout system
    if(! verifyItemSuitability(itemDocument)){
        console.log("item loadout suitability check failed")
        return;
    }

    // Eventually to be configurable by the user, also probably some other checks to be done here (e.g. duplicate scene name)
    const loadoutScene = game.scenes.getName("Crew Loadout")
    
    // The grid size basically becomes our unit of measurement for everything to follow
    const gridSize = loadoutScene.grid.size

    // Try to locate an actor and token matching the item name
    selectedItemActor = findItemActor(itemDocument)
    if(! selectedItemActor){
        ui.notifications.error("unable to find loadout token for " + itemDocument.name)
        return;
    }

    // Item token size and rotation boolean
    const itemOrientation = {
        size_x: selectedItemActor.prototypeToken.width,
        size_y: selectedItemActor.prototypeToken.height,
        rotation: 0
    }

    // Get tiles in the loadout scene that could _potentially_ hold the payload based purely on geometry
    const validTiles = findValidTiles(itemDocument, loadoutScene, gridSize, itemOrientation)

    // Process the preference-sorted array of tiles until we find one that can accommodate the item token
    const [selectedTile, validPositions] = processTilePositions(validTiles, gridSize, itemOrientation)

    // Account for some edge cases (like a player character having no available slots at all, or only slots 
    //// that are not currently carried) and/or create the token.
    if(! validPositions.length){
        const noSpaceDialog = new Dialog({
            title: "Loadout Option",
            content: "<center><p>Unable to find an available Loadout slot.<br>Add " + itemDocument.name + " to inventory regardless?</p></center>",
            buttons: {
                drop: {
                 icon: '<i class="fas fa-check"></i>',
                 label: "Drop Item",
                 callback: () => {
                    itemDocument.delete()
                    return;
                 }
                },
                add: {
                 icon: '<i class="fas fa-times"></i>',
                 label: "Add Item",
                 callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument, loadoutScene) }
                }
               },
               default: "drop"
        }).render(true);
    } else if(selectedTile.flags.loadout.state == "owned"){
        const stashOnlyDialog = new Dialog({
            title: "Loadout Option",
            content: ("<center><p>Unable to find an available carry slot.<br>Add " + itemDocument.name + " to " + selectedTile.flags.loadout.type + "?</center>"),
            buttons: {
                drop: {
                 icon: '<i class="fas fa-check"></i>',
                 label: "Drop Item",
                 callback: () => {
                    itemDocument.delete()
                    return;
                 }
                },
                add: {
                 icon: '<i class="fas fa-times"></i>',
                 label: "Add Item",
                 callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument, loadoutScene) }
                }
               },
               default: "drop"
        }).render(true);
    } else {
        placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument, loadoutScene)
    }

    // Update the inventory item's equipped state based on where the token ended up, and set a flag indicating a linked token
    itemDocument.update({
        "system.equipped": selectedTile.flags.loadout.state,
        "flags.loadout" : {
            linked: true
        }
    })

    Hooks.off("createItem");
    return;
}

// DELETE ITEM HOOK
//// Responsible for removing weapon item representations from the loadout screen when the linked 
//// item is removed from the player's inventory.
Hooks.on("deleteItem", (document, options, userid) => removeLoadoutItem(document));

function removeLoadoutItem(itemDocument) {
    // Don't bother with items that have not been linked to a loadout token
    if(! itemDocument.flags.loadout){
        return;
    }
    const loadoutScene = game.scenes.getName("Crew Loadout")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(token => token.flags.loadout).find(token => token.flags.loadout.item == itemDocument.id)
    
    if(loadoutItemToken == undefined || loadoutItemToken == null) {
        ui.notifications.error("removeLoadoutItem: unable to find token related to " + itemDocument.id + " on loadout scene with id" + loadoutScene.id)
        return;
    } else {
        loadoutItemToken.delete();
        ui.notifications.info("Removed " + itemDocument.name + " from " + itemDocument.parent.name + "'s loadout")
    }
    
    Hooks.off("deleteItem")
    return;
};

// UPDATE ITEM HOOK
//// Updates item tokens' 'health' bar when a weapon magazine changes states
Hooks.on("updateItem", (document, options, userid) => updateLoadoutItem(document));

async function updateLoadoutItem(itemDocument){
    // Don't bother with items that have not been linked to a loadout token
    if(! itemDocument.flags.loadout){
        return;
    }
    
    // This function is only used to update the ammo bars of loadout weapons
    if(! itemDocument.system.magazine){
        return;
    } else if(itemDocument.system.magazine.max == 0){
        return;
    }

    const loadoutScene = game.scenes.getName("Crew Loadout")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(token => token.flags.loadout).find(token => token.flags.loadout.item == itemDocument.id)

    if((loadoutItemToken == null) || (loadoutItemToken == undefined)){
        console.log("loadout item not found")
        return;
    }

    // Update the linked token's stats to reflect magazine changes
    loadoutItemToken.update({actorData: {system: {derivedStats: {hp: {value: itemDocument.system.magazine.value}}}}})

    Hooks.off("updateItem");
    return;
}