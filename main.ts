interface Conf {
    parallel: {
        key: string
        defaultErrorFn: Function
    }
}

interface Logger {
    info: (...args: any) => void
    error: (...args: any) => void
}

interface Utils {
    sleep: (ms: number) => Promise<void>
}

interface RedisClient {
    hdel: (k: string, sk: string) => Promise<void>
    hsetnx: (k: string, sk: string, val: number | string) => Promise<number>
    hexists: (k: string, sk: string) => Promise<number>
}

interface Deps {
    U: Utils
    logger: Logger
    graceful: {
        exit: (fn: Function) => void
    }
    redis: RedisClient
    async: {
        eachLimit: (...args: any) => Promise<void>
        whilst: (...args: any) => Promise<void>
    }
}

interface parallelOpt {
    path: string,
    keyFn?: (...args: any[]) => string,
    minMS?: number,
    errorFn?: Function,
    needWaitMS?: number,
    neverReturn?: boolean,
}

function Parallel(cnf: Conf, deps: Deps) {
    const {
        parallel: { key: KEY, defaultErrorFn }
    } = cnf;

    const {
        async,
        logger,
        graceful,
        U: { sleep },
        redis
    } = deps;
    // 存放当前处于执行中的 key
    const doings = new Set<string>();

    let exiting = false;
    // 退出时候做的处理
    const onExit = async () => {
        exiting = true;
        logger.info("graceful.onExit parallel start", [...doings]);
        await async.eachLimit(doings, 10, async key => {
            doings.delete(key);
            await redis.hdel(KEY, key);
            logger.info(`graceful.onExit parallel hdel: ${key}`);
        });
        logger.info("graceful.onExit parallel end");
    };

    /* 将 method 函数处理为有并发控制功能的函数 */
    const control = (method: Function, opt: parallelOpt) => {
        let {
            path, // 必选 并发控制key的主路径
            keyFn, // 可选 并发控制计算key的函数
            minMS, // 可选 最小执行锁定时间 单位毫秒
            errorFn, // 可选 错误处理函数
            needWaitMS, // 可选 是否需要定时去验证获取执行权限
            neverReturn // 可选 是否需要永久锁定，不返回退出
        } = opt
        const error = (errorFn || defaultErrorFn)(path, minMS);
        // key 默认等于 path
        if (!keyFn) keyFn = () => path;

        const end = async (key: string, startAt: number) => {
            const timing = Date.now() - startAt; // 执行总用时毫秒数
            const remainMS = minMS - timing; // 计算和最小耗时的差值毫秒数
            if (0 < remainMS) {
                setTimeout(async () => {
                    doings.delete(key);
                    await redis.hdel(KEY, key);
                }, remainMS);
            } else {
                doings.delete(key);
                await redis.hdel(KEY, key);
            }
        };

        const paralleled = async (...args: any[]) => {
            if (exiting) throw Error("process exiting");
            const key = keyFn(path, ...args);
            const size = await redis.hsetnx(KEY, key, Date.now());
            if (!size) {
                // 不需要等待，则直接抛出异常
                if (!needWaitMS) {
                    throw error;
                }
                // 需要等待
                await async.whilst(
                    async () => Boolean(await redis.hexists(KEY, key)),
                    async () => sleep(needWaitMS)
                );
                return paralleled(...args);
            }
            const startAt = Date.now(); // 执行开始毫秒数
            doings.add(key);
            try {
                const res = await method(...args);
                if (!neverReturn) await end(key, startAt);
                return res;
            } catch (e) {
                await end(key, startAt);
                throw e;
            }
        };

        return paralleled;
    };

    // 进程退出时候的处理
    graceful.exit(onExit);

    return control;
}

Parallel.Deps = ["logger", "graceful", "redis", "utils", "async"];

export = Parallel
