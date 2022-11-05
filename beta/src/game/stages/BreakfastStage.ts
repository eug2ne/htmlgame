import Phaser from "phaser"
import Stage from "./Stage.js"
import Breakfast from '../scenes/Breakfast.js'
import Test1Stage from "./Test1Stage"

const default_config = {
  'player_config': { 'sceneKey': 'Breakfast' , 'x': 663, 'y': 472 },
  'scenes_config': {
    'Breakfast': {
      'npc': { 'breakfast_maid': 'pre_c_repeat' },
      'item': [ 'breakfast_item0', 'breakfast_item1' ]
    }
  }
}

export default class BreakfastStage extends Stage {
  constructor(manager: Phaser.Plugins.PluginManager) {
    super(manager, [ Breakfast ], default_config, null, 'BreakfastStage', new Test1Stage(manager))
  }

  event(scene: Phaser.Scene): void {
    // update player_config after eating breakfast
    scene.events.on('to-update.breakfast_maid.post_c_repeat', () => {
      this.scenes_config['Breakfast'].npc['breakfast_maid'] = 'post_c_repeat'
    })

    // update player_config after reading newspaper
    scene.events.on('to-update.breakfast_maid.answer.==post_c_repeat', () => {
      if (this.scenes_config['Breakfast'].npc['breakfast_maid'] == 'post_c_repeat') {
        this.scenes_config['Breakfast'].npc['breakfast_maid'] = 'answer'
      } else {
        // pass
      }
    })

    // if player talk to maid when maid.dialogueKey == answer, stage clear
    scene.events.on('update-userconfig', (id: string, to: string, clue: any) => {
      this.clear()
    })
  }
}