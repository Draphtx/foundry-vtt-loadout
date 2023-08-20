function processTokenForSystem(...args) {
    const tokenClass = LoadoutsRegistry.getTokenClass(game.system.id) || LoadoutsRegistry.getTokenClass('default');
    return new TokenClass(...args);
}

function processItemForSystem(...args) {
    const itemClass = LoadoutsRegistry.getItemClass(game.system.id) || LoadoutsRegistry.getItemClass('default');
    return new itemClass(...args);
}

Hooks.on("createItem", function(document, _, userId){
    const loadoutsItem = processItemForSystem(document, _, userId);
    loadoutsItem.processNewItem();
    Hooks.off("createItem");
});

Hooks.on("deleteItem", function(document){
    const loadoutsItem = processItemForSystem(document);
    loadoutsItem.processRemovedItem()
    Hooks.off("deleteItem");
});

Hooks.on("updateToken", function(tokenDocument, updateData, diffData, userId){
    const loadoutsToken = processTokenForSystem(tokenDocument, updateData, diffData, userId);
    loadoutsToken.processUpdatedToken();
    Hooks.off("updateToken");
});

Hooks.on("updateItem", function(doc, updateData){
    const loadoutsItem = processItemForSystem(doc, updateData);
    loadoutsItem.processUpdatedItem();
    Hooks.off("updateItem");
});