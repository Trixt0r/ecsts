import { System, Filter, Engine } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Velocity } from '../components/velocity';
import { Size } from '../components/size';

/**
 * The gravity system is responsible for increasing the vertical velocity
 * of each entity if not grounded.
 *
 * @export
 * @class GravitySystem
 * @extends {System}
 */
export class GravitySystem extends System {

  filter: Filter;
  canvas: HTMLCanvasElement;

  constructor(public speed: number, priority?: number) {
    super(priority);
  }

  /**
   * Caches the filter and canvas.
   *
   * @inheritdoc
   * @param {Engine} engine
   */
  onAddedToEngine(engine: Engine) {
    this.filter = engine.getFilter(Position, Velocity, Size);
    this.canvas = <HTMLCanvasElement>document.getElementById('canvas');
  }

  /**
   * Makes each entity move down, if not grounded.
   * The velocity will be increased based on current size component.
   */
  process() {
    const entities = this.filter.entities;
    for (let i = 0, l = entities.length; i < l; i++) {
      const entity = entities[i];
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

}
