Hooks.once("init", function () {

    // Display itemToken names on hover
    game.settings.register("Loadouts", "loadouts-token-names", {
        name: "Show Token Nameplates",
        hint: "Display the linked item's name as the token's nameplate",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    // Magazine counters
    game.settings.register("Loadouts", "loadouts-magazine-bars", {
        name: "Enable Magazine Bars",
        hint: "Where applicable, reflect magazine count using the itemToken's health bar",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("Loadouts", "loadouts-teleport-to-stash", {
        name: "Enable Remote Stashing",
        hint: "When a 'carried' slot cannot be found, allow the player to 'teleport' the item back to an uncarried stash",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("Loadouts", "loadouts-full-add-anyway", {
        name: "Enable Add When Full",
        hint: "When no slots are available, allow the player to add the item to their inventory anyway",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    // Enable for mooks
    game.settings.register("Loadouts", "loadouts-enable-mooks", {
        name: "Enable Mook Support",
        hint: "Manage mook inventories as well, where tiles are provided",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("Loadouts", "loadouts-artwork-path", {
        name: "Item Artwork Path",
        hint: "Change item artwork path. Be sure to review the documentation for proper file-naming convention",
        scope: "world",
        config: true,
        default: "modules/Loadouts/artwork/items",
        type: String
    });

    game.settings.register("Loadouts", "loadouts-ignored-items", {
        name: "Ignored Items",
        hint: "A comma-separated list of in-game weapon items to exclude from management (e.g. Martial Arts)",
        scope: "world",
        config: true,
        default: 'Martial Arts,Battleglove,Rippers,Unarmed,Thrown Weapon',
        type: String
    });

    game.settings.register("Loadouts", "loadouts-managed-item-types", {
        name: "Managed Item Types",
        hint: "A comma-separated list of item types to be managed by Loadouts",
        scope: "world",
        config: true,
        default: "weapon",
        type: String
    });

    game.settings.register("Loadouts", "loadouts-managed-actor-types", {
        name: "Managed Actor Types",
        hint: "A comma-separated list of actor types that may utilize Loadouts",
        scope: "world",
        config: true,
        default: "character",  // This could also be used for Mooks and vehicles (untested)
        type: String
    });

     // Boolean: mooks y/n
     // Text field: ignored items
     // Filepath: equipped status icon
     // Filepath: artwork folder for auto-token generation (blocked)

});