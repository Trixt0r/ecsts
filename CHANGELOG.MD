# Changelog

### 0.4.6

Type definition fix for `Class` and `ComponentClass`.

### 0.4.4

100% code coverage & code cleanup.

### 0.4.3

Fixed component caching bug, not returning all components for a string type per component instance.

### 0.4.0

Fixed aspect bugs.

### 0.3.0

Components can now also have an optional `id`.
Aspects support the id value for filtering certain entities.

### 0.2.2

Target ES5.

### 0.2.1

Fixed vulnerabilities in package.json.

## 0.2.0

This version adds improvements to the `Aspect` and `AbstractEntitySystem` classes.

### Improvements

- `Aspect` is now a dispatcher, which dispatches events like `onAddedEntities`, `onAddedComponents`, etc.
- `AbstractEntitySystem` listens for the new dispatched events and adds stub methods
  for systems extending the abstraction. This way you can avoid boilerplate code.
- Various minor fixes.

## 0.1.0

This version includes breaking changes for filtering entities by components.

### Improvements

- Upgrade to Typescript 3.6.3
- Renamed `Filter` to `Aspect`
  - The API changed.
  - Instead of using `Filter.getFor(...)` use now `Aspect.for(engine|collection).one(...)` to get the old behavior.
  - `Aspect` provides 3 more methods for better filtering: `all`, `exclude` and `one`.
- `Engine` has no `getFilter` method anymore. Use `Aspect.for(engine)` instead.
- Options for `Engine.run` is now an optional argument.
- New `AbstractEntitySystem` which can be used for systems which process entities.
  - Use this class to keep boilerplate code low.
  - Those systems can pass component type arguments to the super constructor, to auto filter entities within an engine.
