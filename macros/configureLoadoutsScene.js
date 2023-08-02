const currentScene = game.scenes.current

const loadoutsTileDialog = new Dialog({
    title: "Define Loadouts Scene Options",
    content:`
    <form>
      <div class="form-group">
        <label>Loadouts Name</label>
        <input type='text' name='loadoutsName'></input>
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
      </div>`,
      buttons: {
        cancel: {
            icon: "<i class='fas fa-check'></i>",
            label: `Cancel`,
            callback: function(){ return; }  
            },
            apply: {
                icon: "<i class='fas fa-check'></i>",
                label: `Apply`,
                callback: html => {setupLoadoutsScene(
                    html.find('[name="loadoutsName"]').val(),
                    html.find('[name="weightSelect"]').val()
                    ) }
                }
      },
      default: 'cancel'
}).render(true);

async function setupLoadoutsScene(loadoutsName, loadoutsWeight){
    currentScene.update({
        "flags.loadouts": {
            "isLoadoutsScene": true,
            "name": loadoutsName,
            "weight": loadoutsWeight
        }
    })
}