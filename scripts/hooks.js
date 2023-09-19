import { LoadoutsItem, LoadoutsToken } from './loadouts.js';

Hooks.on("createItem", function(document, _, userId) {
    const loadoutsItem = new LoadoutsItem(document, _, userId);
    loadoutsItem.processNewItem();
    Hooks.off("createItem");
});

Hooks.on("deleteItem", function(document) {
    const loadoutsItem = new LoadoutsItem(document);
    loadoutsItem.processRemovedItem()
    Hooks.off("deleteItem");
});

Hooks.on("updateToken", function(tokenDocument, updateData, diffData, userId) {
    const loadoutsToken = new LoadoutsToken(tokenDocument, updateData, diffData, userId);
    loadoutsToken.processUpdatedToken();
    Hooks.off("updateToken");
});

/*
Hooks.on("createSetting", function(settingData, _, _) {
    if(settingData.key.startsWith("loadouts")) {
        const loadoutsSetting = new LoadoutsSettingUpdate(settingData, _, _);
        loadoutsSetting.propagateChange();
    };
    Hooks.off("createSetting");
});
*/
