// Allows for a graphical 'loadout' system by modifying the 'equipped' state of an actor's item 
//// when the item is dragged onto a tile. The equipped state is passed by the tile trigger.

// Get the target actor
const targetActorID = args[0]
const targetItemState = args[1]
const targetActor = game.actors.find(actor => actor.id == targetActorID)
if(targetActor == null || targetActor == undefined){
    ui.notifications.error("updateCPRItemState - unable to get targetActor");
    return;
}

// Ensure that the player is either the owner of the targetActor OR that the player is the GM and no one else is active
const triggeringCharacter = game.user.character
if(triggeringCharacter != null && triggeringCharacter != undefined){
    if(triggeringCharacter._id != targetActorID){
        return;
    }
} else if(game.user.role == 4){
    if(game.users.filter(user => user.active == true).length != 1){
        ui.notifications.warn("GM cannot modify loadouts while other players are present");
        return;
    } 
}

// Get the name of the item from the controlled token
const itemToken = canvas.tokens.controlled[0]

// Identify the item for updating in an actor's items
const updateItem = targetActor.items.find(item => item.system.tags == itemToken.id)
if(updateItem == null || updateItem == undefined){
    ui.notifications.error("updateCPRItemState - unable to get updateItem");
    return;
}

// Update the item's equipped state
updateItem.update({"system.equipped": targetItemState})