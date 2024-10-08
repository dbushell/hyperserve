import type {Handle} from '../../../mod.ts';

export const PUT: Handle = ({request}) => {
  return Response.json({
    method: request.method.toUpperCase()
  });
};
