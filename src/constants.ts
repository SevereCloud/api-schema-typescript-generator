import { EOL } from 'os';
import { Dictionary } from './types';

export const scalarTypes: Dictionary<string> = {
  integer: 'number',
  boolean: 'boolean',
  number: 'number',
  string: 'string',
};

export const primitiveTypes: Dictionary<string> = {
  ...scalarTypes,
  array: 'any[]',
  object: '{}',
  mixed: 'any /* mixed primitive */',
};

export const spaceChar = ' ';
export const tabChar = spaceChar.repeat(2);
export const newLineChar = EOL;

export const baseBoolIntRef = 'base_bool_int';
export const baseOkResponseRef = 'base_ok_response';
export const basePropertyExistsRef = 'base_property_exists';

export const baseAPIParamsInterfaceName = 'BaseAPIParams';