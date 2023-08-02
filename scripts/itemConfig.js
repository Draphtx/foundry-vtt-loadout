var itemDropdown = "";
var itemArray = game.items.filter(item => item.type == "weapon").sort((a, b) => a.name.localeCompare(b.name));
for (let i = 0; i < itemArray.length; i++) {
    var isConfigured
    if(itemArray[i].flags.Loadouts){
        if(itemArray[i].flags.Loadouts.configured == true){
            isConfigured = "&#x25C9;"
        } else {
            isConfigured = "&#x25CC;"
        }
       } else {
          isConfigured = "&#x25CC;"
    }
    itemDropdown += "<option value='" + itemArray[i].id + "'>" + itemArray[i].name + " (" + itemArray[i].type + ") " + isConfigured + "</option>";
}

new Dialog({
    title: "Loadouts: Configure Items",
    content: `
    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Loadouts: Item Configuration</legend>
    
    <!-- Item Dropdown -->
    <div class="form-group">
        <label for="selectedItem" style='font-weight:bold; width:38%; margin:4px 1%; display:inline-block;'>Select Item</label>
        <select id="selectedItem" name="selectedItem" style='width:58%; margin:4px 1%; display:inline-block;'>` + itemDropdown + `</select>
    </div>

    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="imagePath">Image Path</label>  
      <div class="col-md-4">
      <input id="imagePath" name="imagePath" type="text" value="modules/Loadouts/artwork/items/air-pistol.webp" class="form-control input-md">
      <span class="help-block">Path to item's token image</span>  
      </div>
    </div>
    
    <!-- Multiple Checkboxes -->
    <div class="form-group">
    <label class="col-md-4 control-label" for="applyToVariants">Apply to variants?</label>
    <div class="col-md-4">
    <div class="checkbox">
        <label for="applyToVariants-0">
        <input type="checkbox" name="applyToVariants" id="applyToVariants-0" value="true" checked>
        Same settings for all qualities
        </label>
        </div>
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
      <span class="help-block">The number of this item that can be contained in a single stack</span>  
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
                html.find('[name="selectedItem"]').val(),
                html.find('[name="imagePath"]').val(),
                html.find('[name="applyToVariants"]').val(),
                html.find('[name="tokenWidth"]').val(),
                html.find('[name="tokenHeight"]').val(),
                html.find('[name="stackSize"]').val()
            )
        },
    }
}).render(true);

async function setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, stackSize){
    console.log("Setting Loadouts item flags for " + itemId)
    const flagItem = game.items.get(itemId)
    const setConfigured = flagItem.setFlag('Loadouts', 'configured', true)
    const setImg = flagItem.setFlag('Loadouts', 'img', imagePath)
    const setWidth = flagItem.setFlag('Loadouts', 'width', tokenWidth)
    const setHeight = flagItem.setFlag('Loadouts', 'height', tokenHeight)
    const setStack = flagItem.setFlag('Loadouts', 'stack', stackSize)

    await setConfigured
    await setImg
    await setWidth
    await setHeight
    await setStack
}

async function configureLoadoutsItem(itemId, imagePath, applyToVariants, tokenWidth, tokenHeight, stackSize){
    console.log("Configuring items")
    
    var itemIds = new Set([itemId])
    if(applyToVariants){
        const selectedItem = game.items.get(itemId)
        console.log(selectedItem)
        const itemBaseName = selectedItem.name.split(" (Poor)")[0].split(" (Excellent)")[0]

        const relatedItems = game.items.filter(item => item.name.startsWith(itemBaseName))
        for(const relatedItem of relatedItems){
            itemIds.add(relatedItem.id)
        }
    }
    
    itemIds = Array.from(itemIds)
    itemIds = itemIds.filter(x => x !== undefined);
    for(const itemId of itemIds){
        setLoadoutsItemFlags(itemId, imagePath, tokenWidth, tokenHeight, stackSize)
    }
    
    ui.notifications.info("Loadouts: configured " + itemIds.length + " items for management")
    await new Promise(r => setTimeout(r, 500));
    game.macros.getName("setLoadoutsItems").execute()

}