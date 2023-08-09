console.log('%c▞▖ Foundry VTT Loadouts Initialized ▞▖', 'color:#FFFFFF; background:#72e8c4; padding:10px; border-radius:5px; font-size:14px');

// CREATE ITEM HOOK
//// Responsible for adding items to a character's loadout when (applicable) items are added to the 
//// character's inventory in the character sheet.
Hooks.on("createItem", (document, options, userid) => addLoadoutsItem(document));

// Verifies that the item is something that we want to handle in the loadout system
function verifyItemSuitability(itemDocument) {
    const managedActorTypes = game.settings.get("loadouts", "loadouts-managed-actor-types");
    const managedItemTypes = game.settings.get("loadouts", "loadouts-managed-item-types");
    const allowUnconfiguredItems = game.settings.get('loadouts', 'loadouts-allow-unconfigured-items');
    
    // Do not try to handle item management for unwanted actor types
    if (!managedActorTypes.includes(itemDocument.parent.type)) {
        console.debug(`▞▖Loadouts: actor type '${itemDocument.parent.type}' not managed`);
        return false;
    }

    if (!managedItemTypes.includes(itemDocument.type)) {
        console.debug(`▞▖Loadouts: item type '${itemDocument.type}' not managed`);
        return false;
    }

    if ("loadouts" in itemDocument.flags) {
        console.debug(`▞▖Loadouts:: ${itemDocument.name} of type '${itemDocument.type}' is configured for management`);
        return true;
    }

    if (allowUnconfiguredItems) {
        console.debug(`▞▖Loadouts: ${itemDocument.name} of type '${itemDocument.type}' not flagged but unconfigured items setting is set to permissive.`);
        return false;
    }

    ui.notifications.warn(`Lodouts: cannot add '${itemDocument.name}' to ${itemDocument.parent.name}'s inventory. The GM has disabled the ability \
        to add ${itemDocument.type} items that are not configured for Loadouts.`);
    itemDocument.delete();
    return false;
}


// Check whether the item's Loadouts configuration contains any errors
function validateLoadoutsConfiguration(itemDocument, fields) {
    const itemFlags = itemDocument.flags.loadouts;

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        let value;  // The value we are checking

        // Check if it's a nested field
        if (field.includes('[') && field.includes(']')) {
            const [parent, child] = field.split('[');
            const childKey = child.replace(']', '');

            if (!itemFlags[parent] || !itemFlags[parent].hasOwnProperty(childKey)) {
                ui.notifications.error(`Loadouts: Managed item ${itemDocument.name} configuration is missing "${field}". Unable to place token.`);
                return false;
            }
            value = itemFlags[parent][childKey];
        } else {
            if (!itemFlags.hasOwnProperty(field)) {
                ui.notifications.error(`Loadouts: Managed item ${itemDocument.name} configuration is missing "${field}". Unable to place token.`);
                return false;
            }
            value = itemFlags[field];
        }

        // Now check for null or undefined
        if (value === null || value === undefined) {
            ui.notifications.error(`Loadouts: Managed item ${itemDocument.name} configuration has no value for "${field}". Unable to place token.`);
            return false;
        }

        // Check the value type
        if (field.endsWith('img') || field.endsWith('[img]')) {
            if (typeof value !== 'string') {
                ui.notifications.error(`Loadouts: Managed item ${itemDocument.name} configuration parameter "${field}" should be a string. Unable to place token.`);
                return false;
            }
        } else {
            if (!Number.isInteger(value)) {
                ui.notifications.error(`Loadouts: Managed item ${itemDocument.name} configuration parameter "${field}" should be an integer. Unable to place token.`);
                return false;
            }
        }
    }
    return true;
}

