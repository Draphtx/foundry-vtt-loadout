Hooks.on("createItem", (document, options, userid) => addLoadoutItem(document));

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

function findItemActor(itemDocument){
    // Get the weapon actor (sans quality conditions)
    let selectedWeapon = game.actors.getName(itemDocument.name.split(" (Poor)")[0].split(" (Excellent)")[0])
    if(( selectedWeapon == null) || (selectedWeapon == undefined)){
        return false;
    } else {
        return selectedWeapon;
    }
}

async function addLoadoutItem(itemDocument) {
    
    // Perform checks to ensure that the item is one we will try to handle using the loadout system
    if(! verifyItemSuitability(itemDocument)){
        console.log("item loadout suitability check returned false")
        return;
    }

    // Eventually to be configurable by the user, also probably some other checks to be done here (e.g. duplicate scene name)
    const loadoutScene = game.scenes.getName("Crew Loadout")
    
    // The grid size basically becomes our unit of measurement for everything to follow
    const gridSize = loadoutScene.grid.size

    // Try to locate an actor and token
    selectedWeapon = findItemActor(itemDocument)
    if(! selectedWeapon){
        ui.notifications.error("unable to find loadout token for " + itemDocument.name)
        return;
    }

    // Test item size in grid units, not pixels
    let itemSizeX = selectedWeapon.prototypeToken.width
    let itemSizeY = selectedWeapon.prototypeToken.height
    let itemRotated = false

    // Get all loadout tiles from the loadout scene
    loadoutTiles = loadoutScene.tiles.filter(tile => tile.flags.loadout)

    // filter loadout tiles to those owner by the character and those large enough to accommodate the item
    const applicableTiles = loadoutTiles.filter(tile => Math.max(tile.height/gridSize, tile.width/gridSize) >= Math.max(itemSizeX, itemSizeY) && tile.flags.loadout.owner == itemDocument.parent.id)

    // lambda to sort player's loadout tiles by weight (preference) 0-5, arbitrarily
    const sortedTiles = applicableTiles.sort((a, b) => a.flags.loadout.weight < b.flags.loadout.weight ? -1 : 1);

    // EVERYTHING FROM HERE DOWN NEEDS A HUGE REFACTOR & CLEANUP
    // process each tile
    var tilePositions = [];
    var selectedTile = null
    for(const loadoutTile of sortedTiles){
        console.log("checking tile " + loadoutTile.id)
        tilePositions = getTilePositions(loadoutTile, itemSizeX, itemSizeY)

        if(! tilePositions.length){
            if(itemSizeX != itemSizeY){
                tilePositions = getTilePositions(loadoutTile, itemSizeY, itemSizeX)
                if(tilePositions.length){
                    itemRotated = true
                }
            }
        }
        if(tilePositions.length){
            selectedTile = loadoutTile;
            break;
        }
    };

    // Get an array of possible positions for the item to land if nothing was blocking its space
    function getTilePositions(loadoutTile, itemSizeL, itemSizeH){
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
        let blockingTokens = game.canvas.tokens.objects.children.filter(t => t.x >= loadoutTile.x <= (loadoutTile.x + loadoutTile.width) && t.y >= loadoutTile.y <=(loadoutTile.y + loadoutTile.height))

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

    if(! tilePositions.length){
        // Idk if this would be best-achieved by a preCreate where we do this before the item even exists, but in keeping with the mess of this script so far
        //// we'll just delete the item if they don't choose 'yes'
        // UNTESTED 2023-07-07 //
        const noSpaceDialog = new Dialog({
            title: "Loadout Option",
            content: "<p>Unable to find an available Loadout slot.<br>Add to inventory regardless?</p>",  // TODO: Can we use the item name as a variable in this message? Surely.
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
                 callback: () => {return;}
                }
               },
               default: "drop"
        }).render(true);
    }
    if(selectedTile.flags.loadout.state == "owned"){
        const stashOnlyDialog = new Dialog({
            title: "Loadout Option",
            content: ("<center><p>Unable to find an available carry slot.<br>Add item to " + selectedTile.flags.loadout.type + "?</center>"),
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
                 callback: () => {}
                }
               },
               default: "drop"
        }).render(true);
    }

    // Choose an available slot and drop a test token
    let dropPosition = tilePositions[0]
    let itemActor = game.actors.getName(selectedWeapon.prototypeToken.name)
    var itemTokenDoc
    console.log(itemRotated)

    if(itemRotated == true){
        console.log("creating rotated token")
        itemTokenDoc = await itemActor.getTokenDocument({
            name: itemDocument.name,
            x: dropPosition.x1, y: dropPosition.y1, width: itemSizeY, height: itemSizeX, 
            rotation: 90, texture: {scaleX: itemSizeY, scaleY: itemSizeY}, 
            flags: {
                loadout: {
                    "item": itemDocument.id
                }}
        })
    } else {
        itemTokenDoc = await itemActor.getTokenDocument({
            name: itemDocument.name,
            x: dropPosition.x1, y: dropPosition.y1, width: itemSizeX, height: itemSizeY, 
            flags: {
                loadout: {
                    "item": itemDocument.id
                }}})
    }
    // TODO: Look at merging things into the itemTokenDoc so's we don't have to update the dropped token after the fact
    const addedToken = await loadoutScene.createEmbeddedDocuments("Token", [itemTokenDoc])
    
    // If the item has an ammo magazine, assign a 'health' bar to represent the current magazine
    // Similarly we should set the token's disposition to Red (poor), Yellow (standard), or 
    //// Green (Excellent)
    console.log(addedToken)
    if(("magazine" in itemDocument.system) && (itemDocument.system.magazine.max != 0)){
        console.log("setting token health bars")
        const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(
            token => token.flags.loadout).find(
                token => token.flags.loadout.item == itemDocument.id)
        console.log(loadoutItemToken)
        const dispositionMap = {"poor": -1, "standard": 0, "excellent": 1}
        // TODO: Also set the Hover For Everyone name setting
        loadoutItemToken.update({
            disposition: dispositionMap[itemDocument.system.quality],
            displayName: 30,
            displayBars: 50, 
            actorData: { 
                system: { 
                    derivedStats: { 
                        hp: { 
                            max: itemDocument.system.magazine.max, 
                            value: itemDocument.system.magazine.value
                        }
                    }
                }
            }})
    }
    

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

    // Update the inventory item's equipped state based on where the token ended up
    itemDocument.update({"system.equipped": selectedTile.flags.loadout.state})
}

Hooks.off("createItem");
