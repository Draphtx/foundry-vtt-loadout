// Allows for a graphical 'loadout' system by adding items (represented by actors) to the specified
//// actor when the item is dragged onto a tile. The equipped state is set as well, depending on 
//// the variable passed by the tile's trigger.

// Do not run any of the following for users who are not using the targeted character
const targetActorID = args[0]
const targetItemState = args[1]
const targetActor = game.actors.find(actor => actor.id == targetActorID)
if(targetActor == null || targetActor == undefined){
    ui.notifications.error("addCPRItem - unable to get targetActor");
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

// Find the most-recent token placed on the canvas and get its actor's name
//// TODO: We should probably do this with a hook, instead of messily looking for the newest token
//// Something like Hooks.on(createToken) if scene is loadout scene then see whether new token is CPRWeaponType etc
const mostRecentTokens = game.scenes.current.tokens.contents
if(mostRecentTokens == null || mostRecentTokens == undefined){
    ui.notifications.error("addCPRItem - unable to find most-recently-placed token for actor");
    return;
}
const itemToken = mostRecentTokens[mostRecentTokens.length - 1]

// If the item is a weapon (non-exotic), bring up the weapon condition dialog
const addedItem = game.items.getName(itemToken.name)
if(addedItem.type == "weapon"){
    const itemIsExotic = [
        "Air Pistol", 
        "Battleglove", 
        "Constitution Arms Hurricane Assault Weapon", 
        "Dartgun", 
        "Flamethrower", 
        "Kendachi Mono-Three", 
        "Malorian Arms 3516", 
        "Microwaver", 
        "Militech \"Cowboy\" U-56 Grenade Launcher", 
        "Rhinemetall EMG-86 Railgun", 
        "Shrieker", 
        "Stun Baton", 
        "Stun Gun", 
        "Tsunami Arms Helix"
    ].includes(itemToken.name)
    if(itemIsExotic){
        addCPRItem()
    } else {
        const weaponConditionDialog = new Dialog({
            title: "Weapon Condition", 
            buttons: {
                poorButton: {
                    label: "Poor",
                    callback: () => addCPRItem("Poor")
                },
                standardButton: {
                    label: "Standard",
                    callback: () => addCPRItem()
                },
                excellentButton: {
                    label: "Excellent",
                    callback: () => addCPRItem("Excellent")
                }
            }
        }).render(true);
    }
};

async function addCPRItem(condition="Standard") {
    if(condition != "Standard"){
        const itemNameWithCondition = itemToken.name + " (" + condition + ")"
        const addedItem = game.items.getName(itemNameWithCondition)
        // Where necessary, change the token name to reflect the condition because as currently implemented
        //// the loadout token name must match the actor's item name exactly. This could be solved some other
        //// ways.
        let modToken = canvas.tokens.get(itemToken.id)
        modToken.update({name: itemNameWithCondition})
    }
    // Add the item with the same name as the actor to the actor's sheet
    if(addedItem == null || addedItem == undefined){
        ui.notifications.error("addCPRItem - unable to find game item with name " + addedItem)
        return;
    }

    // Await the details from the added item
    const newSheetItem = await targetActor.createEmbeddedDocuments('Item', [addedItem.toObject()])
    
    // Find the new item in the character's sheet so that we can update some properties
    const newItem = targetActor.items.contents.find(item => item.id == newSheetItem[0].id)
    if(newItem == null || newItem == undefined){
        ui.notifications.error("addCPRItem - unable to find item " + addedItem.name + "with id " + newSheetItem[0].id + " in inventory of actor " + targetActor.name)
        return;
    }
    newItem.update({"system.equipped": targetItemState})

    // Link the character's item to the token using the itemToken.id
    newItem.update({"system.tags" : itemToken.id})
    console.log("Linked added item " + newItem.id + " to loadout token " + itemToken.id)
    return;
};