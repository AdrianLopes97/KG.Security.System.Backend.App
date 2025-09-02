interface ApiResultSuccess<T> {
  success: true;
  content?: T;
  message?: string | null;
}

interface ApiResultError {
  success: false;
  message: string;
  error?: string | null;
}

export type ApiResultResponse<T> = ApiResultSuccess<T> | ApiResultError;
