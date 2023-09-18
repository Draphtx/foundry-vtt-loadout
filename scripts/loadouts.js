import { notifyNoValidPositions, notifyNoCarriedPositions } from './loadoutsDialogs.js';

class LoadoutsObject {
    constructor(objectDocument) {
        this.objectDocument = objectDocument;
    };

    getViewedScene() {
        return game.user.viewedScene;
    };

    getActiveScene() {
        return game.scenes.active.id;
    };

    /**
     * Set a nested property of an object based on a dot-separated string path.
     * 
     * @param {object} obj - The target object.
     * @param {string} path - The dot-separated path to the property.
     * @param {any} value - The value to set.
     */
    setNestedProperty(obj, path, value) {
        let parts = path.split('.');
        let last = parts.pop();
        let target = parts.reduce((o, part) => o[part] = o[part] || {}, obj);
        target[last] = value;
    };

    findValidTiles() {
        const loadoutsScenes = game.scenes.filter(
            scene => scene.flags.loadouts).filter(
                scene => scene.flags.loadouts.isLoadoutsScene == true);
        
        if((loadoutsScenes == null) || (loadoutsScenes == undefined)) {
            console.warn("Loadouts | unable to find any scenes flagged for Loadouts. Please be sure to complete scene and tile setup as described in the documentation.")
            return;
        };
        
        let validTiles = []
        for(let loadoutsScene of loadoutsScenes) {
            let loadoutsTiles = loadoutsScene.tiles.filter(
                tile => tile.flags.loadouts).filter(
                    tile => tile.flags.loadouts.owner == this.objectDocument.parent.id).filter(
                        tile => {
                            const allowedTypes = tile.flags.loadouts?.allowed_types;
                        
                            // If allowedTypes is set but doesn't include objectDocument.system.type, we reject the tile.
                            if (allowedTypes && !allowedTypes.split(',').includes(this.objectDocument.type)) {
                                return false;
                            }
                        
                            // If allowedTypes is null or undefined, or if it includes objectDocument.system.type, we continue with the size check.
                            return Math.max(tile.height/tile.parent.grid.size, tile.width/tile.parent.grid.size) >= Math.max(this.objectDocument.flags.loadouts.width, this.objectDocument.flags.loadouts.height);
                        }
                    )
            validTiles = [...validTiles, ...loadoutsTiles]
        };
    
        // Return the valid tiles, sorted by preference weight
        return validTiles.sort((a, b) => a.flags.loadouts.weight - b.flags.loadouts.weight);
    };
};

export class LoadoutsItem extends LoadoutsObject {
    constructor(objectDocument, _, userId) {
        super(objectDocument);
        this.itemRotation = 0;
        this.isStack = this.objectDocument.flags?.loadouts?.stack?.max > 1;
    };

    verifyItemSuitability() {
        const managedActorTypes = game.settings.get("loadouts", "loadouts-managed-actor-types");
        const managedItemTypes = game.settings.get("loadouts", "loadouts-managed-item-types");
        const allowUnconfiguredItems = game.settings.get('loadouts', 'loadouts-allow-unconfigured-items');
        function logSuitabilityFailure(reason=undefined) {
            console.debug(`Loadouts | item ${this.objectDocument.name} skipped by suitability checks: ${reason}`);
        };
        
        // Do not try to handle item management for unwanted actor types
        if (!managedActorTypes.includes(this.objectDocument.parent.type)) {
            logSuitabilityFailure("parent of added item is not of managed type");
            return false;
        };
    
        if (!managedItemTypes.includes(this.objectDocument.type)) {
            logSuitabilityFailure("added item is not of managed type");
            return false;
        };
    
        if ("loadouts" in this.objectDocument.flags) {
            return true;
        };
    
        if (allowUnconfiguredItems) {
            logSuitabilityFailure("added item is not configured (but unconfigured items are allowed)");
            return false;
        };
    
        ui.notifications.warn(`Loadouts: cannot add '${this.objectDocument.name}' to ${this.objectDocument.parent.name}'s inventory. The GM has disabled the ability \
            to add ${this.objectDocument.type} items that are not configured for Loadouts.`);
        this.objectDocument.delete();
        return false;
    };

