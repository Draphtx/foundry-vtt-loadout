Hooks.once("init", function () {

    // Enable or disable Loadouts functionality
    game.settings.register("Loadouts", "loadouts-enabled", {
        name: "Enable Loadouts",
        hint: "Turns Loadouts management on and off",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    // Display itemToken names on hover
    game.settings.register("Loadouts", "loadouts-token-names", {
        name: "Show Token Nameplates",
        hint: "Display the linked item's name as the token's nameplate",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    // Magazine counters
    game.settings.register("Loadouts", "loadouts-magazine-bars", {
        name: "Enable Magazine Bars",
        hint: "Where applicable, reflect magazine count using the itemToken's health bar",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    // Enable for mooks
    game.settings.register("Loadouts", "loadouts-enable-mooks", {
        name: "Enable Mook Support",
        hint: "Manage mook inventories as well, where applicable",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

     // Boolean: mooks y/n
     // Text field: ignored items
     // Filepath: equipped status icon
     // Filepath: artwork folder for auto-token generation (blocked)

});