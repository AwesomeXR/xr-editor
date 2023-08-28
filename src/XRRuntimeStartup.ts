import { ILoadOpt, loadXRRuntime, DefaultBizLogger as RTDefaultBizLogger } from 'xr-runtime/dist/h5';

const handleGlobalError = (ev: ErrorEvent): void => {
  RTDefaultBizLogger.error('message=%s, source=%s, lineno=%s, colno=%s', ev.message, ev.filename, ev.lineno, ev.colno);
};

const handleGlobalRejection = (ev: PromiseRejectionEvent): void => {
  RTDefaultBizLogger.error('reason=%s', ev.reason);
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleGlobalRejection);

export const start = (opt: ILoadOpt) => loadXRRuntime(opt);