    findValidStack() {
        function isInLoadoutsTileArea(token, tile) {
            return token.x >= tile.x && token.x <= (tile.x + tile.width) &&
                    token.y >= tile.y && token.y <= (tile.y + tile.height);
        };
    
        const isValidStack = (token) => {
            return token.flags.loadouts.truename == this.objectDocument.name && 
                   (token.flags?.loadouts?.stack?.members?.length + 1) <= (this.objectDocument?.flags?.loadouts?.stack?.max);
        };
        
        for (const loadoutsTile of this.validTiles) {
            let validStacks = loadoutsTile.parent.tokens.filter(
                t => isInLoadoutsTileArea(t, loadoutsTile) && isValidStack(t)
            );
            
            if (validStacks.length) {
                return [loadoutsTile, validStacks[0]];
            };
        };
        return [false, false];
    };

    updateStack(loadoutsTile, loadoutsStack) {
        const membershipIds = [...loadoutsStack.flags.loadouts.stack.members];
        membershipIds.push(this.objectDocument.id); 
    
        const updateData = {
            name: `${loadoutsStack.flags.loadouts.truename} (x${membershipIds.length})`,
            displayName: game.settings.get("loadouts", "loadouts-show-nameplates"),
            displayBars: game.settings.get("loadouts", "loadouts-show-item-bars"),
            bar2: {
                attribute: game.settings.get("loadouts", "loadouts-stack-bar-attribute") || null
            },
            flags: {
                loadouts: {
                    stack: {
                        members: membershipIds
                    }
                }
            }
        };

        if(!game.settings.get("loadouts", "loadouts-stack-bar-attribute") == null) {
            this.setNestedProperty(updateData.actorData.system, `${game.settings.get("loadouts", "loadouts-stack-bar-attribute")}.max`, this.objectDocument.flags.loadouts.stack.max);
            this.setNestedProperty(updateData.actorData.system, `${game.settings.get("loadouts", "loadouts-stack-bar-attribute")}.value`, membershipIds.length);
        };
    
        if (membershipIds.length > 1) {
            updateData.overlayEffect = game.settings.get("loadouts", "loadouts-stack-overlay");
        };
        
        try {
            loadoutsStack.update(updateData);
            ui.notifications.info(`Loadouts: ${this.objectDocument.parent.name} added ${this.objectDocument.name} to an existing stack in ${loadoutsTile.parent.name}`);
            return true;
        } catch (error) {
            console.warn(`Loadouts | unable to update stack ${loadoutsStack.id}`);
            console.error(`Loadouts | ${error}`);
            return false;
        };
    };

    processNewItem() {
        // Perform checks to ensure that the item is one we will try to handle using the loadout system
        if(! this.verifyItemSuitability()) {
            return;
        }

        // Get tiles that could _potentially_ hold the payload based on geometry and ownership
        this.validTiles = super.findValidTiles();

        // Add stacked items to existing stacks, if possible
        if(this.isStack) {
            const [loadoutsTile, loadoutsStack] = this.findValidStack();
            if(loadoutsTile) {
                if(this.updateStack(loadoutsTile, loadoutsStack)) {
                    return;
                };
            };
        };

        // Otherwise, try to create a new token
        const loadoutsToken = new LoadoutsToken(this.objectDocument);
        loadoutsToken.createNewToken();
    };

    locateRemovedItem() {
        const getLoadoutsScenes = () => {
            return game.scenes.filter(scene => scene.flags?.loadouts?.isLoadoutsScene);
        };
        
        const findItemTokenInScene = (scene) => {
            return scene.tokens.contents.find(token => 
                token.flags.loadouts?.stack?.members?.includes(this.objectDocument.id)
            );
        };
        
        const findItemTokenAcrossScenes = (scenes) => {
            let loadoutsItemToken = null; // Initialized to null instead of false for clarity
            for (const loadoutsScene of scenes) {
                loadoutsItemToken = findItemTokenInScene(loadoutsScene);
                if (loadoutsItemToken) break;
            };
            return loadoutsItemToken;
        };
        
        const loadoutsScenes = getLoadoutsScenes();
        this.removedItemToken = findItemTokenAcrossScenes(loadoutsScenes);
    };
    
