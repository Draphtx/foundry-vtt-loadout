var itemDropdown = "";
const loadoutsTypes = game.settings.get("Loadouts", "loadouts-managed-item-types")

for(const loadoutsType of loadoutsTypes.split(',')){
    itemDropdown +="<option disabled>" + loadoutsType.toUpperCase() + "</option>"
    var itemArray = game.items.filter(item => item.type == loadoutsType).sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < itemArray.length; i++) {
        var isConfigured
        if(itemArray[i].flags.loadouts){
            if(itemArray[i].flags.loadouts.configured == true){
                isConfigured = "&#x25C9;"
            } else {
                isConfigured = "&#x25CC;"
            }
        } else {
            isConfigured = "&#x25CC;"
        }
        itemDropdown += "<option value='" + itemArray[i].id + "'>" + itemArray[i].name + " " + isConfigured + "</option>";
    }
}

new Dialog({
    // TODO: Increase select width to accomodate long item names
    title: "Loadouts",
    content: `
    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Item Configuration</legend>
     
    <!-- Item Dropdown -->
    <div class="form-group">
        <label for="selectedItems" style='display:inline-block;'>Select Item</label>
        <select id="selectedItems" name="selectedItems" multiple style='width:58%; margin:4px 1%; display:inline-block;'>` + itemDropdown + `</select>
    </div>

    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="imagePath">Image Path</label>
      <div class="col-md-4">
      <input id="imagePath" name="imagePath" type="text" value="modules/Loadouts/artwork/items/air-pistol.webp" class="form-control input-md">
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenWidth">Token Width</label>  
      <div class="col-md-4">
      <input id="tokenWidth" name="tokenWidth" type="text" value="1" maxlength="1" oninput="this.value=this.value.replace(/[^0-9]/g,'');" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenHeight">Token Height</label>  
      <div class="col-md-4">
      <input id="tokenHeight" name="tokenHeight" type="text" maxlength="1" oninput="this.value=this.value.replace(/[^0-9]/g,'');" value="1" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="stackSize">Stack Size</label>  
      <div class="col-md-4">
      <input id="stackSize" name="stackSize" type="text" maxlength="1" oninput="this.value=this.value.replace(/[^0-9]/g,'');" value="0" class="form-control input-md" required="">
      <span class="help-block">Maximum stack size</span>  
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
                html.find('[name="imagePath"]').val(),
                html.find('[name="tokenWidth"]').val(),
                html.find('[name="tokenHeight"]').val(),
                html.find('[name="stackSize"]').val()
            )
        },
    }
}).render(true);

async function setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, stackSize){
    // TODO: Ensure that the path exists before making any changes
    console.log("Setting Loadouts item flags for " + itemId)
    const flagItem = game.items.get(itemId)
    const setConfigured = flagItem.setFlag('loadouts', 'configured', true)
    const setImg = flagItem.setFlag('loadouts', 'img', imagePath)
    const setWidth = flagItem.setFlag('loadouts', 'width', tokenWidth)
    const setHeight = flagItem.setFlag('loadouts', 'height', tokenHeight)
    const setStack = flagItem.setFlag('loadouts', 'stack', stackSize)

    await setConfigured
    await setImg
    await setWidth
    await setHeight
    await setStack
}

async function configureLoadoutsItem(itemIds, imagePath, applyToVariants, tokenWidth, tokenHeight, stackSize){
    console.log("Configuring items")
    itemIds = itemIds.filter(x => x !== undefined);
    for(const itemId of itemIds){
        setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, stackSize)
    }
    
    ui.notifications.info("Loadouts: configured " + itemIds.length + " items for management")
    await new Promise(r => setTimeout(r, 500));
    game.macros.getName("setLoadoutsItems").execute()

}