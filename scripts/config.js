Hooks.once("init", function () {

    // Display itemToken names on hover
    game.settings.register("loadouts", "loadouts-token-names", {
        name: "Show Token Nameplates",
        hint: "Display the linked item's name as the token's nameplate",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: "A comma-separated list of item types to be managed by Loadouts",
        scope: "world",
        config: true,
        default: "weapon",
        type: String
    });

    // Magazine counters
    game.settings.register("loadouts", "loadouts-allow-unconfigured-items", {
        name: "Allow Unconfigured Items",
        hint: "Allows players to add unconfigured items to their inventories",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("loadouts", "loadouts-managed-actor-types", {
        name: "Managed Actor Types",
        hint: "A comma-separated list of actor types that may utilize Loadouts",
        scope: "world",
        config: true,
        default: "character",  // This could also be used for Mooks and vehicles (untested)
        type: String
    });

    // Magazine counters
    game.settings.register("loadouts", "loadouts-magazine-bars", {
        name: "Enable Magazine Bars",
        hint: "Where applicable, reflect magazine count using the itemToken's health bar",
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

});