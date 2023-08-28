import React from 'react';
import { IVectorNFieldProps, VectorNField } from './VectorNField';

export type IVector3FieldProps = Omit<
  IVectorNFieldProps<{ x: number; y: number; z: number }>,
  'scalarNames' | 'transformer'
>;

export const Vector3Field = ({ ...props }: IVector3FieldProps) => (
  <VectorNField
    scalarNames={['X', 'Y', 'Z']}
    transformer={{
      from: vec => [vec.x, vec.y, vec.z],
      to: list => ({ x: list[0], y: list[1], z: list[2] }),
    }}
    {...props}
  />
);
