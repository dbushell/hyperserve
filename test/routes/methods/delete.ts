import type {Handle} from '../../../mod.ts';

export const DELETE: Handle = ({request}) => {
  return Response.json({
    method: request.method.toUpperCase()
  });
};
