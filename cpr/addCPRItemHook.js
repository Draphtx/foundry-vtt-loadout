Hooks.on("createItem", (document, options, userid) => addLoadoutItem(document));

async function addLoadoutItem(itemDocument) {
    // Do not try to handle item management for NPCs
    if(itemDocument.parent.type != "character"){
        return;
    }

    // Only handle weapons and, by extension, grenades
    var itemIsGrenade
    if((! itemDocument.type == "weapon") && (! itemDocument.type == "ammo")){
        return;
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
            return;
        }
    }
    
    // Find the dropbox tile for the parent actor
    const loadoutScene = game.scenes.getName("Crew Loadout")
    const allDropBoxes = loadoutScene.tiles.filter(t => t.texture.src == "https://assets.forge-vtt.com/601587bb07190278cd7d8606/Cyberpunk/loadouts/tiles/dropbox.webp")
    const actorDropBox = allDropBoxes.filter(tile => tile.flags["monks-active-tiles"].actions[0].data.args == itemDocument.parent._id)[0]

    // Using the dropbox's coordinates in the scene, decide on where in the tile 
    // (roughly the middle, yeah?) to drop a new item token
    const dropZoneX = actorDropBox.x + (actorDropBox.width / 2 - 50)
    const dropZoneY = actorDropBox.y + (actorDropBox.height / 2 -50)

    // Find an actor associated with the weapon (or Grenade)
    // We need to account for quality here, too. Should I just make actors for each quality-effected 
    //// weapon type so that we don't have to do this switcheroo? It's coming up repeatedly.
    var itemActor
    if(itemDocument.type == "weapon"){
        if(itemDocument.system.quality == "poor") {
            itemActor = game.actors.getName(itemDocument.name.split(" (Poor)")[0])
        } else if(itemDocument.system.quality == "excellent") {
            itemActor = game.actors.getName(itemDocument.name.split(" (Excellent)")[0])
        } else {
            itemActor = game.actors.getName(itemDocument.name)
        }
    } else {
        itemActor = game.actors.getName(itemDocument.name)
    }

    // Add the actor's token to the dropbox
    const itemTokenDoc = await itemActor.getTokenDocument({x: dropZoneX, y: dropZoneY, name: itemDocument.name})
    const addedToken = await loadoutScene.createEmbeddedDocuments("Token", [itemTokenDoc])

    // Link the item to the token's id
    const targetActor = game.actors.find(actor => actor.id == itemDocument.parent._id)
    const newItem = targetActor.items.contents.find(item => item.id == itemDocument.id)
    newItem.update({"system.tags" : addedToken[0]._id})
    console.log("linked token to item id")
    
    Hooks.off("createItem")
}