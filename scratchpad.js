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
    linkedItemOwner = game.actors.find(actor => actor.items.find(item => item.id == tokenDocument.flags.loadouts.item))
    if((linkedItemOwner == null) || (linkedItemOwner == undefined)){
        console.warn("Loadouts: unable to find an item owner associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    if((linkedItemOwner.id != triggeringUser.id) && (triggeringUser.role != 4)){
        // TODO: This is not technically true for now - they can move the token, but they'll get a warning
        ui.notification.warn("Loadouts: users can only move Loadouts tokens linked to an item in their inventory")        
        return;
    }
    linkedItem = game.actors.find(actor => actor.id == linkedItemOwner.id).items.find(item => item.id == tokenDocument.flags.loadouts.item)
    if((linkedItem == null) || (linkedItem == undefined)){
        console.warn("Loadouts: unable to find an item associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    
    // Find Loadouts tiles owned by the item's owner
    let validTiles = tokenDocument.parent.tiles.filter(
        tile => tile.flags.loadouts).filter(
            tile => tile.flags.loadouts.owner == linkedItemOwner.id)
    
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

    
    if((linkedItem == null) || (linkedItem == undefined)){
        console.warn("Loadouts: unable to find item for update in user's inventory")
    }

    // Update the inventory item's equipped/carried/owned status to reflect the tile on which it was placed
    if(selectedTile.flags.loadouts.state == linkedItem.system.equipped){
    } else {
        linkedItem.update({system:{equipped: selectedTile.flags.loadouts.state}})
        ui.notifications.info("Loadouts: set equipped state to reflect new tile location")
    }
    
    Hooks.off("updateToken")
    return;
}