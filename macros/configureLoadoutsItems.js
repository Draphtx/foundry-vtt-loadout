let itemDropdown = "";
const loadoutsTypes = game.settings.get("loadouts", "loadouts-managed-item-types")

for(const loadoutsType of loadoutsTypes.split(',')) {
    itemDropdown +="<option disabled>" + loadoutsType.toUpperCase() + "</option>"
    var itemArray = game.items.filter(item => item.type == loadoutsType).sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < itemArray.length; i++) {
        var isConfigured
        if(itemArray[i].flags.loadouts){
            if(itemArray[i].flags.loadouts.configured == true) {
                isConfigured = "&#x25C9;"
            } else {
                isConfigured = "&#x25CC;"
            }
        } else {
            isConfigured = "&#x25CC;"
        };
        itemDropdown += "<option value='" + itemArray[i].id + "'>" + itemArray[i].name + " " + isConfigured + "</option>";
    };
};

new Dialog({
    // TODO: Increase select width to accomodate long item names
    title: "Loadouts Item Configuration",
    content: `
    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Item Selection</legend>
     
    <!-- Item Dropdown -->
    <div class="form-group">
        <label for="selectedItems" style='display:inline-block;'>Select Item</label>
        <select id="selectedItems" name="selectedItems" multiple style='width:58%; margin:4px 1%; display:inline-block;'>` + itemDropdown + `</select>
    </div>

    </fieldset>
    </form>

    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Appearance</legend>

    <!-- Range input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="useCompendiumImage">Use Compendium Image</label>  
      <div class="col-md-4">
      <input id="useCompendiumImage" name="useCompendiumImage" type="checkbox" checked="true"></input>
      </div>
    </div>

    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="imagePath">Image Path</label>
      <div class="col-md-4">
      <!-- <input id="imagePath" name="imagePath" type="text" value="modules/loadouts/artwork/items/air-pistol.webp" class="form-control input-md"> -->
      <input id="imagePath" name="imagePath" type="text" placeholder="path/to/artwork.webp" class="form-control input-md">
      </div>
    </div>
    
    <!-- Number input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenWidth">Token Width</label>  
      <div class="col-md-4">
      <input id="tokenWidth" name="tokenWidth" type="text" value="1" maxlength="1" oninput="this.value=this.value.replace(/[^0-9]/g,'');" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>
    
    <!-- Number input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenHeight">Token Height</label>  
      <div class="col-md-4">
      <input id="tokenHeight" name="tokenHeight" type="text" maxlength="1" oninput="this.value=this.value.replace(/[^0-9]/g,'');" value="1" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>

    <!-- Range input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenScale">Token Scale</label>  
      <div class="col-md-4">
      <input id="tokenScale" name="tokenScale" type="range" min="0.1" max="1" step="0.1" defaultValue="1" value="1" oninput="document.getElementById('rangeValLabel').innerHTML = this.value;"></input>
      <span class="help-block">Scale: </span>
      <em id="rangeValLabel" style="font-style: normal;">1</em>
      </div>
    </div>

    <!-- Range input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="lockOrientation">Lock Orientation</label>  
      <div class="col-md-4">
      <input id="lockOrientation" name="lockOrientation" type="checkbox"></input>
      </div>
    </div>

    </fieldset>
    </form>

    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Properties</legend>

    <!-- Number input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="stackSize">Stack Size</label>  
      <div class="col-md-4">
      <input id="stackSize" name="stackSize" type="text" maxlength="2" oninput="this.value=this.value.replace(/[^0-9]/g,'');" value="1" class="form-control input-md" required="">
      <span class="help-block">Maximum stack size</span>
      </div>
    </div>

    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="loadoutsTag">Loadouts Tag</label>  
      <div class="col-md-4">
      <input id="loadoutsTag" name="loadoutsTag" type="text" maxlength="25" oninput="this.value=this.value.replace(/[^0-9A-Za-z-.]/g,'');" placeholder=null class="form-control input-md">
      <span class="help-block">e.g. 'pistols' or 'healing-potions' </span>  
      </div>
    </div>
    
    </fieldset>
    </form>
    `,
    buttons: {
        cancel: {
            label: "Cancel",
            callback: () => {
              return;
            },
        },
        apply: {
            label: "Apply Settings",
            callback: (html) => configureLoadoutsItem(
                html.find('[name="selectedItems"]').val(),
                html.find('[name="useCompendiumImage').val(),
                html.find('[name="imagePath"]').val(),
                html.find('[name="tokenWidth"]').val(),
                html.find('[name="tokenHeight"]').val(),
                html.find('[name="tokenScale"]',).val(),
                html.find('[name="lockOrientation"]',).val(),
                html.find('[name="stackSize"]').val(),
                html.find('[name="loadoutsTag"]').val() || null
            )
        },
    }
}).render(true);

async function configureLoadoutsItem(itemIds, useCompendiumImage, imagePath, tokenWidth, tokenHeight, tokenScale, lockOrientation, stackSize, loadoutsTag) {
    console.log("Configuring items")
    itemIds = itemIds.filter(x => x !== undefined);
    const useCompendiumImageCheckbox = document.getElementById('useCompendiumImage');
    for(const itemId of itemIds){
        if(useCompendiumImageCheckbox.checked) { 
            imagePath = actualImagePath = game.items.get(itemId).img; 
        };
        setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, tokenScale, lockOrientation, stackSize, loadoutsTag)
    };
    
    ui.notifications.info("Loadouts: configured " + itemIds.length + " items for management")
    await new Promise(r => setTimeout(r, 500));
    game.macros.getName("configureLoadoutsItems").execute()

};

async function setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, tokenScale, lockOrientation, stackSize, loadoutsTag) {
    // TODO: Ensure that the path exists before making any changes
    console.log("Setting Loadouts item flags for " + itemId)
    const lockOrientationCheckbox = document.getElementById('lockOrientation');
    await game.items.get(itemId).update({
        flags: {
            loadouts: {
                configured: true,
                img: imagePath,
                width: parseInt(tokenWidth),
                height: parseInt(tokenHeight),
                scale: parseFloat(tokenScale),
                orientationLock: lockOrientationCheckbox.checked,
                stack: {max: parseInt(stackSize)},
                loadoutsTag: loadoutsTag
            }
        }
    });
};
