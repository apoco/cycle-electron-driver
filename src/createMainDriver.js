import { app } from 'electron';

import AppDriver from './MainDriver';

export default function createAppDriver() {
  return AppDriver(app);
}
