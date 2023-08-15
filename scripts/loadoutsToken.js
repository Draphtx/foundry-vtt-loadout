import { notifyNoValidPositions, notifyNoCarriedPositions } from './loadoutsDialogs.js';

class LoadoutsToken {
    constructor(itemDocument) {
        this.itemDocument = itemDocument;
        this.itemRotation = 0;
        this.isStack = itemDocument.flags?.loadouts?.stack?.max > 1;
    };

    verifyItemSuitability() {
        const managedActorTypes = game.settings.get("loadouts", "loadouts-managed-actor-types");
        const managedItemTypes = game.settings.get("loadouts", "loadouts-managed-item-types");
        const allowUnconfiguredItems = game.settings.get('loadouts', 'loadouts-allow-unconfigured-items');
        
        // Do not try to handle item management for unwanted actor types
        if (!managedActorTypes.includes(this.itemDocument.parent.type)) {
            console.debug(`▞▖Loadouts: actor type '${this.itemDocument.parent.type}' not managed`);
            return false;
        }
    
        if (!managedItemTypes.includes(this.itemDocument.type)) {
            console.debug(`▞▖Loadouts: item type '${this.itemDocument.type}' not managed`);
            return false;
        }
    
        if ("loadouts" in this.itemDocument.flags) {
            console.debug(`▞▖Loadouts:: ${this.itemDocument.name} of type '${this.itemDocument.type}' is configured for management`);
            return true;
        }
    
        if (allowUnconfiguredItems) {
            console.debug(`▞▖Loadouts: ${this.itemDocument.name} of type '${this.itemDocument.type}' not flagged but unconfigured items setting is set to permissive.`);
            return false;
        }
    
        ui.notifications.warn(`Loadouts: cannot add '${this.itemDocument.name}' to ${this.itemDocument.parent.name}'s inventory. The GM has disabled the ability \
            to add ${this.itemDocument.type} items that are not configured for Loadouts.`);
        this.itemDocument.delete();
        return false;
    };

    findValidTiles(){
        const loadoutsScenes = game.scenes.filter(
            scene => scene.flags.loadouts).filter(
                scene => scene.flags.loadouts.isLoadoutsScene == true)
        
        if((loadoutsScenes == null) || (loadoutsScenes == undefined)){
            console.warn("▞▖Loadouts: unable to find any scenes flagged for Loadouts. Please be sure to complete scene and tile setup as described in the documentation.")
            return;
        }
        
        let validTiles = []
        for(let loadoutsScene of loadoutsScenes){
            loadoutsTiles = loadoutsScene.tiles.filter(
                tile => tile.flags.loadouts).filter(
                    tile => tile.flags.loadouts.owner == this.itemDocument.parent.id).filter(
                        tile => {
                            const allowedTypes = tile.flags.loadouts?.allowed_types;
                        
                            // If allowedTypes is set but doesn't include itemDocument.system.type, we reject the tile.
                            if (allowedTypes && !allowedTypes.split(',').includes(this.itemDocument.type)) {
                                return false;
                            }
                        
                            // If allowedTypes is null or undefined, or if it includes itemDocument.system.type, we continue with the size check.
                            return Math.max(tile.height/tile.parent.grid.size, tile.width/tile.parent.grid.size) >= Math.max(this.itemDocument.flags.loadouts.width, this.itemDocument.flags.loadouts.height);
                        }
                    )
            validTiles = [...validTiles, ...loadoutsTiles]
        }
    
        // Return the valid tiles, sorted by preference weight
        return validTiles.sort((a, b) => a.flags.loadouts.weight < b.flags.loadouts.weight ? -1 : 1);
    };

    findValidStack(){
        function isInLoadoutsTileArea(token, tile) {
            return token.x >= tile.x && token.x <= (tile.x + tile.width) &&
                    token.y >= tile.y && token.y <= (tile.y + tile.height);
        };

        function isValidStack(token) {
            return token.name == this.itemDocument.name && 
                    (token.flags?.loadouts?.stack?.members?.length + 1) <= (this.itemDocument?.flags?.loadouts?.stack?.max);
        };
        
        for(const loadoutsTile of this.validTiles){
            let validStacks = loadoutsTile.parent.tokens.filter(
                t => isInLoadoutsTileArea(t, loadoutsTile) && isValidStack(t, this.itemDocument));
            if(validStacks.length){
                return [loadoutsTile, loadoutsStack];
            };
        };
        return [false, false]
    };

