import { AbstractEntity } from '@trixt0r/ecs';

let id = 1;

export class MyEntity extends AbstractEntity {

  constructor() {
    super(id++);
  }

}
