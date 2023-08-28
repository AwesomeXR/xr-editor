import { DefaultBizLogger } from './BizLogger';
import { getInternalRandomString } from './getInternalRandomString';

declare const FinalizationRegistry: any;

const _logger = DefaultBizLogger.extend('AutoCleaner');

const _registry = new FinalizationRegistry((item: any) => {
  _logger.info('callback: %s', item.key);
  item.finalizer();
});

export const AutoCleaner = {
  register(target: any, finalizer: () => void, key = getInternalRandomString()) {
    const token = { key };

    _logger.info('register: %s', key);
    _registry.register(target, { finalizer, key }, token);

    return () => _registry.unregister(token);
  },
};
