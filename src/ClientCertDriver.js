import fromEvent from 'xstream/extra/fromEvent';

export default function ClientCertDriver(app) {
  return prompt$ => {
    prompt$
      .filter(({ event: { callback } }) => callback)
      .addListener({
        next: ({ event: { callback }, cert }) => callback(cert)
      });

    return fromEvent(app, 'select-client-certificate')
      .map(arg => {
        arg = Array.isArray(arg) ? arg : [arg];
        const [{ preventDefault }, webContents, url, certificateList, callback] = arg;
        preventDefault && preventDefault();
        return { webContents, url, certificateList, callback };
      });
  };
}
