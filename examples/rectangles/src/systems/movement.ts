import { AbstractEntitySystem } from '@trixt0r/ecs';
import { Position } from '../components/position';
import { Velocity } from '../components/velocity';
import { MyEntity } from 'entity';

/**
 * The movement system is responsible to update the position of each entity
 * based on its current velocity component.
 *
 * @export
 * @class MovementSystem
 * @extends {System}
 */
export class MovementSystem extends AbstractEntitySystem<MyEntity> {
  constructor(priority = 0) {
    super(priority, [Position, Velocity]);
  }

  /**
   * Updates the position.
   */
  processEntity(entity: MyEntity) {
    const position = entity.components.get(Position);
    const velocity = entity.components.get(Velocity);
    position.x += velocity.x;
    position.y += velocity.y;
  }
}
