# @domain.js/parallel

[![Build status](https://travis-ci.com/domain-js/parallel.svg?branch=master)](https://travis-ci.org/domain-js/parallel)
[![codecov](https://codecov.io/gh/domain-js/parallel/branch/master/graph/badge.svg)](https://codecov.io/gh/domain-js/parallel)

# Installation
<pre>npm i @domain.js/parallel --save</pre>

# cnf
专属配置名称 `parallel`
| 名称 | 类型 | 必填 | 默认值 | 描述 | 样例 |
| ---- | ---- | ---- | ------ | ---- | ---- |
| key  | string | `是` | `否` | 记录并发锁的 redis 记录key | parallels |
| defaultErrorFn | funtion | `是` | `否` | 处理并发锁申请错误函数 | Error |

# deps
| 模块名 | 别名 | 用到的方法 | 描述 |
| ------ | ---- | ---------- | ---- |
| logger | `无` | info | 输出观点时刻的信息，便于分析日志 |
| graceful | `无` | exit | 注册进程退出的执行函数，便于在退出时清理残留锁 |
| redis | `无` | hsetnx, hdel, hexists | 并发锁利用 redis hash 类型数据实现 |
| utils | `U` | sleep | 实现在申请锁的等待功能 |
| async | `无` | whilst | 实现在申请锁，需要等待的时候循环等待 |

# Usage
| 功能 | 描述 | 样例 |
| ---- | ---- | ---- |
| parallel | 封装一个函数，使其拥有并发控制的能力，不改变其原有行为 | parallel(fn, { path: 'test' }) |


## parallel 函数参数
| 顺序 | 参数名 | 类型 | 必填 | 默认值 | 描述 | 样例 |
| ---- | ------ | ---- | ---- | ------ | ---- | ---- |
| 1 | fn | function | `是` | `无` | 要加工处理的函数 | const test = () => { } |
| 2 | opt | object  | `是` | `无` | 加工函数的参数控制 | { path: 'test' } |
| 2 | opt.path | string | `是` | `无` | 并发控制锁名称 | test |
| 2 | opt.keyFn | function | `否` | `无` | 计算并发锁名称的函数，第一个参数为 path, 之后为原函数的调用参数 | (path, name) => `${path}:${name}` |
| 2 | opt.minMS | integer | `否` | 0 | 函数执行最小占用毫秒数，并发锁至少为保持这么长时间，单位毫秒 | 1000 |
| 2 | opt.errorFn | function | `否` | defaultErrorFn | 函数请求并发锁错误时调用的错误处理函数，不设置则会调用 defaultErrorFn | Error |
| 2 | opt.needWaitMS | integer | `否` | 0 | 函数是否对应需要执行，没有申请到就等待，needWaitMS 是循环判断的时间间隔，单位毫秒 | Error |
| 2 | opt.neverReturn | Boolean | `否` | false | 函数是否永不返回，相当于进程启动，只需要执行一次，后续一直不删除并发锁 | Error |
