import { Component } from '@trixt0r/ecs';

export class Velocity implements Component {

  constructor(public x = 0, public y = 0) { }

}
