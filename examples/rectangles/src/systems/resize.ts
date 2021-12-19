import { System, Aspect, Engine } from '@trixt0r/ecs';
import { Velocity } from '../components/velocity';

/**
 * The resize system is responsible for making the rectangles bounce up
 * if the user shrinks the window height.
 *
 * @export
 * @class ResizeSystem
 * @extends {System}
 */
export class ResizeSystem extends System {
  aspect: Aspect;
  canvas: HTMLCanvasElement;
  dirty: boolean;
  oldHeight: number;

  constructor(priority?: number) {
    super(priority);
    this.dirty = false;
    this.oldHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      if (window.innerHeight > this.oldHeight) this.oldHeight = window.innerHeight;
      else this.dirty = true;
    });
  }

  /**
   * Caches the filter and canvas.
   *
   * @inheritdoc
   * @param {Engine} engine
   */
  onAddedToEngine(engine: Engine) {
    this.aspect = Aspect.for(engine).one(Velocity);
    this.canvas = <HTMLCanvasElement>document.getElementById('canvas');
  }

  /**
   * Runs the actual bounce logic on each entity,
   * if previously resized.
   */
  process() {
    if (!this.dirty) return;
    const diff = Math.min(20, this.oldHeight - window.innerHeight);
    this.aspect.entities.forEach(entity => {
      const velocity = entity.components.get(Velocity);
      if (velocity.y === 0) {
        velocity.y -= diff;
      }
    });
    this.oldHeight = window.innerHeight;
    this.dirty = false;
  }
}
