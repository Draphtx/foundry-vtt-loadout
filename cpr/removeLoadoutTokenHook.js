Hooks.on("deleteToken", (document, options, userid) => addLoadoutItem(document));

async function addLoadoutItem(tokenDocument) {
    // Don't run for tokens on other scenes
    if(! tokenDocument.parent.name == "Crew Loadout"){
        return;
    }
    
    // Find the dropbox tile for the parent actor
    const loadoutScene = game.scenes.getName("Crew Loadout")
    const allStashTiles = loadoutScene.tiles.filter(t => t.texture.src == "https://assets.forge-vtt.com/601587bb07190278cd7d8606/Cyberpunk/loadouts/tiles/dropbox.webp")
    const actorStashTile = allStashTiles.filter(tile => tile.flags["monks-active-tiles"].actions[0].data.args == itemDocument.parent._id)[0]

    // Using the stash tile's coordinates in the scene, decide on where in the stash (roughly the middle, yeah?) to drop a new item token
    const dropZoneX = actorStashTile.x + (actorStashTile.width / 2 - 50)
    const dropZoneY = actorStashTile.y + (actorStashTile.height / 2 -50)

    // Find an actor associated with the weapon (or Grenade)
    // We need to account for quality here, too. Should I just make actors for each quality-effected 
    //// weapon type so that we don't have to do this switcheroo?
    var itemActor
    if(itemDocument.system.quality == "poor") {
        itemActor = game.actors.getName(itemDocument.name.split(" (Poor)")[0])
    } else if(itemDocument.system.quality == "excellent") {
        itemActor = game.actors.getName(itemDocument.name.split(" (Excellent)")[0])
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
