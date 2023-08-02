const loadoutsTileDialog = new Dialog({
    title: "Define Loadouts Tile Options", 
    content:`
    <form>
      <div class="form-group">
        <label>Character Name</label>
        <input type='text' name='characterName'></input>
      </div>
    </form>
    <div class="form-group">
        <label for="weightSelect">Preference Weight</label>
        <select name="weightSelect">
          <option value=0>0</option>
          <option value=1>1</option>
          <option value=2>2</option>
          <option value=3>3</option>
          <option value=4>4</option>
          <option value=5>5</option>
        </select>
      </div>
      <div class="form-group">
        <label for="typeSelect">Storage Type</label>
        <select name="typeSelect">
          <option value="holster">Holster</option>
          <option value="pocket">Pocket</option>
          <option value="back/shoulder">Back/Shoulder</option>
          <option value="backpack">Backpack</option>
          <option value="duffel">Duffel</option>
          <option value="stash">Stash</option>
        </select>
      </div>
      <div class="form-group">
        <label for="stateSelect">Equipped State</label>
        <select name="stateSelect">
          <option value="carried">Carried</option>
          <option value="owned">Owned</option>
          <option value="equipped">Equipped</option>
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
                html.find('[name="weightSelect"]').val(),
                html.find('[name="typeSelect"]').val(),
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

async function setupLoadoutsTiles(characterName, tileWeight, storageType, tileState){
    characterActorId = getCharacterActorId(characterName)
    if((characterActorId == null) || (characterActorId == undefined)){
        return;
    }

    canvas.tiles.controlled.forEach(tile => tile.document.update({
        "flags.loadouts": {
            "owner": characterActorId,
            "weight": tileWeight,
            "type": storageType,
            "state": tileState
        }
    }))

    if(! game.scene.current.flags.loadouts){
        ui.notifications.warn("Loadouts: tile(s) configured, but the current scene is not flagged as a Loadouts scene. Ensure that the configureLoadoutsScene macro is run.")
    } else {
        ui.notifications.info("Loadouts: tile(s) configured")
    }
}