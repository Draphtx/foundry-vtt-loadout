import { LoadoutsItem, LoadoutsToken } from './loadouts.js';

Hooks.once("ready", function () {
    window.LoadoutsRegistry = window.LoadoutsRegistry || {
        tokenClasses: {
            default: LoadoutsToken
        },
        itemClasses: {
            default: LoadoutsItem
        },
        registerTokenClass: function(systemName, tokenClass) {
            this.tokenClasses[systemName] = tokenClass;
        },
        registerItemClass: function(systemName, itemClass) {
            this.tokenClasses[systemName] = itemClass;
        },
        getTokenClass: function(systemName) {
            return this.tokenClasses[systemName] || this.tokenClasses.default;
        },
        getItemClass: function(systemName) {
            return this.itemClasses[systemName] || this.itemClasses.default;
        }
    };
    Hooks.call('loadoutsReady'); // Let child modules know that they may register their class extensions
    console.log('%c▞▖ Foundry VTT Loadouts Initialized ▞▖', 'color:#FFFFFF; background:#72e8c4; padding:10px; border-radius:5px; font-size:14px');
});