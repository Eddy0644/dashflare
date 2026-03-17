export const onRequest: PagesFunction = ({ request }) => {
  const targetUrl = new URL(request.url);

  return cors(
    request,
    (corsHeaders) => {
      targetUrl.protocol = 'https';
      targetUrl.hostname = 'api.cloudflare.com';
      targetUrl.port = '443';
      targetUrl.pathname = targetUrl.pathname.replace(/^\/_api/, '');
      const fetchRequest = new Request(targetUrl, request);

      return fetch(fetchRequest)
        .then((res) => {
          const newRes = new Response(res.body, {
            headers: res.headers,
            status: res.status,
            statusText: res.statusText
          });

          if (corsHeaders) {
            corsHeaders.forEach((value, key) => {
              if (key === 'vary') {
                newRes.headers.append(key, value);
              } else {
                newRes.headers.set(key, value);
              }
            });
          }

          newRes.headers.delete('set-cookie');

          return newRes;
        })
        .catch(e => Response.json({
          name: e.name,
          message: e.message,
          stack: e.stack
        }));
    }
  );
};

type StaticOrigin = string | RegExp | Array<string | RegExp>;

interface CorsOptions {
  origin?: StaticOrigin
}

const corsOptions: CorsOptions = {
  origin: '*'
};

async function cors(
  req: Request,
  createResponse: (corsHeaders?: Headers) => Promise<Response> | Response
) {
  const { origin } = corsOptions;
  if (!origin) return createResponse();

  const headers = new Headers();

  if (origin === '*') {
    headers.set('Access-Control-Allow-Origin', '*');
  } else {
    const reqOrigin = req.headers.get('Origin');

    if (typeof origin === 'string') {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (reqOrigin && isOriginAllowed(reqOrigin, origin)) {
      headers.set('Access-Control-Allow-Origin', reqOrigin);
    }
    headers.append('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');

    const requestAllowedHeader = req.headers.get('Access-Control-Request-Headers');
    if (requestAllowedHeader) {
      headers.append('Vary', 'Access-Control-Request-Headers');
      headers.set('Access-Control-Allow-Headers', requestAllowedHeader);
    }

    headers.set('Access-Control-Max-Age', '7200');
    headers.set('Content-Length', '0');
    return new Response(null, { status: 204, headers });
  }

  return createResponse(headers);
}

function isOriginAllowed(origin: string, allowed: StaticOrigin): boolean {
  if (typeof allowed === 'string') {
    return origin === allowed;
  }
  if (allowed instanceof RegExp) {
    return allowed.test(origin);
  }
  return allowed.some((o) => isOriginAllowed(origin, o));
}
