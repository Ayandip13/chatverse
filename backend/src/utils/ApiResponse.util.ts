export class ApiResponse<T> {
  public success: boolean;
  public data: T | null;
  public message: string;
  public meta?: any;

  constructor(data: T | null, message: string = 'Success', meta?: any) {
    this.success = true;
    this.data = data;
    this.message = message;
    if (meta) {
      this.meta = meta;
    }
  }
}
