Hooks.on("updateItem", (document, options, userid) => updateLoadoutItem(document));

async function updateLoadoutItem(itemDocument){
    // This function is only used to update the ammo bars of loadout weapons
    if(! itemDocument.system.magazine){
        console.log("updated item is not equipped with a magazine")
        return;
    }

    const loadoutScene = game.scenes.getName("TileTest")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.find(token => token.flags.loadout.item == itemDocument.id)

    if((loadoutItemToken == null) || (loadoutItemToken == undefined)){
        console.log("loadout item not found")
        return;
    }

    // TODO: Look at giving each weapon actor one of its own items in its inventory; then we can use the
    //// magazine attribute to fill the bars instead of hijacking hp
    loadoutItemToken.update({system: {derivedStats: {hp: {value: itemDocument.system.magazine.value}}}})

    Hooks.off("updateItem");
}