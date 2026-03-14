import InputHandler from '../scripts/inputHandler';

describe('InputHandler', () => {
  let addSpy;
  let removeSpy;

  beforeEach(() => {
    addSpy = (...args) => {
      addSpy.calls.push(args);
    };
    addSpy.calls = [];

    removeSpy = (...args) => {
      removeSpy.calls.push(args);
    };
    removeSpy.calls = [];

    global.window = {
      addEventListener: addSpy,
      removeEventListener: removeSpy
    };

    global.navigator = {
      maxTouchPoints: 0
    };

    global.document = {
      getElementById: () => null
    };
  });

  test('enable registers key listeners once and marks handler enabled', () => {
    const handler = new InputHandler();

    handler.enable();
    handler.enable();

    expect(handler.enabled).toBe(true);
    expect(addSpy.calls).toHaveLength(2);
    expect(addSpy.calls).toContainEqual(['keydown', handler.boundHandleKeyDown]);
    expect(addSpy.calls).toContainEqual(['keyup', handler.boundHandleKeyUp]);
  });

  test('disable unregisters listeners and marks handler disabled', () => {
    const handler = new InputHandler();

    handler.enable();
    handler.disable();

    expect(handler.enabled).toBe(false);
    expect(removeSpy.calls).toHaveLength(2);
    expect(removeSpy.calls).toContainEqual(['keydown', handler.boundHandleKeyDown]);
    expect(removeSpy.calls).toContainEqual(['keyup', handler.boundHandleKeyUp]);
  });

  test('keydown and keyup emit movement state transitions', () => {
    const handler = new InputHandler();
    const moveEvents = [];

    handler.on('left', (pressed) => {
      moveEvents.push(pressed);
    });

    handler.handleKeyDown({ code: 'ArrowLeft' });
    handler.handleKeyUp({ code: 'ArrowLeft' });

    expect(handler.keys.left).toBe(false);
    expect(moveEvents).toEqual([true, false]);
  });

  test('pause key emits pause event', () => {
    const handler = new InputHandler();
    const pauseState = { count: 0 };

    handler.on('pause', () => {
      pauseState.count += 1;
    });
    handler.handleKeyDown({ code: 'KeyP' });

    expect(pauseState.count).toBe(2);
  });
});
