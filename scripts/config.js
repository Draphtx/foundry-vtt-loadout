Hooks.once("ready", function () {  // Due to some of the calls we make to populate lists, this can't register at init time
    
    // Get all item types for the configuration option
    let systemItemTypes = new Set();
    game.items.forEach(function(obj){
        systemItemTypes.add(obj.type);
    })
    systemItemTypes = Array.from(systemItemTypes).sort();

    game.settings.register("loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: "A comma-separated list of item types to be managed by Loadouts (for " + game.system.id + " choices are: " + systemItemTypes + ")",
        scope: "world",
        config: true,
        default: "weapon",
        type: String
    });

    // Get all actor types for the configuration option
    let systemActorTypes = new Set();
    game.actors.forEach(function(obj){
        systemActorTypes.add(obj.type);
    })
    systemActorTypes = Array.from(systemActorTypes).sort();

    game.settings.register("loadouts", "loadouts-managed-actor-types", {
        name: "Managed Actor Types",
        hint: "A comma-separated list of actor types that may utilize Loadouts (for " + game.system.id + " choices are: " + systemActorTypes + ")",
        scope: "world",
        config: true,
        default: "character",
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

    // Display itemToken names on hover
    game.settings.register("loadouts", "loadouts-token-names", {
        name: "Show Token Nameplates",
        hint: "Display the linked item's name as the token's nameplate",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-show-stack-bar", {
        name: "Show Stack Bar",
        hint: "For tokens in stacks, display stack quantity using the health bar",
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

    // Stacked item overlay icon
    game.settings.register("loadouts", "loadouts-stack-overlay", {
        name: "Stacks Overlay Icon",
        hint: "Set a custom icon for stacked Loadouts items",
        scope: "world",
        config: true,
        default: "modules/loadouts/artwork/overlays/stack-overlay.webp",
        type: String
    });

});
