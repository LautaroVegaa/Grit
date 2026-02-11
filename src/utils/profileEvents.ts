type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToProfileUpdates = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitProfileUpdated = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      if (__DEV__) {
        console.warn('Profile update listener failed', error);
      }
    }
  });
};
