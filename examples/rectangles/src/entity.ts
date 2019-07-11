import { Entity } from '@trixt0r/ecs';

let id = 1;

export class MyEntity extends Entity {

  constructor() {
    super(id++);
  }

}
