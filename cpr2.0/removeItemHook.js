// Allows for a graphical 'loadout' system by removing item from the loadout screen when
//// they are removed from a player's inventory

Hooks.on("deleteItem", (document, options, userid) => removeLoadoutItem(document));

function removeLoadoutItem(itemDocument) {
    const loadoutScene = game.scenes.getName("TileTest")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.find(token => token.flags.loadout.item == itemDocument.id)
    
    if(loadoutItemToken == undefined || loadoutItemToken == null) {
        ui.notifications.error("removeLoadoutItem: unable to find token related to " + itemDocument.id + " on loadout scene with id" + loadoutScene.id)
        return;
    } else {
        loadoutItemToken.delete();
        ui.notifications.info("Removed " + itemDocument.name + " from " + itemDocument.parent.name + "'s loadout")
    }
    Hooks.off("deleteItem")
};