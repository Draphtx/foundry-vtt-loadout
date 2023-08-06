const loadoutsTileDialog = new Dialog({
    title: "Define Loadouts Tile Options", 
    content:`
    <script type="text/javascript">
        function limitWeightLength(obj){
            if (obj.value.length > 2){
                obj.value = obj.value.slice(0,2); 
            }
        }
    </script>
    <form>
      <div class="form-group">
        <label>Character Name</label>
        <input type='text' name='characterName'></input>
      </div>
    </form>
    <div class="form-group">
      <label for="preferenceWeight">Preference Weight (0-99)</label>
      <input type="number" id="preferenceWeight" name="preferenceWeight" min="0" max="99" oninput="limitWeightLength(this)">
    </div>
    <div class="form-group">
      <label>Storage Name</label>
      <input type='text' name='storageName' maxLength='50'></input>
    </div>
    <div class="form-group">
      <label for="stateSelect">Equipped State</label>
      <select name="stateSelect">
        <option value="carried">carried</option>
        <option value="owned">owned</option>
        <option value="equipped">equipped</option>
      </select>
    </div>`,
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

async function setupLoadoutsTiles(characterName, tileWeight, storageName, tileState){
    characterActorId = getCharacterActorId(characterName)
    if((characterActorId == null) || (characterActorId == undefined)){
        return;
    }

    canvas.tiles.controlled.forEach(tile => tile.document.update({
        "flags.loadouts": {
            "owner": characterActorId,
            "weight": tileWeight,
            "name": storageName,
            "state": tileState
        }
    }))

    if(! game.scene.current.flags.loadouts){
        ui.notifications.warn("Loadouts: tile(s) configured, but the current scene is not flagged as a Loadouts scene. Ensure that the configureLoadoutsScene macro is run.")
    } else {
        ui.notifications.info("Loadouts: tile(s) configured")
    }
}