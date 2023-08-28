import { useState } from 'react';

export const useForceUpdate = () => {
  const [key, setKey] = useState(0);
  return { key, update: () => setKey(_k => _k + 1) };
};
