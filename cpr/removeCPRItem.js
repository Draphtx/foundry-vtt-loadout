// Allows for a graphical 'loadout' system by removing items (represented by actors) from the specified
//// actor when the item is dragged onto a tile. The script will also check for an item's ammo content 
//// and throw a warning if a player tries to delete an item that contains ammunition.

// Do not run any of the following for users who are not using the targeted character
const targetActorID = args[0]
const triggeringCharacter = game.user.character
const targetActor = game.actors.find(actor => actor.id == targetActorID)
if(targetActor == null || targetActor == undefined){
    ui.notifications.error("removeCPRItem - unable to get targetActor");
    return;
}

// Ensure that the player is either the owner of the targetActor OR that the player is the GM and no one else is active
if(triggeringCharacter != null){
    if(triggeringCharacter._id != targetActorID){
        return;
    }
} else if(game.user.role == 4){
    if(game.users.filter(user => user.active == true).length != 1){
        ui.notifications.warn("GM cannot modify loadouts while other players are present");
        return;
    } 
}

// Get the id of the item from the controlled token
const itemToken = canvas.tokens.controlled[0]
const itemIsGrenade = [
    "Grenade (Armor Piercing)",
    "Grenade (Biotoxin)",
    "Grenade (EMP)",
    "Grenade (Flashbang)",
    "Grenade (Incendiary)",
    "Grenade (Poison)",
    "Grenade (Sleep)",
    "Grenade (Smoke)",
    "Grenade (Teargas)"
].includes(itemToken.name)

// Looks for the item in the actor's item list
const delItem = targetActor.items.find(item => item.system.tags == itemToken.id)
if(delItem == null || delItem == undefined){
    ui.notifications.error("unable to remove an item matched to the token ID " + itemToken.id + " from " + targetActor.name + "'s inventory.")
    return;
}

// Ensure that the item is not currently equipped or carried
if(! itemIsGrenade){
    const itemState = delItem.system.equipped
    if(itemState != "owned"){
        ui.notifications.warn("removeCPRItem: the item being removed is currently equipped. The item must be in the 'owned' state before removal");
        return;
    }
}

if(! itemIsGrenade){
    const itemAmmo = delItem.system.magazine.value
    if(itemAmmo != 0){
        ui.notifications.warn("removeCPRItem: the item slated for deletion has ammunition in its magazine. Please unload it before removal");
        return;
    }
}

itemToken.document.delete();