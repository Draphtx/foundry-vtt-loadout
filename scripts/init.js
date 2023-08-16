import { LoadoutsItem, LoadoutsToken } from './loadouts.js';

Hooks.once("ready", function () {
    window.LoadoutsRegistry = window.LoadoutsRegistry || {
        tokenClasses: {
            loadoutsItem: LoadoutsItem,
            loadoutsToken: LoadoutsToken,
        },
        registerTokenClass: function(systemName, tokenClass) {
            this.tokenClasses[systemName] = tokenClass;
        },
        getTokenClass: function(systemName) {
            return this.tokenClasses[systemName] || this.tokenClasses.default;
        }
    };
    Hooks.call('loadoutsReady'); // Let child modules know that they may register their class extensions
    console.log('%c▞▖ Foundry VTT Loadouts Initialized ▞▖', 'color:#FFFFFF; background:#72e8c4; padding:10px; border-radius:5px; font-size:14px');
});