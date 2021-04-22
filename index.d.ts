
interface parallelOpt {
    path: string,
    keyFn?: (...args: any[]) => string,
    minMs?: number,
    errorFn?: Function,
    needWaitMS?: number,
    neverReturn?: boolean,
}

type CreateParallel = (cnf: Conf, deps: Deps) => Paralleled

type Paralleled = (method: Function, opt: parallelOpt) => Function

interface Conf {
    parallel: {
        key: string
        defaultErrorFn: Function
    }
}

interface Utils {
    sleep: (ms: number) => Promise<void>
}

interface Deps {
    U: Utils
    async: any
    graceful: any
    redis: any
    logger: any
}

export default CreateParallel
