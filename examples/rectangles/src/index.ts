import '../style.css';
import { Engine } from '@trixt0r/ecs';
import { RenderingSystem } from './systems/renderer';
import { MovementSystem } from './systems/movement';
import { CollisionSystem } from './systems/collision';
import { GravitySystem } from './systems/gravity';
import { MyEntity } from './entity';
import { Position } from './components/position';
import { Velocity } from './components/velocity';
import { Size } from './components/size';
import { ResizeSystem } from './systems/resize';

// Setup the engine
const engine = new Engine();

// Add all systems
engine.systems.add(new MovementSystem(0));
engine.systems.add(new ResizeSystem(0));
engine.systems.add(new GravitySystem(0.25, 1));
engine.systems.add(new CollisionSystem(2));
engine.systems.add(new RenderingSystem(3));

const canvas = <HTMLCanvasElement>document.getElementById('canvas');
const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;

/**
 * Adds new entities to the engine, with a position, size and velocity.
 *
 * @param {number} times Indicates how many entities to add.
 */
function addEntity(times: number) {
  const toAdd = [];
  for (let i = 0; i < times; i++) {
    const entity = new MyEntity();
    const size = new Size(5 + Math.random() * 10, 5 + Math.random() * 10);
    const position = new Position(Math.random() * canvasWidth, Math.random() * canvasHeight);

    entity.components.add(position);
    entity.components.add(new Velocity(-1 + Math.random() * 2, -1 + Math.random() * 2));
    entity.components.add(size);
    toAdd.push(entity);
  }
  engine.entities.add.apply(engine.entities, toAdd);
}

/**
 * Resolves after the given time.
 *
 * @param {number} ms
 * @returns {Promise<any>}
 */
async function wait(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let t = Date.now();

function run() {
  requestAnimationFrame(() => {
    const now = Date.now();
    const delta = now - t;
    t = now;
    engine.run(delta);
    run();
  });
}

run();

async function setUp() {
  for (let i = 0; i < 5; i++) {
    addEntity(200);
    await wait(10);
  }
}

setUp();
