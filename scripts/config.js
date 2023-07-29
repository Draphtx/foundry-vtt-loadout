Hooks.once("init", function () {

    // Enable or disable Loadouts functionality
    game.settings.register("Loadouts", "module-enabled", {
        name: "Enable Loadouts",
        hint: "Turns Loadouts management on and off",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    // Magazine counters
    game.settings.register("Loadouts", "option-magazine-tracking", {
        name: "Enable Magazine Tracking",
        hint: "Where applicable, reflect magazine count using the itemToken's health bar",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

     // Boolean: mooks y/n
     // Text field: ignored items
     // Filepath: equipped status icon
     // Filepath: artwork folder for auto-token generation (blocked)
     // Boolean: show token names
     // 
});