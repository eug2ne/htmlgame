import Phaser from 'phaser'
import { defineStore } from 'pinia'
import { collection, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { auth, db } from '../firestoreDB'
import SceneLoadPlugin from './SceneLoadPlugin'

// import stages
import BreakfastStage from './stages/BreakfastStage'
import Test1Stage from './stages/Test1Stage'

export const useGameStore = defineStore('game', {
  state: () => ({ stage: {
    key: 'BreakfastStage',
    player_config: { sceneKey: 'Breakfast' , x: 663, y: 472 },
    scenes_config: {
      Breakfast: {
        npc: { 'breakfast_maid': 'pre_c_repeat' },
        item: [ 'breakfast_item0', 'breakfast_item1' ]
      }
    } // default: BreakfastStage
  }, acquire_clue: null, carry_item: [], inventory: [], quiz_id: null, progress: null, booted: false }),
  getters: {},
  actions: {
    async boot(gameKey) {
      // load stage-data + present_id from db
      const uid = auth.currentUser.uid
      const UsersRef = collection(db, 'Users')
      const user_UsersRef = doc(UsersRef, uid)
      const user_UsersSnap = await getDoc(user_UsersRef)

      // load inventory from db
      this.$patch({ inventory: user_UsersSnap.data().Inventory })

      // set quiz_id to present_id in db
      this.$patch({ quiz_id: user_UsersSnap.data().present_id })

      const user_Stages = user_UsersSnap.data().Stages
      if (!_.includes(Object.keys(user_Stages), gameKey)||!user_Stages[gameKey]) {
        // stage-data == stage.default_config
        // new game/stage started >> add new stage-data to db
        const data = {}
        data[gameKey] = {
          key: this.stage.key,
          player_config: this.stage.player_config,
          scenes_config: this.stage.scenes_config
        }
        await updateDoc(user_UsersRef, {
          Stages: data
        })
      } else {
        // read stage-data from db
        this.$patch({ stage: user_Stages[gameKey] })
      }
      this.booted = true
    },
    async saveStage(gameKey) {
      // save stage-config to db
      const uid = auth.currentUser.uid
      const UsersRef = collection(db, 'Users')
      const user_UsersRef = doc(UsersRef, uid)

      const data = {}
      data[gameKey] = {
        'key': this.stage.key,
        'player_config': this.stage.player_config,
        'scenes_config': this.stage.scenes_config
      }
      await updateDoc(user_UsersRef, { Stages: data }) // update player config
    },
    async saveInven() {
      // save inventory to db
      const uid = auth.currentUser.uid
      const UsersRef = collection(db, 'Users')
      const user_UsersRef = doc(UsersRef, uid)

      await updateDoc(user_UsersRef, {
				Inventory: this.inventory
			})
    },
    async saveClue() {
      // save clue to db
      const uid = auth.currentUser.uid
      const UsersRef = collection(db, 'Users')
      const user_UsersRef = doc(UsersRef, uid)

      const data = {}
			data[this.acquire_clue.story] = arrayUnion({
				'title': this.acquire_clue.title,
				'description': this.acquire_clue.description,
				'subClues': this.acquire_clue.subClues
			})
			await updateDoc(user_UsersRef, {
				'Clues': data
			})

			// add subclue quiz-accomplishment to user.quiz_accs
			this.acquire_clue.subClues.forEach(async (subClue) => {
				if (!subClue.quiz_id) return

				const data = {}
				data[subClue.quiz_id] = false
				await updateDoc(user_UsersRef, {
					'quiz_accs': data
				})
			})
    }
  },
  persist: { storage: sessionStorage }
})

export default class game extends Phaser.Game {
  constructor(containerId) {
    const config = {
      type: Phaser.AUTO,
      width: 2800/3,
      height: 1981/3,
      parent: containerId,
      // pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: true
        }
      },
      plugins: {
        scene: [
          {
            key: 'SceneLoadPlugin',
            plugin: SceneLoadPlugin,
            start: true,
            mapping: 'sceneload'
          }
        ]
      }
    }

    super(config)
    this.key = 'k_detective_beta'
    this.stage_keys = {'BreakfastStage':BreakfastStage, 'Test1Stage':Test1Stage}
  }

  create() {
    // pass stage-data to game.stage
    const stage_class = this.stage_keys[useGameStore().stage.key]
    this.stage = new stage_class(this.plugins) // create game.stage
    this.stage.player_config = useGameStore().stage // pass player-config to game.stage
    this.stage.preload()
    
    const PlayScene_Key = this.stage.player_config.sceneKey // present sceneKey
    // set stage-data
    const config = {
      player_config: this.stage.player_config,
      scenes_config: this.stage.scenes_config,
      item_carry: useGameStore().carry_item
    }
    this.scene.start(PlayScene_Key, config) // pass stage-data to scene
  }

  // async pause(clue, item) {
  //   this.scene.pause() // pause game

  //   // update stage data
  //   const config = this.scene.getScene(this.stage.player_config.sceneKey).sceneload.config
  //   this.stage.player_config = config

  //   const firestore = this.plugins.get('FirebasePlugin')
  //   // save player_config + inventory to db
  //   const stage = {
  //     'item_carry': this.stage.item_carry,
  //     'key': this.stage.key,
  //     'player_config': this.stage.player_config,
  //     'scenes_config': this.stage.scenes_config
  //   }

  //   await firestore.saveGameData(stage, this.key, clue, item)

  //   setTimeout(() => {
  //     this.scene.resume()
  //   },)
  // }

  progress(progress) {
    if (progress.split('.').length > 1) {
      // item-hold event >> pass item to player-config + update user-config on db
      this.stage.itemHold(progress)
    } else {
      // pass outer-game progress
      this.stage.progressEvent(progress)
    }
  }
}
