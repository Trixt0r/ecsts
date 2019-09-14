import { Application, Graphics, Text } from 'pixi.js';
import { System, Aspect, Engine } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Size } from '../components/size';

/**
 * Renders each entity, based its position and size component.
 *
 * @export
 * @class RenderingSystem
 * @extends {System}
 */
export class RenderingSystem extends System {

  aspect: Aspect;
  pixiApp: Application;
  graphics: Graphics;
  fps: Text;
  timePassed: number;

  constructor(priority: number = 0) {
    super(priority);
    this.pixiApp = new Application({
      view: <HTMLCanvasElement>document.getElementById('canvas'),
      backgroundColor: 0x1155aa
    });
    this.timePassed = 350;
    this.fps = new Text('FPS: ', { fill: 0xffffff });
    this.graphics = new Graphics();
    this.pixiApp.stage.addChild(this.graphics);
    this.pixiApp.stage.addChild(this.fps);
    this.pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
    this.pixiApp.stop();
    window.addEventListener('resize', () => {
      this.pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Caches the filter.
   *
   * @inheritdoc
   * @param {Engine} engine
   */
  onAddedToEngine(engine: Engine) {
    this.aspect = Aspect.for(engine).all(Position, Size);
  }

  /**
   * Renders each entity as a red rectangle.
   *
   * @param {number} delta
   */
  process(delta: number) {
    this.timePassed += delta;
    if (this.timePassed > 300) {
      this.fps.text = 'FPS: ' + Math.floor((1000 / delta)) + '\n' +
                      'ms: ' + delta + '\n' +
                      'entities: ' + this.engine.entities.length;
      this.timePassed = 0;
    }
    const entities = this.aspect.entities;
    this.graphics.clear();
    this.graphics.beginFill(0xaa1100);
    // this.graphics.lineStyle(1, 0xffffff);
    for (const entity of entities) {
      const position = entity.components.get(Position);
      const size = entity.components.get(Size);
      this.graphics.drawRect(position.x, position.y, size.width, size.height);
    }
    this.graphics.endFill();
    this.pixiApp.render();
  }

}
