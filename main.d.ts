interface Conf {
    parallel: {
        key: string;
        defaultErrorFn: Function;
    };
}
interface Logger {
    info: (...args: any) => void;
    error: (...args: any) => void;
}
interface Utils {
    sleep: (ms: number) => Promise<void>;
}
interface RedisClient {
    hdel: (k: string, sk: string) => Promise<void>;
    hsetnx: (k: string, sk: string, val: number | string) => Promise<number>;
    hexists: (k: string, sk: string) => Promise<number>;
}
interface Deps {
    U: Utils;
    logger: Logger;
    graceful: {
        exit: (fn: Function) => void;
    };
    redis: RedisClient;
    async: {
        eachLimit: (...args: any) => Promise<void>;
        whilst: (...args: any) => Promise<void>;
    };
}
interface parallelOpt {
    path: string;
    keyFn?: (...args: any[]) => string;
    minMS?: number;
    errorFn?: Function;
    needWaitMS?: number;
    neverReturn?: boolean;
}
declare function Parallel(cnf: Conf, deps: Deps): (method: Function, opt: parallelOpt) => (...args: any[]) => any;
declare namespace Parallel {
    var Deps: string[];
}
export = Parallel;
