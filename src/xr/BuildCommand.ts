import { IXRCommand } from './IXRCommand';

export function buildCommand<T extends keyof IXRCommand>(command: T, arg: IXRCommand[T]) {
  return { command, arg: JSON.stringify(arg) };
}
