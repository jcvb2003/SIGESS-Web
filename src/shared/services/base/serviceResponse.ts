export interface ServiceResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}
