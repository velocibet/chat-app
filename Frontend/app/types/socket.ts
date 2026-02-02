export interface socketResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}