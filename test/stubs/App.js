import EventEmitter from 'events';
import { spy, stub } from 'sinon';

export default function AppStub() {
  return Object.assign(new EventEmitter(), {
    getName: stub(),
    getVersion: stub(),
    getLocale: stub(),
    getAppPath: stub(),
    getPath: stub(),
    isAeroGlassEnabled: stub(),
    makeSingleInstance: stub(),
    setPath: spy(),
    addRecentDocument: spy(),
    clearRecentDocuments: spy(),
    setUserTasks: spy(),
    appendSwitch: spy(),
    appendArgument: spy(),
    allowNTLMCredentialsForAllDomains: spy(),
    setAppUserModelId: spy(),
    exit: spy(),
    quit: spy(),
    show: spy(),
    hide: spy(),
    dock: {
      bounce: stub(),
      cancelBounce: spy(),
      getBadge: stub(),
      setBadge: spy(),
      show: spy(),
      hide: spy(),
      setMenu: spy(),
      setIcon: spy()
    }
  });
}
