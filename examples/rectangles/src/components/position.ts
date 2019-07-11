import { Component } from '@trixt0r/ecs';

export class Position implements Component {

  constructor(public x = 0, public y = 0) { }

}
