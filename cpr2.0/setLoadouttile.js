const loadoutTileDialog = new Dialog({
    title: "Define Loadout Tile Options", 
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
          <option value=1>1</option>
          <option value=1>1</option>
          <option value=2>2</option>
          <option value=3>3</option>
          <option value=4>4</option>
          <option value=5>5</option>
        </select>
      </div>
      <div class="form-group">
        <label for="typeSelect">Storage Type</label>
        <select name="stateSelect">
          <option value="holster">Holster</option>
          <option value="pocket">Pocket</option>
          <option value="back/shoulder">Back/Shoulder</option>
          <option value="luggage">Luggage</option>
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
        apply: {
            icon: "<i class='fas fa-check'></i>",
            label: `Apply Changes`    
            }
      },
      default: 'yes',
      close: html => {
        let characterName = html.find('[name="characterName"]').val();
        let tileWeight = html.find('[name="weightSelect"]').val();
        let storageType = html.find('[name="typeSelect"]').val();
        let tileState = html.find('[name="stateSelect"]').val();
        setupLoadoutTiles(characterName, tileWeight, storageType, tileState)
      }

}).render(true);

async function setupLoadoutTiles(characterName, tileWeight, storageType, tileState){
    canvas.tiles.controlled.forEach(tile => tile.document.update({
        "flags.loadout": {
            "owner": game.actors.getName(characterName).id,
            "weight": tileWeight,
            "type": storageType,
            "state": tileState
        }
    }))
}