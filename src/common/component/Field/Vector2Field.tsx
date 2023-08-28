import React from 'react';
import { IVectorNFieldProps, VectorNField } from './VectorNField';

export type IVector2FieldProps = Omit<IVectorNFieldProps<{ x: number; y: number }>, 'scalarNames' | 'transformer'>;

export const Vector2Field = ({ ...props }: IVector2FieldProps) => (
  <VectorNField
    scalarNames={['X', 'Y']}
    transformer={{
      from: vec => [vec.x, vec.y],
      to: list => ({ x: list[0], y: list[1] }),
    }}
    {...props}
  />
);
