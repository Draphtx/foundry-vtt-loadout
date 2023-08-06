let itemDocument = {name: "Grenade Launcher (Excellent)"}
let itemsPath = "Cyberpunk/loadouts/items2/"

// Get some information about the item based on its name (return simplified item name) and quality
let pattern = /(.+?)(?:\s*\((.+)\))?$/
let match = itemName.match(pattern);
var itemDetails
if (match) {
    // transform name: lowercase, remove special chars, replace spaces with single dash
    itemDetails.name = match[1].toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-');
    // transform quality: lowercase
    itemDetails.quality = match[2] ? match[2].toLowerCase().trim() : undefined;

} else {
    // when no match found, transform and return the raw item name
    itemDetails.name = itemName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s/g, '-'), 
    itemDetails.quality = undefined 
}

let itemArtworkPath = itemsPath + itemDetails.name 

let itemTokenSettings = {
    name: itemDocument.name,
    disposition: 0,
    displayName: 30,
    flags: {loadouts: {"item": "testid"}},
    x: 900,
    y: 900,
    texture: {src: "Cyberpunk/loadouts/items/grenade-launcher.webp"},
    width: 2,
    height: 4,
    rotation: 0
}

itemTokenDoc = await game.actors.getName("Ni-Con").getTokenDocument(itemTokenSettings)

await canvas.scene.createEmbeddedDocuments("Token", [itemTokenDoc])

/*
var itemDropdown = "";
var itemArray = game.items.filter(item => item.type == "weapon");
for (let i = 0; i < itemArray.length; i++) {
    itemDropdown += "<option value='" + itemArray[i].id + "'>" + itemArray[i].name + "</option>";
}

new Dialog({
    title: "Select",
    content: "<label for='players' style='font-weight:bold; width:38%; margin:4px 1%; display:inline-block;'>Select Player</label><select id='players' style='width:58%; margin:4px 1%; display:inline-block;'>" + itemDropdown + "</select>",
    buttons: {
        select: {
            label: "Select Player's Targets",
            callback: (html) => selectTargets(html)
        }
    }
}).render(true);

function selectTargets(html){
}
*/

var itemDropdown = "";
var itemArray = game.items.filter(item => item.type == "weapon").sort((a, b) => a.name.localeCompare(b.name));
for (let i = 0; i < itemArray.length; i++) {
    var isConfigured
    if(itemArray[i].flags.loadouts){
        if(itemArray[i].flags.loadouts.configured == true){
            isConfigured = "√"
        } else {
            isConfigured = "X"
        }
       } else {
          isConfigured = "X"
    }
    itemDropdown += "<option value='" + itemArray[i].id + "'>" + itemArray[i].name + " " + isConfigured + "</option>";
}

new Dialog({
    title: "Loadouts: Configure Items",
    content: `
    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Form Name</legend>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="imagePath">Image Path</label>  
      <div class="col-md-4">
      <input id="imagePath" name="imagePath" type="text" placeholder="modules/Loadouts/artwork/items/air-pistol.webp" class="form-control input-md">
      <span class="help-block">Set the path for the item's token image</span>  
      </div>
    </div>
    
    <!-- Multiple Checkboxes -->
    <div class="form-group">
      <label class="col-md-4 control-label" for="applyToVariants"></label>
      <div class="col-md-4">
      <div class="checkbox">
        <label for="applyToVariants-0">
          <input type="checkbox" name="applyToVariants" id="applyToVariants-0" value="true">
          Apply to Variants?
        </label>
        </div>
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenWidth">Token Width</label>  
      <div class="col-md-4">
      <input id="tokenWidth" name="tokenWidth" type="text" placeholder="1" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="tokenHeight">Token Height</label>  
      <div class="col-md-4">
      <input id="tokenHeight" name="tokenHeight" type="text" placeholder="1" class="form-control input-md" required="">
      <span class="help-block">In grid units, not px</span>  
      </div>
    </div>
    
    <!-- Text input-->
    <div class="form-group">
      <label class="col-md-4 control-label" for="stackSize">Stack Size</label>  
      <div class="col-md-4">
      <input id="stackSize" name="stackSize" type="text" placeholder="0" class="form-control input-md" required="">
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
            callback: (html) => selectTargets(html)
        },
    }
}).render(true);

function selectTargets(html){
}

// Find all custom Loadouts Tags
allItemTypes = new Set()
game.items.forEach(function(obj){
    if("loadouts" in obj.flags){
      allItemTypes.add(obj.flags.loadouts.loadoutsTag);
    }
})

console.log(allItemTypes)