    removeLoadoutsItem() {
        const membersArray = this.removedItemToken.flags.loadouts.stack.members;
        const index = membersArray.indexOf(this.objectDocument.id);
        
        if (index > -1) {
            membersArray.splice(index, 1);
        };

        if (membersArray.length > 0) {
            this.removedItemToken.update({
                name: this.objectDocument.name + (membersArray.length > 1 ? ` (x${membersArray.length})` : ''),
                displayName: game.settings.get("loadouts", "loadouts-show-nameplates"),
                displayBars: game.settings.get("loadouts", "loadouts-show-item-bars"),
                bar2: {
                    attribute: game.settings.get("loadouts", "loadouts-stack-bar-attribute") || null
                },
                flags: {
                    loadouts: {
                        stack: {
                            members: membersArray}
                        }
                    },
                });

                if(!game.settings.get("loadouts", "loadouts-stack-bar-attribute") == null) {
                    this.setNestedProperty(updateData.actorData.system, `${game.settings.get("loadouts", "loadouts-stack-bar-attribute")}.max`, this.objectDocument.flags.loadouts.stack.max);
                    this.setNestedProperty(updateData.actorData.system, `${game.settings.get("loadouts", "loadouts-stack-bar-attribute")}.value`, membershipIds.length);
                };
            ui.notifications.info(`Loadouts: ${this.objectDocument.parent.name} removed '${this.objectDocument.name}' from a stack in '${this.removedItemToken.parent.name}'`);
            if(membersArray.length == 1) {
                this.removedItemToken.update({
                    overlayEffect: "",
                    name: this.objectDocument.name,
                })
            };
        } else {
            const loadoutsToken = new LoadoutsToken(this.removedItemToken);
            loadoutsToken.removeLoadoutsToken();
        };
    };

    processRemovedItem() {
        if (!this.objectDocument.flags.loadouts) { return; };
    
        this.locateRemovedItem()
        if(!this.removedItemToken) {
            console.warn(`Loadouts | unable to find Loadouts token related to ${this.objectDocument.id} on any Loadouts scene`);
            return;
        } else {
            this.removeLoadoutsItem(this.objectDocument);
        };
    };
};

export class LoadoutsToken extends LoadoutsObject {
    constructor(objectDocument, updateData, diffData, userId) {
        super(objectDocument);
        this.diffData = diffData;
        this.updateData = updateData;
        this.userId = userId;
        this.triggeringUser = game.users.find(user => user.id == this.userId);
    };

    processUpdatedToken() {
        if((! this.objectDocument.parent.flags?.loadouts?.isLoadoutsScene) || 
            (! this.objectDocument.flags.hasOwnProperty('loadouts')) || 
            ((! this.updateData.x > 0) && (! this.updateData.y > 0))) { return; };
            
        // Find the actor who owns the item linked to the Loadouts token
        this.tokenOwner = game.actors.get(this.objectDocument.flags.loadouts.owner);
        if((this.tokenOwner == null) || (this.tokenOwner == undefined)) {
            console.warn(`Loadouts | unable to find an item owner associated with a token recently updated by ${this.triggeringUser.name}`);
            return;
        };
        if((this.tokenOwner.id != this.triggeringUser.id) && (this.triggeringUser.role != 4)) {
            // TODO: This is not technically true for now - they can move the token, but they'll get a warning
            ui.notification.warn(`Loadouts: users can only move Loadouts tokens linked to an item in their inventory`)
            return;
        };

        const linkedItems = this.objectDocument.flags.loadouts.stack.members
        if(!linkedItems.length > 0) {
            console.warn(`Loadouts | unable to find item(s) associated with a token recently updated by ${this.triggeringUser.name}`);
            return;
        };
        
        // Find Loadouts tiles owned by the item's owner
        let validTiles = this.objectDocument.parent.tiles.filter(
            tile => tile.flags.loadouts).filter(
                tile => tile.flags.loadouts.owner == this.tokenOwner.id)
        
        var selectedTile = null
        for(const loadoutsTile of validTiles) {
            if((this.objectDocument.x >= loadoutsTile.x && this.objectDocument.x <= loadoutsTile.x + loadoutsTile.width) && 
            (this.objectDocument.y >= loadoutsTile.y && this.objectDocument.y <= loadoutsTile.y + loadoutsTile.height)) {
                selectedTile = loadoutsTile;
                break;
            };
        };
    
        if(! selectedTile) {
            ui.notifications.warn("Loadouts: " + this.triggeringUser.name + " placed a Loadouts token outside of a Loadouts tile.")
            return;
        };
    };

