import type {Handle} from '../../mod.ts';

// Purposefully throw an "Internal Server Error"
export const GET: Handle = () => {
  throw new Error('Throw 500');
};
