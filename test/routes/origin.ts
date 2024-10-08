import type {Handle} from '../../mod.ts';

export const GET: Handle = ({request}) => {
  return Response.json({
    url: request.url,
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto')
  });
};