    /**
     * Checks if a token/item lies completely within the specified boundaries.
     * @param {Object} token - The token or item with x1, y1, x2, y2 properties.
     * @param {Object} boundary - The boundary with x, y, width, height properties.
     * @returns {boolean} - True if the token lies within the boundary, false otherwise.
     */
    isWithinBoundary(token, boundary) {
        return (
            token.x1 >= boundary.x && 
            token.y1 >= boundary.y &&
            token.x2 <= boundary.x + boundary.width &&
            token.y2 <= boundary.y + boundary.height
        );
    };

    findTilePositions() {
        // Prefer tiles in the scene that the user is currently viewing
        let orderedTiles = null;
        if(game.settings.get("loadouts", "loadouts-prefer-local-tiles")){
            const localTiles = this.validTiles.filter(tile => tile.parent.id == this.getViewedScene());
            const remoteTiles = this.validTiles.filter(tile => tile.parent.id != this.getViewedScene());
            orderedTiles = [...localTiles, ...remoteTiles];
        } else {
            orderedTiles = this.validTiles;
        };
        for (const loadoutsTile of orderedTiles) {
            let tilePositions = this.filterTilePositions(loadoutsTile, this.objectDocument.flags.loadouts.width, this.objectDocument.flags.loadouts.height);
            if((!tilePositions.length) && (!this.objectDocument.flags.loadouts?.orientationLock)) {
                if(this.objectDocument.flags.loadouts.width != this.objectDocument.flags.loadouts.height) {
                    tilePositions = this.filterTilePositions(loadoutsTile, this.objectDocument.flags.loadouts.height, this.objectDocument.flags.loadouts.width)
                    if(tilePositions.length) {
                        this.itemRotation = 90
                    };
                };
            };
            if(tilePositions.length) {
                this.selectedTile = loadoutsTile;
                this.selectedPosition = tilePositions[0];
                break;
            };
        };
    };

