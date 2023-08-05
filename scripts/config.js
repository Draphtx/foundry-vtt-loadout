Hooks.once("init", function () {
    
    // Get all item types for the configuration option
    let systemItemTypes = new Set();
    game.items.forEach(function(obj){
        systemItemTypes.add(obj.type);
    })
    systemItemTypes = Array.from(systemItemTypes).sort();

    game.settings.register("loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: "A comma-separated list of item types to be managed by Loadouts (for " + game.system.id + " choices are: " + systemItemtypes + ")",
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

});


Hooks.once("init", function () {

    // Get all item types for the configuration option
    let systemItemTypes = new Set();
    game.items.forEach(function(obj){
        systemItemTypes.add(obj.type);
    })
    systemItemTypes = Array.from(systemItemTypes).sort();

    game.settings.register("loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: "A comma-separated list of item types to be managed by Loadouts (for " + game.system.id + " choices are: " + systemItemtypes + ")",
        scope: "world",
        config: true,
        default: "weapon",
        type: String
    });

    /* WAITING ON CONFIG SUPPORT INITIATIVE
    game.settings.register("loadouts", "loadouts-allow-unconfigured-items", {
        name: "Allow Unconfigured Items",
        hint: "Allows players to add unconfigured items to their inventories",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    */

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
        default: "character",  // This could also be used for Mooks and vehicles (untested)
        type: String
    });

    /* WAITING ON CONFIG SUPPORT INITIATIVE, ALSO DEPRECATED IN NEAR FUTURE
    game.settings.register("loadouts", "loadouts-magazine-bars", {
        name: "Enable Magazine Bars",
        hint: "Where applicable, reflect magazine count using the itemToken's health bar",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    */

    /* WAITING ON CONFIG SUPPORT INITIATIVE
    game.settings.register("loadouts", "loadouts-teleport-to-stash", {
        name: "Enable Remote Stashing",
        hint: "When a 'carried' slot cannot be found, the player may choose to 'teleport' the item back to an uncarried stash",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    */

    /* WAITING ON CONFIG SUPPORT INITIATIVE
    game.settings.register("loadouts", "loadouts-full-add-anyway", {
        name: "Enable Add When Full",
        hint: "When no slots are available, the player may choose to add the item to their inventory anyway",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    */

    // Display itemToken names on hover
    game.settings.register("loadouts", "loadouts-token-names", {
        name: "Show Token Nameplates",
        hint: "Display the linked item's name as the token's nameplate",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

});