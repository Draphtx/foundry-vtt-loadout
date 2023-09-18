Hooks.once("ready", function () {  // Due to some of the calls we make to populate lists, this can't register at init time
    
    // Dynamic settings

    //// Configure managed item types based on current types present
    let systemItemTypes = new Set();
    game.items.forEach(function(obj){
        systemItemTypes.add(obj.type);
    })
    systemItemTypes = Array.from(systemItemTypes).sort();
    
    if(!systemItemTypes.length > 0) {
        managedItemTypeHint = "no local item types available for configuration; see docs"
    } else {
        managedItemTypeHint = "A comma-separated list of item types to be managed by Loadouts (current game choices are: " + systemItemTypes + ")";
    };

    game.settings.register("loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: managedItemTypeHint,
        scope: "world",
        config: true,
        default: systemItemTypes[0] || null,
        type: String
    });

    //// Configure managed actor types based on current types present
    let systemActorTypes = new Set();
    game.actors.forEach(function(obj){
        systemActorTypes.add(obj.type);
    })
    systemActorTypes = Array.from(systemActorTypes).sort();

    if(!systemActorTypes.length > 0) {
        managedActorTypeHint = "no local actor types available for configuration; see docs"
    } else {
        managedActorTypeHint = "A comma-separated list of actor types to be managed by Loadouts (current game choices are: " + systemActorTypes + ")";
    };

    // Static settings
    game.settings.register("loadouts", "loadouts-managed-actor-types", {
        name: "Managed Actor Types",
        hint: managedActorTypeHint,
        scope: "world",
        config: true,
        default: systemActorTypes[0] || null,
        type: String
    });

    game.settings.register("loadouts", "loadouts-allow-unconfigured-items", {
        name: "Allow Unconfigured Items",
        hint: "Allows players to add unconfigured items to their inventories",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-prefer-local-tiles", {
        name: "Prefer Local Tiles",
        hint: "When adding items, prefer tiles on the currently-viewed scene",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-teleport-to-stash", {
        name: "Enable Remote Stashing",
        hint: "When a 'carried' slot cannot be found, the player may choose to 'teleport' the item back to an uncarried stash",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-full-add-anyway", {
        name: "Enable Add When Full",
        hint: "When no slots are available, the player may choose to add the item to their inventory anyway",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-show-nameplates", {
        name: "Show Token Nameplates",
        hint: "Display the nameplate for Loadouts tokens",
        scope: "world",
        config: true,
        default: 50,
        choices: {
            0: "Never Displayed", 
            10: "When Controlled", 
            20: "Hovered By Owner", 
            30: "Hovered By Anyone", 
            40: "Always For Owner", 
            50: "Always For Everyone"
        },
        type: Number
    });

    game.settings.register("loadouts", "loadouts-stack-bar-attribute", {
        name: "Stack Bar Attribute",
        hint: "The actor attribute used to track stack size. See documentation.",
        scope: "world",
        config: true,
        default: null,
        type: String
    });

    game.settings.register("loadouts", "loadouts-show-stack-bar", {
        name: "Show Stack Bar",
        hint: "For tokens in stacks, display stack quantity using the secondary resource bar. Requires Stack Bar Attribute to be properly set.",
        scope: "world",
        config: true,
        default: 50,
        choices: {
            0: "Never Displayed", 
            10: "When Controlled", 
            20: "Hovered By Owner", 
            30: "Hovered By Anyone", 
            40: "Always For Owner", 
            50: "Always For Everyone"
        },
        type: Number
    });

    game.settings.register("loadouts", "loadouts-stack-overlay", {
        name: "Stacks Overlay Icon",
        hint: "Set a custom icon for stacked Loadouts items",
        scope: "world",
        config: true,
        default: "modules/loadouts/artwork/overlays/stack-overlay.webp",
        type: String
    });

});
