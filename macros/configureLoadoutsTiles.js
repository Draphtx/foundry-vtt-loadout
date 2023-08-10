const loadoutsTileDialog = new Dialog({
    title: "Loadouts", 
    content:`
    <script type="text/javascript">
        function limitWeightLength(obj){
            if (obj.value.length > 2){
                obj.value = obj.value.slice(0,2); 
            }
        }
    </script>
    <form class="form-horizontal">
    <fieldset>
    
    <!-- Form Name -->
    <legend>Tile Configuration</legend>
    
    <div class="form-group">
      <label>Character Name</label>
      <input type='text' name='characterName'></input>
    </div>
    
    <div class="form-group">
      <label for="preferenceWeight">Preference Weight</label>
      <input type="number" id="preferenceWeight" name="preferenceWeight" placeholder='0-99' min="0" max="99" oninput="limitWeightLength(this)">
    </div>
    
    <div class="form-group">
      <label>Allowed Item Types</label>
      <input type='text' name='allowedItemTypes' placeholder="e.g. 'weapon,ammo'. Blank for all"></input>
    </div>

    <div class="form-group">
      <label>Allowed Item Tags</label>
      <input type='text' name='allowedItemTags' placeholder="e.g. 'my,custom,tags'. Blank for all"></input>
    </div>
    
    <div class="form-group">
      <label>Storage Name</label>
      <input type='text' name='storageName' maxLength='50' placeholder="defaults to 'storage'"></input>
    </div>
  
    <label for="stateSelect">Carried State</label>
      <select name="stateSelect">
        <option value="carried">carried</option>
        <option value="remote">owned</option>
      </select>
    </div>

    </fieldset>
    </form>
    `,
      buttons: {
        cancel: {
            icon: "<i class='fas fa-check'></i>",
            label: `Cancel`,
            callback: function(){ return; }  
            },
        apply: {
            icon: "<i class='fas fa-check'></i>",
            label: `Apply Changes` ,
            callback: html => {setupLoadoutsTiles(
                html.find('[name="characterName"]').val(),
                html.find('[name="preferenceWeight"]').val(),
                html.find('[name="allowedItemTypes"]').val(),
                html.find('[name="allowedItemTags"]').val(),
                html.find('[name="storageName"]').val(),
                html.find('[name="stateSelect"]').val()
            )}   
            }
      },
      default: 'apply',
}).render(true);

function getCharacterActorId(characterName){
    let matchingCharacters = game.actors.filter(actor => actor.name == characterName)
    if(! matchingCharacters.length){
        ui.notifications.error("Loadouts: unable to assign tile - no characters found with name " + characterName + ". No changes were made to selected tile(s).")
        return;
    } else if(matchingCharacters.length > 1) {
        ui.notifications.error("Loadouts: multiple characters found with name " + characterName + ". No changes were made to selected tile(s).")
        return;
    } else {
        return matchingCharacters[0].id;
    }
}

async function setupLoadoutsTiles(characterName, tileWeight, allowedTypes, allowedTags, storageName, tileState){
    characterActorId = getCharacterActorId(characterName)
    if((characterActorId == null) || (characterActorId == undefined)){
        return;
    }

    canvas.tiles.controlled.forEach(tile => tile.document.update({
        "flags.loadouts": {
          "name": storageName,
          "owner": characterActorId,
          "weight": tileWeight,
          "allowed_types": allowedTypes.trim() ? allowedTypes : null,
          "allowed_tags": allowedTags.trim() ? allowedTags : null, 
          "state": tileState
        }
    }))

    if(! game.scenes.current.flags.loadouts){
        ui.notifications.warn("Loadouts: tile(s) configured, but the current scene is not flagged as a Loadouts scene. Ensure that the configureLoadoutsScene macro is run.")
    } else {
        ui.notifications.info("Loadouts: tile(s) configured")
    }
}