    filterTilePositions(loadoutsTile, itemSizeW, itemSizeH) {
        // TODO: need a way to 'reserve' certain slots at the tile configuration level, such that the whole slot is used (preferably)
        //// Currently we are covering for this by highly-prioritizing single-item slots, but that's just smoke & mirrors
        let itemPositions = []
        for(let rowNum of Array(loadoutsTile.height/loadoutsTile.parent.grid.size).keys()) {
            for(let colNum of Array(loadoutsTile.width/loadoutsTile.parent.grid.size).keys()) {
                let tilePosition = {
                    "x1": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size), 
                    "y1": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size), 
                    "x2": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size) + (itemSizeW * loadoutsTile.parent.grid.size), 
                    "y2": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size) + (itemSizeH * loadoutsTile.parent.grid.size)
                };
                if (this.isWithinBoundary(tilePosition, {x: loadoutsTile.x, y: loadoutsTile.y, width: loadoutsTile.width, height: loadoutsTile.height})) {
                    itemPositions.push(tilePosition);
                };
            };
        };
        
        // Find any tokens that may already be over the tile's area
        let blockingTokens = loadoutsTile.parent.tokens.filter(
            t => t.x >= loadoutsTile.x <= (loadoutsTile.x + loadoutsTile.width) && 
                    t.y >= loadoutsTile.y <=(loadoutsTile.y + loadoutsTile.height))
        
        function overlaps(tokenA, tokenB) {
            return !(tokenA.x2 <= tokenB.x1 || tokenA.x1 >= tokenB.x2 || tokenA.y2 <= tokenB.y1 || tokenA.y1 >= tokenB.y2);
        };
        
        for(let blockingToken of blockingTokens) {
            const blockingBoundary = {
                x1: blockingToken.x,
                y1: blockingToken.y,
                x2: blockingToken.x + blockingToken.width * loadoutsTile.parent.grid.size,
                y2: blockingToken.y + blockingToken.height * loadoutsTile.parent.grid.size
            };
            itemPositions = itemPositions.filter(p => !overlaps(p, blockingBoundary));
        };        
        return itemPositions;
    };

    defineNewToken() {
        this.itemTokenSettings = {
            name: this.objectDocument.name,
            actorLink: false,
            displayName: game.settings.get("loadouts", "loadouts-show-nameplates"),
            bar1: {
                attribute: null
            },
            flags: {
                loadouts: {
                    "managed": true,
                    "linked": true,
                    "owner": this.objectDocument.parent.id,
                    "truename": this.objectDocument.name,
                    "scale": this.objectDocument.flags?.loadouts?.scale || 1.0,
                    "orientationLock": this.objectDocument.flags.loadouts?.orientationLock || false,
                    "stack": {
                        "max": this.objectDocument.flags?.loadouts?.stack?.max,
                        "members": [this.objectDocument.id]
                    }
                }
            },
            texture: {
                src: this.objectDocument.flags.loadouts.img,
                scaleX: this.itemRotation 
                    ? (this.objectDocument.flags.loadouts.height * (this.objectDocument.flags.loadouts?.scale || 1.0))
                    : (this.objectDocument.flags.loadouts?.scale || 1.0),
                scaleY: this.itemRotation 
                    ? (this.objectDocument.flags.loadouts.height * (this.objectDocument.flags.loadouts?.scale || 1.0))
                    : (this.objectDocument.flags.loadouts?.scale || 1.0),
                rotation: this.itemRotation
            },
            width: this.itemRotation ? this.objectDocument.flags.loadouts.height : this.objectDocument.flags.loadouts.width,
            height: this.itemRotation ? this.objectDocument.flags.loadouts.width : this.objectDocument.flags.loadouts.height,
            x: this.selectedPosition.x1,
            y: this.selectedPosition.y1,
            rotation: this.itemRotation,
            lockRotation: this.objectDocument.flags.loadouts?.orientationLock || false
        }
    };

    async placeToken() {
        let itemTokenDocument = await this.objectDocument.parent.getTokenDocument(this.itemTokenSettings);
        const addedToken = await this.selectedTile.parent.createEmbeddedDocuments("Token", [itemTokenDocument]);
    };

    async createNewToken() {
        this.validTiles = super.findValidTiles();
        this.findTilePositions();
        this.tileOwner = game.actors.get(this.selectedTile.flags.loadouts.owner);
        console.log(this.tileOwner)
        if(! this.selectedPosition) {
            if(await notifyNoValidPositions(this.objectDocument)) {
                this.defineNewToken();
                this.placeToken();
            };
        } else if((this.selectedTile.flags.loadouts.state == "local") && (this.selectedTile.parent.id != this.getViewedScene())) {
            if(await notifyNoCarriedPositions(this.objectDocument, this.selectedTile)) {
                this.defineNewToken();
                this.placeToken();
            };
        } else {
            this.defineNewToken();
            this.placeToken();
        };
    };

    removeLoadoutsToken() {
        this.tokenOwner = game.actors.get(this.objectDocument.flags.loadouts.owner);
        this.objectDocument.delete();
        ui.notifications.info(`Loadouts: removed '${this.objectDocument.name}' from ${this.tokenOwner.name}'s loadout in '${this.objectDocument.parent.name}'`);
    };
};