    updateStack(loadoutsTile, loadoutsStack){
        const membershipIds = [...loadoutsStack.flags.loadouts.stack.members];
        membershipIds.push(itemDocument.id); 
    
        const updateData = {
            name: `${loadoutsStack.name} (x${membershipIds.length})`,
            flags: {
                loadouts: {
                    stack: {
                        members: membershipIds
                    }
                }
            }
        };
    
        if (membershipIds.length > 1) {
            updateData.overlayEffect = game.settings.get("loadouts", "loadouts-stack-overlay");
        }
        
        try {
            loadoutsStack.update(updateData);
            ui.notifications.info("Loadouts: " + this.itemDocument.parent.name + " added " + this.itemDocument.name + " to an existing stack in " + loadoutsTile.parent.name);
            return true;
        } catch (error) {
            console.warn(`Loadouts | unable to update stack ${loadoutsStack.id}`);
            console.error(`Loadouts | ${error}`);
            return false;
        };
    };

    findTilePositions(){
        for(const loadoutsTile of this.validTiles){    
            tilePositions = this.filterTilePositions(loadoutsTile, this.itemDocument.flags.loadouts.width, this.itemDocument.flags.loadouts.height)
            if(! tilePositions.length){
                if(this.itemDocument.flags.loadouts.width != this.itemDocument.flags.loadouts.height){
                    tilePositions = this.filterTilePositions(loadoutsTile, this.itemDocument.flags.loadouts.height, this.itemDocument.flags.loadouts.width)
                    if(tilePositions.length){
                        this.itemRotation = 90
                    }
                }
            }
            if(tilePositions.length){
                selectedTile = loadoutsTile;
                break;
            }
        }
        return [selectedTile, tilePositions[0]]
    };
    
