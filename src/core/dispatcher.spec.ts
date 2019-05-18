import { Dispatcher } from './dispatcher';

interface MyListener {
  process?(...args: any[]): void;
}
class MyDispatcher extends Dispatcher<MyListener> { }

describe('Dispatcher', () => {

  let dispatcher: MyDispatcher;

  beforeEach(() => {
    dispatcher = new MyDispatcher();
  });

  describe('initial', () => {
    it('should have no listeners', () => {
      expect(dispatcher.listeners.length).toBe(0);
    });
  });

  describe('listeners', () => {
    it('should not care about directly pushed listeners', () => {
      (<any>dispatcher.listeners).push({});
      expect(dispatcher.listeners.length).toBe(0);
    })
  });

  describe('addListener', () => {
    it('should add a listener to the dispatcher', () => {
      const listener: MyListener = { };
      const re = dispatcher.addListener(listener);
      expect(dispatcher.listeners.length).toBe(1);
      expect(re).toBe(true);
    });

    it('should not add the same listener twice', () => {
      const listener: MyListener = { };
      dispatcher.addListener(listener);
      const re = dispatcher.addListener(listener);
      expect(dispatcher.listeners.length).toBe(1);
      expect(re).toBe(false);
    });
  });

  describe('removeListener', () => {
    const listener: MyListener = { };

    beforeEach(() => dispatcher.addListener(listener));

    it('should remove the previously added event listener', () => {
      const re = dispatcher.removeListener(listener);
      expect(dispatcher.listeners.length).toBe(0);
      expect(re).toBe(true);
    });

    it('should remove the listener at an index in bounds', () => {
      const re = dispatcher.removeListener(0);
      expect(dispatcher.listeners.length).toBe(0);
      expect(re).toBe(true);
    });

    it('should not remove a listener which was not added', () => {
      const re = dispatcher.removeListener({ });
      expect(dispatcher.listeners.length).toBe(1);
      expect(re).toBe(false);
    });

    it('should not remove anything if the index is out of bounds', () => {
      const re = dispatcher.removeListener(1);
      expect(dispatcher.listeners.length).toBe(1);
      expect(re).toBe(false);
    });

    it('should not remove previoulsy removed listener', () => {
      dispatcher.removeListener(listener);
      const re = dispatcher.removeListener(listener);
      expect(dispatcher.listeners.length).toBe(0);
      expect(re).toBe(false);
    });

    it('should throw if a locked listener gets removed', () => {
      const listener = { };
      dispatcher.addListener(listener, true);
      expect(() => dispatcher.removeListener(listener)).toThrowError('Listener at index 1 is locked.');
    });
  });

  describe('dispatch', () => {

    it('should call the given function name on each listener', () => {
      let calls = 0;
      const listeners = 10;
      for (let i = 0; i < listeners; i++)
        dispatcher.addListener({ process: () => calls++ });
      dispatcher.dispatch('process');
      expect(calls).toBe(listeners);
    });

    it('should pass all arguments to the listeners', () => {
      let args = 0;
      const listeners = 10;
      for (let i = 0; i < listeners; i++)
        dispatcher.addListener({
          process: function (number, string, bool, nil, array) {
            args += arguments.length;
            expect(number).toBe(1);
            expect(string).toBe('abc');
            expect(bool).toBe(true);
            expect(nil).toBe(null);
            expect(array).toEqual([]);
          }
        });
      dispatcher.dispatch('process', 1, 'abc', true, null, []);
      expect(args).toBe(listeners * 5);
    });

    it('should not call the given function name on listeners which have been removed', () => {
      let calls = 0;
      const listeners = 10;
      const toRemove = 5;
      for (let i = 0; i < listeners; i++)
        dispatcher.addListener({ process: () => calls++ });
      for (let i = 0; i < toRemove; i++)
        dispatcher.removeListener(listeners - 1 - i);
      dispatcher.dispatch('process');
      expect(calls).toBe(listeners - toRemove);
    });

    it('should only call the given function name on listeners which implemented the function', () => {
      let calls = 0;
      const listeners = 5;
      const wrongListeners = 5;
      for (let i = 0; i < listeners; i++)
        dispatcher.addListener({ process: () => calls++ });
      for (let i = 0; i < wrongListeners; i++)
        dispatcher.addListener(<any>{ processOther: () => calls++ });
      dispatcher.dispatch('process');
      expect(calls).toBe(listeners);
    });

  });
});
