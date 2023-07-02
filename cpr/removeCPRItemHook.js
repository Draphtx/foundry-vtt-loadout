// Allows for a graphical 'loadout' system by removing item from the loadout screen when
//// they are removed from a player's inventory

Hooks.on("deleteItem", (document, options, userid) => removeLoadoutItem(document));

function removeLoadoutItem(itemDocument) {
    // const loadoutSceneId = "5lUaZSLIIFO6jTaj"  // TODO: Need to fix the search for this
    const loadoutScene = game.scenes.getName("Crew Loadout")
    const itemTag = itemDocument.system.tags
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.find(token => token.id == itemTag)
    
    if(loadoutItemToken == undefined || loadoutItemToken == null) {
        console.log("removeLoadoutItem: unable to find token " + itemTag + " on loadout scene with id" + loadoutScene.id)
        return;
    } else {
        loadoutItemToken.delete();
        console.log("removeLoadoutItem: item successfully removed")
    }
    Hooks.off("deleteItem")
};