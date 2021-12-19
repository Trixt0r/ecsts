import { Engine, AbstractEntitySystem } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Velocity } from '../components/velocity';
import { Size } from '../components/size';
import { MyEntity } from 'entity';

/**
 * A system which handles collisions with the bounds of the scene.
 *
 * @export
 * @class CollisionSystem
 * @extends {System}
 */
export class CollisionSystem extends AbstractEntitySystem<MyEntity> {
  canvas: HTMLCanvasElement;

  constructor(priority = 0) {
    super(priority, [Position, Velocity, Size]);
  }

  /**
   * Caches the filter and canvas.
   *
   * @inheritdoc
   * @param {Engine} engine
   */
  onAddedToEngine(engine: Engine) {
    super.onAddedToEngine(engine);
    this.canvas = <HTMLCanvasElement>document.getElementById('canvas');
  }

  /**
   * Performs the collision detection,
   * i.e. makes sure each entity stays in the scene.
   */
  processEntity(entity: MyEntity) {
    const position = entity.components.get(Position);
    const velocity = entity.components.get(Velocity);
    const size = entity.components.get(Size);
    if (position.x + size.width > this.canvas.width || position.x < 0) velocity.x *= -1;
    if (position.y < 0 && velocity.y < 0) velocity.y = 0;
    else if (position.y + size.height >= this.canvas.height && velocity.y > 0) velocity.y *= -1;
    position.x = Math.min(this.canvas.width - size.width, Math.max(0, position.x));
    position.y = Math.min(this.canvas.height - size.height, Math.max(0, position.y));
  }
}