// Do a cursory filtering of the tiles that may be able to accomodate the item according to their geometry and ownership flags
function findValidTiles(itemDocument, itemOrientation){
    const loadoutsScenes = game.scenes.filter(
        scene => scene.flags.loadouts).filter(
            scene => scene.flags.loadouts.isLoadoutsScene == true)
    
    if((loadoutsScenes == null) || (loadoutsScenes == undefined)){
        console.warn("▞▖Loadouts: unable to find any scenes flagged for Loadouts. Please be sure to complete scene and tile setup as described in the documentation.")
        return;
    }
    
    let validTiles = []
    console.log(`looking for valid tiles: owner "${itemDocument.parent.id}", type "${itemDocument.type}", x: ${itemOrientation.size_x}, y: ${itemOrientation.size_y} `)
    for(let loadoutsScene of loadoutsScenes){
        loadoutsTiles = loadoutsScene.tiles.filter(
            tile => tile.flags.loadouts).filter(
                tile => tile.flags.loadouts.owner == itemDocument.parent.id).filter(
                    tile => {
                        const allowedTypes = tile.flags.loadouts?.allowed_types;
                    
                        // If allowedTypes is set but doesn't include itemDocument.system.type, we reject the tile.
                        if (allowedTypes && !allowedTypes.split(',').includes(itemDocument.type)) {
                            console.log(`reject tile due to type discrepancy`)
                            return false;
                        }
                    
                        // If allowedTypes is null or undefined, or if it includes itemDocument.system.type, we continue with the size check.
                        console.log(`checking tile size: ${Math.max(tile.height/tile.parent.grid.size, tile.width/tile.parent.grid.size)} can hold ${Math.max(itemOrientation.size_x, itemOrientation.size_y)}?`)
                        return Math.max(tile.height/tile.parent.grid.size, tile.width/tile.parent.grid.size) >= Math.max(itemOrientation.size_x, itemOrientation.size_y);
                    }
                )
        validTiles = [...validTiles, ...loadoutsTiles]
    }

    // Return the valid tiles, sorted by preference weight
    return validTiles.sort((a, b) => a.flags.loadouts.weight < b.flags.loadouts.weight ? -1 : 1);
}

// Find the available positions (if any) for the item in each tile
function processTilePositions(itemDocument, validTiles, itemOrientation){
    var tilePositions = [];
    var selectedTile = null
    let isStacked = false
    for(const loadoutsTile of validTiles){
        // If the item has a stack setting, check to see whether any of the existing tokens are stacks of the same item with room to spare
        // By doing this here, we ensure that the tile's weight is still accounted for when looking for existing stacks
        if(itemDocument.flags.loadouts.stack.max > 1){
            // Find any tokens that are already within the Tile's bounds
            let existingTokens = loadoutsTile.parent.tokens.filter(
                t => t.x >= loadoutsTile.x <= (loadoutsTile.x + loadoutsTile.width) && 
                     t.y >= loadoutsTile.y <=(loadoutsTile.y + loadoutsTile.height))
            let validStacks = existingTokens.filter(t => t.name == itemDocument.name && 
                                                        (t.flags?.loadouts?.stack?.members?.length + 1) <= (itemDocument?.flags?.loadouts?.stack?.max)
            // Let's not account for individual item quantities for now - I'm not sure if or when we'll do anything with that
            // (t.flags?.loadouts?.stack?.members?.length + (itemDocument?.system?.amount || 1)) <= (itemDocument?.flags?.loadouts?.stack?.max || 1)
            );
            if(validStacks.length > 0){
                updateStack(itemDocument, validStacks[0], loadoutsTile);
                isStacked = true;
                itemDocument.update({  // Ensure that the item is in the appropriate equipped state for the stack
                    system: {
                        equipped: loadoutsTile.flags.loadouts.state
                    }
                });
                break;
            }
        }

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
        let blockingTokens = loadoutsTile.parent.tokens.filter(
            t => t.x >= loadoutsTile.x <= (loadoutsTile.x + loadoutsTile.width) && 
                 t.y >= loadoutsTile.y <=(loadoutsTile.y + loadoutsTile.height))

        // Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens.
        // There is something going on here with the use of the itemSize * gridSize that makes me have to do this extra step of determining 
        // which filter to use...this should be refactorable to a single filter but my brain is refusing to deal with it right now.
        for(let blockingToken of blockingTokens){
            // If the blockingToken is >= the new item, the item should use the filter but with Math.max
            if(blockingToken.width >= itemSizeL || blockingToken.height > itemSizeH){
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.max(blockingToken.x + blockingToken.width * loadoutsTile.parent.grid.size, blockingToken.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.max(blockingToken.y + blockingToken.height * loadoutsTile.parent.grid.size, blockingToken.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.y >= p.y2
                    )
            // If the blockingToken is < the new item, the item should use the filter but with Math.min
            } else {
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.min(blockingToken.x + blockingToken.width * loadoutsTile.parent.grid.size, blockingToken.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.min(blockingToken.y + blockingToken.height * loadoutsTile.parent.grid.size, blockingToken.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.y >= p.y2
                    )
            }
        }
        return itemPositions;
    }
    return [isStacked, selectedTile, tilePositions]
}

function updateStack(itemDocument, validStack, loadoutsTile){
    const existingMembership = [...validStack.flags.loadouts.stack.members];
    existingMembership.push(itemDocument.id); 
    validStack.update({flags: {loadouts: {stack: {members: existingMembership}}}});
    ui.notifications.info(itemDocument.parent.name + " added " + itemDocument.name + " to an existing stack in " + loadoutsTile.parent.name);
}


// Before placing the itemToken, check for some edge cases where we may need user input
function performPrePlacementChecks(selectedTile, validPositions, itemOrientation, itemDocument){
    if(! validPositions.length){
        if(game.settings.get("loadouts", 'loadouts-full-add-anyway')){
            const noSpaceDialog = new Dialog({
                title: "Loadouts Option",
                content: "<center><p>Unable to find an available Loadouts slot.<br>Add " + itemDocument.name + " to inventory regardless?</p></center>",
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
                    callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, itemDocument) }
                    }
                },
                default: "drop"
            }).render(true);
        } else {
            ui.notifications.warn("Loadouts: " + itemDocument.parent.name + " has no available slots, \
                and the GM has disabled adding items beyond slot capacity. The item " + itemDocument.name + " will be removed.")
            itemDocument.delete()
            return false;
        }
    } else if(selectedTile.flags.loadouts.state == "owned"){
        if(game.settings.get('loadouts', 'loadouts-teleport-to-stash')){
            const stashOnlyDialog = new Dialog({
                title: "Loadouts Option",
                content: ("<center><p>Unable to find an available Loadouts carry slot.<br>Add " + itemDocument.name + " to " + selectedTile.flags.loadouts.type + "?</center>"),
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
                    callback: function(){ placeItemActor(selectedTile, validPositions, itemOrientation, itemDocument) }
                    }
                },
                default: "drop"
            }).render(true);
        } else {
            ui.notifications.warn("Loadouts: " + itemDocument.parent.name + " has no available carry slots, \
                and the GM has disabled teleporting items to stashes. The item " + itemDocument.name + " will be removed.")
            itemDocument.delete()
            return false;
        }
    } else {
        placeItemActor(selectedTile, validPositions, itemOrientation, itemDocument)
    }    
}

