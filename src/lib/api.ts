import axios, { type AxiosInstance, isAxiosError } from 'axios';

export type CreateAuthedApiOptions = {
  /** Called when the API rejects the session (401/403). Typically sign-out + redirect to sign-in. */
  onSessionInvalid?: () => void;
};

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
    'http://localhost:3333'
  );
}

export function createAuthedApi(
  getToken: () => Promise<string | null>,
  options?: CreateAuthedApiOptions,
): AxiosInstance {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          options?.onSessionInvalid?.();
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
