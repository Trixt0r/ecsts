import { Engine, AbstractEntitySystem } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Velocity } from '../components/velocity';
import { Size } from '../components/size';
import { MyEntity } from 'entity';

/**
 * The gravity system is responsible for increasing the vertical velocity
 * of each entity if not grounded.
 *
 * @export
 * @class GravitySystem
 * @extends {System}
 */
export class GravitySystem extends AbstractEntitySystem<MyEntity> {

  canvas: HTMLCanvasElement;

  constructor(public speed: number, priority?: number) {
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
   * Makes each entity moves down, if not grounded.
   * The velocity will be increased based on current size component.
   */
  processEntity(entity: MyEntity) {
    const position = entity.components.get(Position);
    const velocity = entity.components.get(Velocity);
    const size = entity.components.get(Size);
    if (position.y + size.height < this.canvas.height)
      velocity.y += this.speed * (size.width * size.height) * 0.01;
    else if (velocity.y !== 0) {
      velocity.y *= 0.5;
      if (Math.floor(Math.abs(velocity.y)) === 0) {
        position.y = this.canvas.height - size.height;
        velocity.y = 0;
      }
    }
  }

}
