import type { ApiResponse } from '~/types/response';

export const useApi = (domain: string = '') => {
  const config = useRuntimeConfig();
  const headers = useRequestHeaders(['cookie']);
  const HMAC_SECRET = config.public.hmacSecret || 'DefaultHmacSecret';

  const api = $fetch.create({
    baseURL: (`${config.public.apiBase}${domain}`),
    credentials: 'include',

    onRequest({ options }) {
      const hmacHeaders = generateHmacHeaders(options.body, HMAC_SECRET);
      const newHeaders = new Headers(options.headers);

      newHeaders.set('x-hmac-signature', hmacHeaders['x-hmac-signature']);
      newHeaders.set('x-hmac-timestamp', hmacHeaders['x-hmac-timestamp']);

      if (import.meta.server && headers.cookie) {
        newHeaders.set('cookie', headers.cookie);
      }

      options.headers = newHeaders;
      options.credentials = 'include';
    }
  });

  return {
    get: <T>(url: string, opts?: any) => 
      api<ApiResponse<T>>(url, { ...opts, method: 'GET' })
        .catch(err => err.data as ApiResponse<T>),

    post: <T>(url: string, body?: any, opts?: any) => 
      api<ApiResponse<T>>(url, { ...opts, method: 'POST', body })
        .catch(err => err.data as ApiResponse<T>),

    put: <T>(url: string, body?: any, opts?: any) => 
      api<ApiResponse<T>>(url, { ...opts, method: 'PUT', body })
        .catch(err => err.data as ApiResponse<T>),

    patch: <T>(url: string, body?: any, opts?: any) => 
      api<ApiResponse<T>>(url, { ...opts, method: 'PATCH', body })
        .catch(err => err.data as ApiResponse<T>),

    delete: <T>(url: string, opts?: any) => 
      api<ApiResponse<T>>(url, { ...opts, method: 'DELETE' })
        .catch(err => err.data as ApiResponse<T>),
        
    raw: api 
  };
};