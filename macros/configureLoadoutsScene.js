const currentScene = game.scenes.current

const loadoutsTileDialog = new Dialog({
    title: "Define Loadouts Scene Options",
    content:`
    <form>
      <div class="form-group">
        <label>Loadouts Name</label>
        <input type='text' placeholder='Leave empty to use Foundry scene name' name='loadoutsName'></input>
      </div>
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
            "name": loadoutsName ? allowedTypes : null
        }
    })
}