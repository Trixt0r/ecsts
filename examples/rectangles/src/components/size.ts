import { Component } from '@trixt0r/ecs';

export class Size implements Component {

  constructor(public width = 10, public height = 10) { }

}
