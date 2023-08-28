import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useListen } from '../../hook/useListen';
import { FWContext } from './FWContext';

export const useFWPanelSize = () => {
  const ctx = useContext(FWContext);

  const calcSize = () => {
    const bodyEle = document.getElementById(`FW-component-body-${ctx.currentLayout.key}`);
    if (!bodyEle) throw new Error('missing bodyEle: ' + ctx.currentLayout.key);

    const _bodySize = bodyEle.getBoundingClientRect();
    return { width: _bodySize.width, height: _bodySize.height };
  };

  const [size, setSize] = useState<{ width: number; height: number }>(calcSize());

  useListen(ctx.event, 'reflow', () => setSize(calcSize()));
  useLayoutEffect(() => setSize(calcSize()), []);

  return size;
};
