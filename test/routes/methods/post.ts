import type {Handle} from '../../../mod.ts';

export const POST: Handle = async ({request}) => {
  return Response.json(await request.json());
};
