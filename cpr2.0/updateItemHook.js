Hooks.on("updateItem", (document, options, userid) => updateLoadoutItem(document));

async function updateLoadoutItem(itemDocument){
    // This function is only used to update the ammo bars of loadout weapons
    if(! itemDocument.system.magazine){
        return;
    } else if(itemDocument.system.magazine.max == 0){
        return;
    }

    const loadoutScene = game.scenes.getName("Crew Loadout")
    const loadoutItemToken = game.scenes.get(loadoutScene.id).tokens.contents.filter(token => token.flags.loadout).find(token => token.flags.loadout.item == itemDocument.id)

    if((loadoutItemToken == null) || (loadoutItemToken == undefined)){
        console.log("loadout item not found")
        return;
    }

    // TODO: Look at giving each weapon actor one of its own items in its inventory; then we can use the
    //// magazine attribute to fill the bars instead of hijacking hp
    loadoutItemToken.update({actorData: {system: {derivedStats: {hp: {value: itemDocument.system.magazine.value}}}}})

    Hooks.off("updateItem");
}