    filterTilePositions(loadoutsTile, itemSizeL, itemSizeH){
        // TODO: need a way to 'reserve' certain slots at the tile configuration level, such that the whole slot is used (preferably)
        //// Currently we are covering for this by highly-prioritizing single-item slots, but that's just smoke & mirrors
        let itemPositions = []
        for(let rowNum of Array(loadoutsTile.height/loadoutsTile.parent.grid.size).keys()){
            for(let colNum of Array(loadoutsTile.width/loadoutsTile.parent.grid.size).keys()){
                let tilePosition = {
                    "x1": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size), "y1": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size), 
                    "x2": loadoutsTile.x + (colNum * loadoutsTile.parent.grid.size) + (itemSizeL * loadoutsTile.parent.grid.size), "y2": loadoutsTile.y + (rowNum * loadoutsTile.parent.grid.size) + (itemSizeH * loadoutsTile.parent.grid.size),
                }
                if((tilePosition.x1 + (itemSizeL * loadoutsTile.parent.grid.size) <= loadoutsTile.x + loadoutsTile.width) && (tilePosition.y1 + (itemSizeH * loadoutsTile.parent.grid.size) <= loadoutsTile.y + loadoutsTile.height)){
                    itemPositions.push(tilePosition)
                }
            }
        }
        // Find any tokens that may already be over the tile's area
        let blockingTokens = loadoutsTile.parent.tokens.filter(
            t => t.x >= loadoutsTile.x <= (loadoutsTile.x + loadoutsTile.width) && 
                    t.y >= loadoutsTile.y <=(loadoutsTile.y + loadoutsTile.height))

        // Here there be dragons. One liner that filters the potential token creation positions with the spaces blocked by existing tokens.
        // There is something going on here with the use of the itemSize * gridSize that makes me have to do this extra step of determining 
        // which filter to use...this should be refactorable to a single filter but my brain is refusing to deal with it right now.
        for(let blockingToken of blockingTokens){
            // If the blockingToken is >= the new item, the item should use the filter but with Math.max
            if(blockingToken.width >= itemSizeL || blockingToken.height > itemSizeH){
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.max(blockingToken.x + blockingToken.width * loadoutsTile.parent.grid.size, blockingToken.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.max(blockingToken.y + blockingToken.height * loadoutsTile.parent.grid.size, blockingToken.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.y >= p.y2
                    )
            // If the blockingToken is < the new item, the item should use the filter but with Math.min
            } else {
                itemPositions = itemPositions.filter(p => 
                    p.x1 >= Math.min(blockingToken.x + blockingToken.width * loadoutsTile.parent.grid.size, blockingToken.x + itemSizeL * loadoutsTile.parent.grid.size) || blockingToken.x >= p.x2 || 
                    p.y1 >= Math.min(blockingToken.y + blockingToken.height * loadoutsTile.parent.grid.size, blockingToken.y + itemSizeH * loadoutsTile.parent.grid.size) || blockingToken.y >= p.y2
                    )
            }
        }
        return itemPositions;
    };

    async createNewToken(){
        const [selectedTile, validPosition] = this.findTilePositions();
        if(! validPosition){
            if(await notifyNoValidPositions(this.itemDocument)){
                this.defineNewToken(selectedTile, validPosition);
                this.placeToken();
            };
        } else if(selectedTile.flags.loadouts.state == "remote"){
            if(await notifyNoCarriedPositions(this.itemDocument)){
                this.defineNewToken(selectedTile, validPosition);
                this.placeToken();
            };
        } else {
            this.defineNewToken(selectedTile, validPosition);
            this.placeToken();
        };
    };

    processNewItem(){
        // Perform checks to ensure that the item is one we will try to handle using the loadout system
        if(! this.verifyItemSuitability()){
            console.debug("▞▖Loadouts: item " + this.itemDocument.name + " discarded by suitability checks")
            return;
        }

        // Get tiles that could _potentially_ hold the payload based on geometry and ownership
        this.validTiles = this.findValidTiles()

        // Add stacked items to existing stacks, if possible
        if(this.isStack){
            const [loadoutsTile, loadoutsStack] = this.findValidStack();
            if(loadoutsTile){
                if(this.updateStack(loadoutsTile, loadoutsStack)){
                    return;
                };
            };
        };

        // Otherwise, try to create a new token
        this.createNewToken();
    };

    defineNewToken(selectedTile, validPosition) {
        this.itemTokenSettings = {
            name: this.itemDocument.name,
            actorLink: false,
            displayName: 30,
            flags: {
                loadouts: {
                    "managed": true,
                    "linked": true,
                    "owner": this.itemDocument.parent.id,
                    "stack": {
                        "max": this.itemDocument.flags?.loadouts?.stack?.max,
                        "members": [this.itemDocument.id]
                    }
                }
            },
            texture: {
                src: this.itemDocument.flags.loadouts.img,
                // Incorporate the rotation checks right here
                scaleX: this.itemRotation ? this.itemDocument.flags.loadouts.height : undefined,
                scaleY: this.itemRotation ? this.itemDocument.flags.loadouts.height : undefined
            },
            width: this.itemRotation ? this.itemDocument.flags.loadouts.height : this.itemDocument.flags.loadouts.width,
            height: this.itemRotation ? this.itemDocument.flags.loadouts.width : this.itemDocument.flags.loadouts.height,
            x: this.selectedPosition.x1,
            y: this.selectedPosition.y1,
            rotation: this.itemRotation,
            lockRotation: true
        }
    };

    async placeToken() {
        let itemTokenDocument = await this.itemDocument.parent.getTokenDocument(this.itemTokenSettings);
        const addedToken = await this.selectedTile.parent.createEmbeddedDocuments("Token", [itemTokenDocument]);
    };

    locateRemovedItem(){
        function getLoadoutsScenes() {
            return game.scenes.filter(scene => scene.flags?.loadouts?.isLoadoutsScene);
        };
        
        function findItemTokenInScene(scene) {
            return scene.tokens.contents.find(token => 
                token.flags.loadouts?.stack?.members?.includes(itemDocument.id)
            );
        };
        
        function findItemTokenAcrossScenes(scenes) {
            let loadoutsItemToken = false;
            for (const loadoutsScene of scenes) {
                loadoutsItemToken = findItemTokenInScene(itemDocument.id);
                if (loadoutsItemToken) break;
            };
            return loadoutsItemToken;
        };
    };

    removeLoadoutsItem(){
        const membersArray = this.loadoutsItemToken.flags.loadouts.stack.members;
        const index = membersArray.indexOf(this.itemDocument.id);
        
        if (index > -1) {
            membersArray.splice(index, 1);
        };

        if (membersArray.length > 0) {
            loadoutsItemToken.update({
                flags: {
                    loadouts: {
                        stack: {
                            members: membersArray}
                        }
                    },
                name: `${itemDocument.name} (x${membersArray.length})`,
                });
            ui.notifications.info(`Loadouts: ${itemDocument.parent.name} removed '${itemDocument.name}' from a stack in '${loadoutsItemToken.parent.name}'`);
            if(membersArray.length == 1){
                loadoutsItemToken.update({
                    overlayEffect: "",
                    name: itemDocument.name,
                })
            };
        } else {
            this.removeLoadoutsToken()
        };
    };
    
    removeLoadoutsToken(){
        ui.notifications.info(`Loadouts: removed '${itemDocument.name}' from ${itemDocument.parent.name}'s loadout in '${loadoutsItemToken.parent.name}'`);
        this.loadoutsItemToken.delete();
    };

    processRemovedItem(){
        if (!this.itemDocument.flags.loadouts){return};
    
        this.loadoutsRemovedItemToken = this.locateRemovedItem()
        if(!this.loadoutsRemovedItemToken){
            console.warn(`▞▖Loadouts: unable to find Loadouts token related to ${itemDocument.id} on any Loadouts scene`);
            return;
        } else {
            this.removeLoadoutsItem();
        };
    };
};