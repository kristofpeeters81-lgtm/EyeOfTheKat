import { CameraSession } from './session';

/** Eén camerasessie voor de hele app (de camera blijft aan tussen schermen). */
let instance: CameraSession | null = null;

export function getSession(): CameraSession {
  instance ??= new CameraSession();
  return instance;
}
