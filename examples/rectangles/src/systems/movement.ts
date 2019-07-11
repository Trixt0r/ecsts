import { System, Filter, Engine } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Velocity } from '../components/velocity';

/**
 * The movement system is responsible to update the position of each entity
 * based on its current velocity component.
 *
 * @export
 * @class MovementSystem
 * @extends {System}
 */
export class MovementSystem extends System {

  filter: Filter;

  /**
   * Caches the filter.
   *
   * @inheritdoc
   * @param {Engine} engine
   */
  onAddedToEngine(engine: Engine) {
    this.filter = engine.getFilter(Position, Velocity);
  }

  /**
   * Updates the position.
   */
  process() {
    const entities = this.filter.entities;
    for (let i = 0, l = entities.length; i < l; i++) {
      const entity = entities[i];
      const position = entity.components.get(Position);
      const velocity = entity.components.get(Velocity);
      position.x += velocity.x;
      position.y += velocity.y;
    }
  }

}
