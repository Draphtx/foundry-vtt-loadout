import { LoadoutsItem, LoadoutsToken } from './loadouts.js';

Hooks.on("createItem", function(document, _, userId){
    const loadoutsItem = new loadoutsItem(document);
    loadoutsToken.processNewItem();
    Hooks.off("createItem");
});

Hooks.on("deleteItem", function(document){
    const loadoutsItem = new LoadoutsItem(document);
    loadoutsItem.processRemovedItem()
    Hooks.off("deleteItem");
});

Hooks.on("updateToken", function(tokenDocument, updateData, options, userId){
    const loadoutsToken = new LoadoutsToken(tokenDocument);
    loadoutsToken.processUpdatedToken();
    Hooks.off("updateToken");
});
