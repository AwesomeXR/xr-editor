import { useContext } from 'react';
import ReactDOM from 'react-dom';
import { FWContext } from './FWContext';

export const useFWHeaderSlot = <C extends string>() => {
  const ctx = useContext(FWContext);
  const key = ctx.currentLayout.key;

  return (node: React.ReactNode) => {
    const slotEle = document.getElementById(`FW-internal-slot-${key}`);
    if (!slotEle) throw new Error('missing slot: ' + key);

    return ReactDOM.createPortal(node, slotEle);
  };
};
