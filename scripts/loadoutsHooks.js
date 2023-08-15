import { LoadoutsToken } from './loadoutsToken.js';
console.log('%c▞▖ Foundry VTT Loadouts Initialized ▞▖', 'color:#FFFFFF; background:#72e8c4; padding:10px; border-radius:5px; font-size:14px');

// This registry lets child modules register with Loadouts for extended functionality.
// This is also where we will register our default class.
window.LoadoutsRegistry = window.LoadoutsRegistry || {
    tokenClasses: {
        default: LoadoutsToken
    },
    registerTokenClass: function(systemName, tokenClass) {
        this.tokenClasses[systemName] = tokenClass;
    },
    getTokenClass: function(systemName) {
        return this.tokenClasses[systemName] || this.tokenClasses.default;
    }
};
Hooks.call('loadoutsReady'); // Let child modules know that they may register their class extensions

Hooks.on("createItem", function(itemDocument, options, userid){
    const loadoutsToken = new LoadoutsToken(itemDocument);
    loadoutsToken.processNewItem();
    Hooks.off("createItem");
});

Hooks.on("deleteItem", function(itemDocument, options, userid){
    const loadoutsToken = new LoadoutsToken(itemDocument);
    loadoutsToken.processRemovedItem()
    Hooks.off("deleteItem");
});

// UPDATE TOKEN HOOK
//// Updates a linked item's equip state based on the which Loadouts tile it lands on when moved by a player
Hooks.on("updateToken", (document, diff, sceneId, userId) => updateLoadoutsToken(document, diff, sceneId, userId));

function updateLoadoutsToken(tokenDocument, diff, scene, userId){
    // Do not respond to updateToken events unless the token is a Loadouts token, the scene is a Loadouts scene, 
    //// and there has been token movement
    if((! tokenDocument.parent.flags?.loadouts?.isLoadoutsScene) || (! tokenDocument.flags.hasOwnProperty('loadouts')) || ((! diff.x > 0) && (! diff.y > 0))){
        return;
    }

    // Find the actor who owns the item linked to the Loadouts token
    triggeringUser = game.users.find(user => user.id == userId)
    tokenOwner = game.actors.get(tokenDocument.flags.loadouts.owner)
    if((tokenOwner == null) || (tokenOwner == undefined)){
        console.warn("▞▖Loadouts: unable to find an item owner associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    if((tokenOwner.id != triggeringUser.id) && (triggeringUser.role != 4)){
        // TODO: This is not technically true for now - they can move the token, but they'll get a warning
        ui.notification.warn("Loadouts: users can only move Loadouts tokens linked to an item in their inventory")        
        return;
    }
    linkedItems = tokenDocument.flags.loadouts.stack.members
    if(!linkedItems.length > 0){
        console.warn("▞▖Loadouts: unable to find item(s) associated with a token recently updated by " + triggeringUser.name)
        return;
    }
    
    // Find Loadouts tiles owned by the item's owner
    let validTiles = tokenDocument.parent.tiles.filter(
        tile => tile.flags.loadouts).filter(
            tile => tile.flags.loadouts.owner == tokenOwner.id)
    
    var selectedTile = null
    for(const loadoutsTile of validTiles){
        if((tokenDocument.x >= loadoutsTile.x && tokenDocument.x <= loadoutsTile.x + loadoutsTile.width) && 
        (tokenDocument.y >= loadoutsTile.y && tokenDocument.y <= loadoutsTile.y + loadoutsTile.height)){
            selectedTile = loadoutsTile;
            break;
        }
    }

    if(! selectedTile){
        ui.notifications.warn("Loadouts: " + triggeringUser.name + " placed a Loadouts token outside of a Loadouts tile.")
        return;
    }

    Hooks.off("updateToken")
    return;
}