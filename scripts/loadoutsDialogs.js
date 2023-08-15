export function notifyNoValidPositions(itemDocument){
    if(game.settings.get("loadouts", 'loadouts-full-add-anyway')){
        const noSpaceDialog = new Dialog({
            title: "Loadouts Option",
            content: "<center><p>Unable to find an available Loadouts slot.<br>Add " + itemDocument.name + " to inventory regardless?</p></center>",
            buttons: {
                drop: {
                icon: '<i class="fas fa-check"></i>',
                label: "Drop Item",
                callback: () => {
                    itemDocument.delete();
                    return false; }
                },
                add: {
                icon: '<i class="fas fa-times"></i>',
                label: "Add Item",
                callback: () => { return true; }
                }
            },
            default: "drop"
        }).render(true);
    } else {
        ui.notifications.warn("Loadouts: " + itemDocument.parent.name + " has no available slots, \
            and the GM has disabled adding items beyond slot capacity. The item " + itemDocument.name + " will be removed.")
        itemDocument.delete()
        return false;
    }
};

export function notifyNoCarriedPositions(itemDocument){
    if(game.settings.get('loadouts', 'loadouts-teleport-to-stash')){
        const stashOnlyDialog = new Dialog({
            title: "Loadouts Option",
            content: ("<center><p>Unable to find an available Loadouts carry slot.<br>Add " + itemDocument.name + " to " + selectedTile.flags.loadouts.type + "?</center>"),
            buttons: {
                drop: {
                icon: '<i class="fas fa-check"></i>',
                label: "Drop Item",
                callback: () => {
                    itemDocument.delete();
                    return false; }
                },
                add: {
                icon: '<i class="fas fa-times"></i>',
                label: "Add Item",
                callback: () => {
                    return true; }
                },
            },
            default: "drop"
        }).render(true);
    } else {
        ui.notifications.warn("Loadouts: " + itemDocument.parent.name + " has no available carry slots, \
            and the GM has disabled teleporting items to stashes. The item " + itemDocument.name + " will be removed.")
        itemDocument.delete()
        return false;
    }
};