// Place the itemActor token in the loadout scene
async function placeItemActor(selectedTile, validPositions, itemOrientation, itemDocument){
    
    // We will set the token's disposition value based on the item's quality
    const dispositionMap = {
        "poor": -1, 
        "standard": 0, 
        "excellent": 1
    }    
    const statusIconMap = {
        "equipped": "modules/loadouts/artwork/icons/status-equipped.webp",
        "carried": "",
        "owned": ""
    }

    let itemTokenSettings = {
        name: itemDocument.name,
        actorLink: false,
        disposition: dispositionMap[itemDocument.system.quality],
        displayName: 30,
        system: {
            equipped: selectedTile.flags.loadouts.state
        },
        flags: {
            loadouts: {
                "managed": true,
                "linked": true,
                "owner": itemDocument.parent.id,
                "stack": {
                    "max": itemDocument.flags?.loadouts?.stack?.max,
                    "members": [itemDocument.id]
                }
            }
        },
        texture: {
            src: itemDocument.flags.loadouts.img,
            // Incorporate the rotation checks right here
            scaleX: itemOrientation.rotation ? itemOrientation.size_y : undefined,
            scaleY: itemOrientation.rotation ? itemOrientation.size_y : undefined
        },
        width: itemOrientation.rotation ? itemOrientation.size_y : itemOrientation.size_x,
        height: itemOrientation.rotation ? itemOrientation.size_x : itemOrientation.size_y,
        x: validPositions[0].x1,
        y: validPositions[0].y1,
        rotation: itemOrientation.rotation,
        lockRotation: true
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

    // Set equipped state overlays where desired
    if(itemDocument.system.equipped){
        itemTokenSettings.overlayEffect = statusIconMap[itemDocument.system.equipped]
    }

    // Define the tokenDocument settings for the itemActor
    itemTokenDoc = await itemDocument.parent.getTokenDocument(itemTokenSettings)

    // Create the token in the loadout scene
    const addedToken = await selectedTile.parent.createEmbeddedDocuments("Token", [itemTokenDoc])

    // Send notifications
    if(selectedTile.flags.loadouts.state == "owned"){
        ui.notifications.warn(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadouts.type + " in '" + selectedTile.parent.name + "', which is not carried"
            )
    } else {
        ui.notifications.info(
            "Added " + itemDocument.name + " to " + itemDocument.parent.name + "'s " + 
            selectedTile.flags.loadouts.type + " in '" + selectedTile.parent.name + "'"
            )
    }
    console.info("▞▖Loadouts: " + itemDocument.parent.name + "'s " + itemDocument.name + ":" +itemDocument.id + " was linked to a Loadouts token")
}

async function addLoadoutsItem(itemDocument) {
    // Begin logging the transaction
    console.debug("▞▖Loadouts: " + itemDocument.parent.name + " added " + itemDocument.name + " to their inventory")
    
    // Perform checks to ensure that the item is one we will try to handle using the loadout system
    if(! verifyItemSuitability(itemDocument)){
        console.debug("▞▖Loadouts: item " + itemDocument.name + " discarded by suitability checks")
        return;
    }

    // Validate that the item's Loadouts configuration is acceptable
    if(! validateLoadoutsConfiguration(itemDocument, ["img", "width", "height", "stack[max]"])){
        console.warn("▞▖Loadouts: Managed item " + itemDocument.name + " failed configuration checks. Item will not be linked to a Loadouts token")
        return;
    }

    // Item token size and rotation boolean
    const itemOrientation = {
        size_x: itemDocument.flags.loadouts.width,
        size_y: itemDocument.flags.loadouts.height,
        rotation: 0
    }
    
    // Get tiles from Loadouts scene that could _potentially_ hold the payload based purely on geometry
    const validTiles = findValidTiles(itemDocument, itemOrientation)
    const [isStacked, selectedTile, validPositions] = processTilePositions(itemDocument, validTiles, itemOrientation)

    if(! isStacked){ performPrePlacementChecks(selectedTile, validPositions, itemOrientation, itemDocument) };

    Hooks.off("createItem");
    return;
}

// DELETE ITEM HOOK
//// Responsible for removing weapon item representations from the loadout screen when the linked 
//// item is removed from the player's inventory.
Hooks.on("deleteItem", (document, options, userid) => removeLoadoutsItem(document));

async function removeLoadoutsItem(itemDocument) {
    // Don't bother with items that have not been linked to a loadout token
    if (!itemDocument.flags.loadouts) return;

    const loadoutsScenes = game.scenes.filter(scene => scene.flags?.loadouts?.isLoadoutsScene);

    let loadoutsItemToken;
    for (const loadoutsScene of loadoutsScenes) {
        loadoutsItemToken = game.scenes.get(loadoutsScene.id).tokens.contents.find(token => 
            token.flags.loadouts?.stack?.members?.includes(itemDocument.id)
        );
        if (loadoutsItemToken) break;
    }

    if (!loadoutsItemToken) {
        ui.notifications.warn(`Unable to find Loadouts token related to ${itemDocument.id} on any Loadouts scene`);
        return;
    } else {
        // Remove the itemDocument.id from the members array
        const membersArray = loadoutsItemToken.flags.loadouts.stack.members;
        const index = membersArray.indexOf(itemDocument.id);
        if (index > -1) {
            membersArray.splice(index, 1);
        }

        // If the members array isn't empty, update the token's members array
        if (membersArray.length > 0) {
            loadoutsItemToken.update({ "flags.loadouts.stack.members": membersArray });
            ui.notifications.info(`Loadouts: ${itemDocument.parent.name} removed '${itemDocument.name}' from a stack in '${loadoutsItemToken.parent.name}'`);
        } else {
            // If the members array is empty after removal, delete the token
            ui.notifications.info(`Removed '${itemDocument.name}' from ${itemDocument.parent.name}'s loadout in '${loadoutsItemToken.parent.name}'`);
            loadoutsItemToken.delete();
        }
    }

    Hooks.off("deleteItem");
}



// UPDATE ITEM HOOK
//// Updates item tokens' 'health' bar when a weapon magazine changes states
Hooks.on("updateItem", (document, options, userid) => updateLoadoutsItem(document));

async function updateLoadoutsItem(itemDocument) {
    if (!itemDocument.parent) return;

    if (!itemDocument.flags.loadouts || !itemDocument.flags.loadouts.configured) return;

    const loadoutsScenes = game.scenes.filter(scene => scene.flags?.loadouts?.isLoadoutsScene);

    let loadoutsItemToken;
    for (const loadoutsScene of loadoutsScenes) {
        loadoutsItemToken = game.scenes.get(loadoutsScene.id).tokens.contents.find(token => 
            token.flags.loadouts?.stacks?.members?.includes(itemDocument.id)
        );
        if (loadoutsItemToken) break;
    }

    if (!loadoutsItemToken) {
        console.warn(`▞▖Loadouts: Loadouts item not found; cannot reflect ${itemDocument.parent.name}'s inventory change`);
        return;
    }

    if (itemDocument.system.magazine.max !== 0) {
        loadoutsItemToken.update({
            actorData: {
                system: {
                    derivedStats: {
                        hp: {
                            value: itemDocument.system.magazine.value
                        }
                    }
                }
            }
        });
    }

    const statusIconMap = {
        "equipped": "modules/loadouts/artwork/icons/status-equipped.webp",
        "carried": "",
        "owned": ""
    };

    if (itemDocument.system.equipped) {
        loadoutsItemToken.update({
            overlayEffect: statusIconMap[itemDocument.system.equipped]
        });
    }

    Hooks.off("updateItem");
}


// UPDATE TOKEN HOOK
//// Updates a linked item's equip state based on the which Loadouts tile it lands on when moved by a player
Hooks.on("updateToken", (document, diff, sceneId, userId) => updateLoadoutsToken(document, diff, sceneId, userId));

function updateLoadoutsToken(tokenDocument, diff, scene, userId){
    // Do not respond to updateToken events unless the token is a Loadouts token, the scene is a Loadouts scene, 
    //// and there has been token movement
    if((! tokenDocument.parent.flags.loadouts) || 
        (! tokenDocument.parent.flags.loadouts.isLoadoutsScene) || 
        (! tokenDocument.flags.loadouts) || ((! diff.x > 0) && (! diff.y > 0))){
        return;
    }

    // Find the actor who owns the item linked to the Loadouts token
    triggeringUser = game.users.find(user => user.id == userId)
    tokenOwner = game.actors.get(tokenDocument.flags.loadouts.owner)
    if((tokenOwner == null) || (tokenOwner == undefined)){
        console.warn("▞▖Loadouts: unable to find an item owner associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    if((tokenOwner.id != triggeringUser.id) && (triggeringUser.role != 4)){
        // TODO: This is not technically true for now - they can move the token, but they'll get a warning
        ui.notification.warn("Loadouts: users can only move Loadouts tokens linked to an item in their inventory")        
        return;
    }
    linkedItems = tokenDocument.flags.loadouts.stack.members
    if(!linkedItems.length > 0){
        console.warn("▞▖Loadouts: unable to find item(s) associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    
    // Find Loadouts tiles owned by the item's owner
    let validTiles = tokenDocument.parent.tiles.filter(
        tile => tile.flags.loadouts).filter(
            tile => tile.flags.loadouts.owner == tokenOwner.id)
    
    var selectedTile = null
    for(const loadoutsTile of validTiles){
        if((tokenDocument.x >= loadoutsTile.x && tokenDocument.x <= loadoutsTile.x + loadoutsTile.width) && 
        (tokenDocument.y >= loadoutsTile.y && tokenDocument.y <= loadoutsTile.y + loadoutsTile.height)){
            selectedTile = loadoutsTile;
            break;
        }
    }

    if(! selectedTile){
        ui.notifications.warn("Loadouts: " + triggeringUser.name + " placed a Loadouts token outside of a Loadouts tile.")
        return;
    }

    // Update the inventory item's equipped/carried/owned status to reflect the tile on which it was placed
    for(const itemId of linkedItems){
        inventoryItem = tokenOwner.items.get(itemId)
        if(selectedTile.flags.loadouts.state == inventoryItem.system.equipped){
        } else {
            inventoryItem.update({system:{equipped: selectedTile.flags.loadouts.state}})
            ui.notifications.info("Loadouts: set " + inventoryItem.name + "equipped state to " + selectedTile.flags.loadouts.state + " to reflect new tile location.")
        }
    };
    
    Hooks.off("updateToken")
    return;
}