export interface CommonResponseInterface<T> {
    data: T,
    message: string,
    status: number,
    timeStamp: Date,
}
