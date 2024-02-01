export type RegistryAction = () => void;
export type RegistryCleanup = ((skip?: boolean) => void) & {
  action: RegistryAction;
};

export default function newRegistry(
  onError = console.error,
): [
  (action: RegistryAction) => RegistryCleanup,
  () => void,
  (action: RegistryAction) => void,
] {
  let counter = 0;
  const registrations: Record<number, RegistryCleanup> = {};
  const register = (action: RegistryAction): RegistryCleanup => {
    const id = counter++;
    const cleanup = (skip = false) => {
      try {
        delete registrations[id];
        return !skip && action && action();
      } catch (error) {
        onError(error);
      }
    };
    cleanup.action = action;
    return (registrations[id] = cleanup as RegistryCleanup);
  };
  const unregister: (action: RegistryAction) => void = (
    action: RegistryAction,
  ) => {
    Object.values(registrations).forEach((r) => r.action === action && r(true));
  };
  const clear: () => void = () => {
    Object.values(registrations).forEach((r) => r());
  };
  return [register, clear, unregister];
}
