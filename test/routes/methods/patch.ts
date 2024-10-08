import type {Handle} from '../../../mod.ts';

export const PATCH: Handle = ({request}) => {
  return Response.json({
    method: request.method.toUpperCase()
  });
};
