
declare module "bluebird" {

  declare class Promise<R>  {
    constructor(callback: (resolve : (result: R) => void, reject: (error: any) => void) => void): void;
    then<U>(onFulfill?: (value: R) => Promise<U> | U, onReject?: (error: any) => Promise<U> | U): Promise<U>;
    catch<U>(onRejected?: (error: any) => Promise<U> | U ): Promise<U>;
    static resolve<T>(thenable?: Promise<T> | T): Promise<T>;
    static reject(error: any): Promise<any>;
    static all<T>(promises: Array<Promise<T>>): Promise<Array<T>>;
    static race<T>(promises: Array<Promise<T>>): Promise<T>;
  }
  
}

