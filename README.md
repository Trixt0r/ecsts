# ECS-TS

A simple to use entity component system library written in TypeScript.

It is meant to be used for any usecase.
So you will not find any game specific logic in this library.

## Install

```
npm install git://github.com/Trixt0r/ecsts.git#npm
```

Browser builds and support for installs directly from the npm registry are on the way.

## Usage

The main parts of this library are

  * [`Component`](https://github.com/Trixt0r/ecsts/blob/master/src/core/component.ts)
  * [`Entity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L46)
  * [`System`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L55)
  * [`Engine`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L75)

### Component

A [`Component`](https://github.com/Trixt0r/ecsts/blob/master/src/core/component.ts) is defined as an interface with no specific methods or properties.<br>
I highly suggest you to implement your components as classes, since the systems will rely on those.

For example, you could define a position like this:

```ts
import { Component } from '@trixt0r/ecsts';

class Position implements Component {
  constructor(public x = 0, public y = 0) { }
}
```

### Entity

Entities are the elements, your systems will work with and have an unique identifier.

Since this library doesn't want you to tell, how to generate your ids, the base class [`Entity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L46) is abstract.<br>
This means your entity implementation should extend [`Entity`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L46).

For example, you could do something like this:

```ts
import { Entity } from '@trixt0r/ecsts';

class MyEntity extends Entity {
  constructor() {
    super(makeId());
  }
}
```

Adding components is just as simple as:

```ts
myComponent.components.add(new Position(10, 20));
```

An entity, is a [`Dispatcher`](https://github.com/Trixt0r/ecsts/blob/master/src/core/dispatcher.ts), which means, you can register an [`EntityListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/entity.ts#L11) on it, to check whether a component has been added, removed, the components have beend sorted or cleared.

### System

Systems implement the actual behaviour of your entities, based on which components they own.

For programming your own systems, you should implement the abstract class [`System`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L55).<br>
This base class provides basic functionalities, such as

  * an `updating` flag, which indicates whether a system is still updating.
  * an `active` flag, which tells the engine to either run the system in the next update call or not.
  * an `engine` property, which will be set/unset, as soon as the system gets added/removed to/from an engine.

A system is also a [`Dispatcher`](https://github.com/Trixt0r/ecsts/blob/master/src/core/dispatcher.ts), which means, you can react to any actions happening to a system, by registering a [`SystemListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/system.ts#L10).

Here is a minimal example of a system, which obtains a list of entities with the component type `Position`.

```ts
import { System, Filter } from '@trixt0r/ecsts';

class MySystem extends System {

  private filter: Filter;

  constructor() {
    super(/* optional priority here */);
  }

  onAddedToEngine(engine: Engine): void {
    // filter entities by component 'Position'
    this.filter = engine.getFilter(Position);
  }

  async process(): Promise<any> {
    const entities = this.filter.entities;
    entities.forEach(entity => {
      const position = entity.components.get(Position);
      //... do your logic here
    });
  }
}
```
Note that `process` can be `async`. So a system can potentially block successive systems as long as it did not resolve or reject.

### Engine

An [`Engine`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L75) ties systems and entities together.<br>
It holds collections of both types, to which you can register listeners. But you could also register an [`EngineListener`](https://github.com/Trixt0r/ecsts/blob/master/src/core/engine.ts#L15), to listen for actions happening inside an engine.

Here is a minimal example on how to initialize an engine and add systems and/or entities to it:

```ts
import { Engine } from '@trixt0r/ecsts';

// Init the engine
const engine = new Engine();

engine.systems.add(new MySytem());
engine.entities.add(new MyEntity());

// anywhere in your business logic or main loop
engine.update(delta);
```
