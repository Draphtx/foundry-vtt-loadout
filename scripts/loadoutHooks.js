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
function findValidTiles(itemDocument, itemOrientation){
    // Beginning support for multiple scenes. Because tile objects only exist as children of scenes (?),
    //// I think we need to iterate here unfortunately.
    const loadoutsScenes = game.scenes.filter(
        scene => scene.flags.loadouts).filter(
            scene => scene.flags.loadouts.isLoadoutsScene == true)
    
    let validTiles = []
    for(let loadoutsScene of loadoutsScenes){
        loadoutsTiles = loadoutsScene.tiles.filter(
            tile => tile.flags.loadout).filter(
                tile => tile.flags.loadout.owner == itemDocument.parent.id && 
                Math.max(tile.height/tile.parent.grid.size, tile.width/tile.parent.grid.size) >= Math.max(itemOrientation.size_x, itemOrientation.size_y))
        validTiles = [...validTiles, ...loadoutsTiles]
    }

    // Return the valid tiles, sorted by preference weight
    return validTiles.sort((a, b) => a.flags.loadout.weight < b.flags.loadout.weight ? -1 : 1);
}

// Find the available positions (if any) for the item in each tile
function processTilePositions(validTiles, itemOrientation){
    var tilePositions = [];
    var selectedTile = null
    for(const loadoutsTile of validTiles){
        console.log("checking tile " + loadoutsTile.id)
        tilePositions = getTilePositions(loadoutsTile, itemOrientation.size_x, itemOrientation.size_y)

        if(! tilePositions.length){
            if(itemOrientation.size_x != itemOrientation.size_y){
                tilePositions = getTilePositions(loadoutsTile, itemOrientation.size_y, itemOrientation.size_x)
                if(tilePositions.length){
                    itemOrientation.rotation = 90
                }
            }
        }
        if(tilePositions.length){
            selectedTile = loadoutsTile;
            break;
        }
    };

    // Get an array of possible positions for the item to land if nothing was blocking its space
    function getTilePositions(loadoutsTile, itemSizeL, itemSizeH){
        // TODO: need a way to 'reserve' certain slots at the tile configuration level, such that the whole slot is used (preferably)
        //// Currently we are covering for this by highly-prioritizing single-item slots, but that's just smoke & mirrors
        let itemPositions = []
        for(let rowNum of Array(loadoutsTile.height/loadoutsTile.parent.grid.size).keys()){
            for(let colNum of Array(loadoutsTile.width/loadoutsTile.parent.grid.size).keys()){
                let tilePosition = {
                    "x1": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size), "y1": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size), 
                    "x2": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size) + (itemSizeL * loadoutsTile.parent.grid.size), "y2": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size) + (itemSizeH * loadoutsTile.parent.grid.size),
                }
                if((tilePosition.x1 + (itemSizeL * loadoutsTile.parent.grid.size) <= loadoutsTile.x + loadoutsTile.width) && (tilePosition.y1 + (itemSizeH * loadoutsTile.parent.grid.size) <= loadoutsTile.y + loadoutsTile.height)){
                    itemPositions.push(tilePosition)
                }
            }
        }
        // Find any tokens that may already be over the tile's area
        // TODO: THIS IS WHERE POSITION DETECTION IS CURRENTLY BROKEN FOR MULTI-SCENE.
        //// game.canvas.tokens.objects.children.filter works, but the below does NOT
        let blockingTokens = loadoutsTile.parent.tokens.filter(
            t => t.x >= loadoutsTile.x <= (loadoutsTile.x + loadoutsTile.width) && 
                 t.y >= loadoutsTile.y <=(loadoutsTile.y + loadoutsTile.height))

        // Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens.
        // There is something going on here with the use of the myItemSize * gridSize that makes me have to do this extra step of determining 
        // which filter to use...this should be refactorable to a single filter but my brain is refusing to deal with it right now.
        for(let blockingToken of blockingTokens){
                // If the blockingToken is >= the new item, the item should use the filter but with Math.max
            if(blockingToken.object.w >= itemSizeL * loadoutsTile.parent.grid.size || blockingToken.object.h > itemSizeH * loadoutsTile.parent.grid.size){
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.max(blockingToken.object.x + blockingToken.object.w, blockingToken.object.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.object.x >= p.x2 || 
                    p.y1 >= Math.max(blockingToken.object.y + blockingToken.object.h, blockingToken.object.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.object.y >= p.y2
                    )
            // If the blockingToken is < the new item, the item should use the filter but with Math.min
            } else {
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.min(blockingToken.object.x + blockingToken.object.w, blockingToken.object.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.object.x >= p.x2 || 
                    p.y1 >= Math.min(blockingToken.object.y + blockingToken.object.h, blockingToken.object.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.object.y >= p.y2
                    )
            }
        }
        return itemPositions;
    }
    return [selectedTile, tilePositions]
}

// Place the itemActor token in the loadout scene
async function placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument){
    
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
        flags: {loadouts: {"item": itemDocument.id}},                        // Link the token to the item by id
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
    const addedToken = await selectedTile.parent.createEmbeddedDocuments("Token", [itemTokenDoc])

    // Send a notification
    if(selectedTile.flags.loadouts.state == "owned"){
        ui.notifications.warn(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadout.type + " in '" + selectedTile.parent.name + "', which is not carried"
            )
    } else {
        ui.notifications.info(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadout.type + " in '" + selectedTile.parent.name + "'"
            )
    }
}

async function addLoadoutItem(itemDocument) {
    // Perform checks to ensure that the item is one we will try to handle using the loadout system
    if(! verifyItemSuitability(itemDocument)){
        console.log("item loadout suitability check failed")
        return;
    }

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

    // Get tiles from Loadouts scene that could _potentially_ hold the payload based purely on geometry
    const validTiles = findValidTiles(itemDocument, itemOrientation)

    // Process the preference-sorted array of tiles until we find one that can accommodate the item token
    const [selectedTile, validPositions] = processTilePositions(validTiles, itemOrientation)

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
                 callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument) }
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
                 callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument) }
                }
               },
               default: "drop"
        }).render(true);
    } else {
        placeItemActor(selectedTile, validPositions, itemOrientation, selectedItemActor, itemDocument)
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
    if(! itemDocument.flags.loadouts){
        return;
    }
    const loadoutScene = game.scenes.getName("Crew Loadout")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(token => token.flags.loadouts).find(token => token.flags.loadouts.item == itemDocument.id)
    
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
    if(! itemDocument.flags.loadouts){
        return;
    }
    
    // This function is only used to update the ammo bars of loadout weapons
    if(! itemDocument.system.magazine){
        return;
    } else if(itemDocument.system.magazine.max == 0){
        return;
    }

    const loadoutScene = game.scenes.getName("Crew Loadout")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(token => token.flags.loadouts).find(token => token.flags.loadouts.item == itemDocument.id)

    if((loadoutItemToken == null) || (loadoutItemToken == undefined)){
        console.log("loadout item not found")
        return;
    }

    // Update the linked token's stats to reflect magazine changes
    loadoutItemToken.update({actorData: {system: {derivedStats: {hp: {value: itemDocument.system.magazine.value}}}}})

    Hooks.off("updateItem");
    return;
}