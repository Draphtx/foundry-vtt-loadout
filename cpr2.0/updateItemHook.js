Hooks.on("updateItem", (document, options, userid) => updateLoadoutItem(document));

async function updateLoadoutItem(itemDocument){
    // This function is only used to update the ammo bars of loadout weapons
    if(! itemDocument.system.magazine){
        console.log("updated item is not a weapon")
        return;
    }

    const loadoutScene = game.scenes.getName("TileTest")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.find(token => token.flags.loadout.item == itemDocument.id)

    if((loadoutItemToken == null) || (loadoutItemToken == undefined)){
        console.log("loadout item not found")
        return;
    }

    loadoutItemToken._actor.system.derivedStats.hp.value = itemDocument.system.magazine.value
    loadoutItemToken.object.refresh()

    Hooks.off("updateItem");
}