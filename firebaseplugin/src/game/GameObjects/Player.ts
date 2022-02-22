import Phaser from 'phaser'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public area: Phaser.GameObjects.Rectangle

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: Phaser.Textures.Texture
  ) {
    console.log('playerconstruct')
    super(scene, x, y, texture)
    scene.add.existing(this).setScale(0.16)
    scene.physics.add.existing(this)
  }

  destroy() {
		super.destroy()
	}

  create() {
    console.log('playercreate')
    this.scene.cameras.main.startFollow(this, false, 0.2, 0.2)

    // create animation
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('sami', { start: 1, end: 4 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
        key: 'back',
        frames: this.anims.generateFrameNumbers('sami', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'front',
        frames: this.anims.generateFrameNumbers('sami', { start: 9, end: 12 }),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('sami', { start: 13, end: 16 }),
        frameRate: 10,
        repeat: -1
    })

    // create interaction area
    const boxX = this.body.x+this.body.width/2, boxY = this.body.y+this.body.height/2
    this.area = this.scene.add.rectangle(boxX, boxY, this.body.width+10, this.body.height+10)
      .setStrokeStyle(4, 0x0099ff)
    this.scene.physics.add.existing(this.area)
  }

  update(event: string) {
    const boxX = this.body.x+this.body.width/2, boxY = this.body.y+this.body.height/2

    // controls
    switch (event) {
      case 'up':
        // up
        this.setVelocityY(-160*4)
        this.anims.play('back', true)
        break

      case 'down':
        // down
        this.setVelocityY(160*4)
        this.anims.play('front', true)
        break

      case 'left':
        // left
        this.setVelocityX(-160*4)
        this.anims.play('left', true)
        break

      case 'right':
        // right
        this.setVelocityX(160*4)
        this.anims.play('right', true)
        break

      default:
        this.anims.stop()
    }

    this.body.velocity.normalize().scale(50*4)

    // update area coord
    this.area.setPosition(boxX, boxY)
  }
}