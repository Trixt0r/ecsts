# ECS-TS

A simple to use entity component system library written in TypeScript.

It is meant to be used for any usecase.
So you will not find any game specific logic in this library.

## Install

```
npm install @trixt0r/ecs
```

## Examples

Checkout the [examples](https://github.com/Trixt0r/ecsts/tree/master/examples).

Check the [rectangles example](https://stackblitz.com/edit/ecs-example-rectangles) out, if you do not want to checkout the code.

## Usage

The main parts of this library are

  * [`Component`](https://github.com/Trixt0r/ecsts/blob/master/src/core/component.ts)
  * [`Entity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L52)
  * [`System`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L77)
  * [`Engine`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L96)

### Component

A [`Component`](https://github.com/Trixt0r/ecsts/blob/master/src/core/component.ts) is defined as an interface with no specific methods or properties.<br>
I highly suggest you to implement your components as classes, since the systems will rely on those.

For example, you could define a position like this:

```ts
import { Component } from '@trixt0r/ecs';

class Position implements Component {
  constructor(public x = 0, public y = 0) { }
}
```

### Entity

Entities are the elements, your systems will work with and have an unique identifier.

Since this library doesn't want you to tell, how to generate your ids, the base class [`AbstractEntity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L52) is abstract.<br>
This means your entity implementation should extend [`AbstractEntity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L52).

For example, you could do something like this:

```ts
import { AbstractEntity } from '@trixt0r/ecs';

class MyEntity extends AbstractEntity {
  constructor() {
    super(makeId());
  }
}
```

Adding components is just as simple as:

```ts
myComponent.components.add(new Position(10, 20));
```

An entity, is a [`Dispatcher`](https://github.com/Trixt0r/ecsts/blob/master/src/core/dispatcher.ts), which means, you can register an [`EntityListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L12) on it, to check whether a component has been added, removed, the components have been sorted or cleared.

### System

Systems implement the actual behavior of your entities, based on which components they own.

For programming your own systems, you should implement the abstract class [`System`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L77).<br>
This base class provides basic functionalities, such as

  * an `updating` flag, which indicates whether a system is still updating.
  * an `active` flag, which tells the engine to either run the system in the next update call or not.
  * an `engine` property, which will be set/unset, as soon as the system gets added/removed to/from an engine.

A system is also a [`Dispatcher`](https://github.com/Trixt0r/ecsts/blob/master/src/core/dispatcher.ts), which means, you can react to any actions happening to a system, by registering a [`SystemListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L14).

Here is a minimal example of a system, which obtains a list of entities with the component type `Position`.

```ts
import { System, Aspect } from '@trixt0r/ecs';

class MySystem extends System {

  private aspect: Aspect;

  constructor() {
    super(/* optional priority here */);
  }

  onAddedToEngine(engine: Engine): void {
    // get entities by component 'Position'
    this.aspect = Aspect.for(engine).all(Position);
  }

  async process(): void {
    const entities = this.aspect.entities;
    entities.forEach(entity => {
      const position = entity.components.get(Position);
      //... do your logic here
    });
  }
}
```
Note that `process` can be `async`.<br>
If your systems need to do asynchronous tasks, you can implement them as those.
Your engine can then run them as such.<br>
This might be useful, if you do not have data which needs to be processed every frame.

In order to keep your focus on the actual system and not the boilerplate code around,
you can use the [`AbstractEntitySystem`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L269).

The class will help you by providing component types for directly defining an aspect for your system.
The above code would become:

```ts
import { System, Aspect } from '@trixt0r/ecs';

class MySystem extends AbstractEntitySystem<MyEntity> {

  constructor() {
    super(/* optional priority here */, [Position]);
  }

  async processEntity(entity: MyEntity): void {
    const position = entity.components.get(Position);
    //... do your logic here
  }
}
```

### Engine

An [`Engine`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L96) ties systems and entities together.<br>
It holds collections of both types, to which you can register listeners. But you could also register an [`EngineListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L12), to listen for actions happening inside an engine.

Here is a minimal example on how to initialize an engine and add systems and/or entities to it:

```ts
import { Engine, EngineMode } from '@trixt0r/ecs';

// Init the engine
const engine = new Engine();

engine.systems.add(new MySystem());
engine.entities.add(new MyEntity());

// anywhere in your business logic or main loop
engine.run(delta);

// if you want to perform your tasks asynchronously
engine.run(delta, EngineMode.SUCCESSIVE); // Wait for a task to finish
// or...
engine.run(delta, EngineMode.PARALLEL); // Run all systems asynchronously in parallel
```

## Support

If you find any odd behavior or other improvements, feel free to create issues.
Pull requests are also welcome!

Otherwise you can help me out by buying me a coffee.

<a href="https://www.buymeacoffee.com/Trixt0r" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
