import http from "http";
import { CommonType, RouterType } from "./utils/types";
import {
  defaultNotFountHandler,
  defaultErrorCatchHandler,
  createSend,
  createRouter,
  defaultParamsErrorHandler,
  timeoutHandler
} from "@utils/tools";
import createpubSub from "hd-pub-sub";
export { getType } from "@utils/tools";
export { CommonType, RouterType };

// 定义一个NodeServer类，用于创建和管理HTTP服务器
export class NodeServer {
  port: number; // 服务器端口号
  host: string; // 服务器主机名
  timeout: number; // 服务器超时时间
  get: RouterType.Get;
  post: RouterType.Post;
  #pubSub = createpubSub<CommonType.On>(); // 发布订阅
  #errorCatchHandler: CommonType.ErrorCatch = defaultErrorCatchHandler; // 错误捕获处理函数
  #notFountHandler: CommonType.ApiHandler = defaultNotFountHandler; // 找不到API路径时的处理函数
  #paramsErrorHandler?: CommonType.ApiHandler = defaultParamsErrorHandler; // 请求参数错误时的处理函数
  #methodNotAllowedHandle?: CommonType.MethodNotAllowed; // 请求方法错误时的处理函数
  #authenticationHandler?: CommonType.Authentication; // 权限校验处理函数
  #router: ReturnType<typeof createRouter>; // 路由

  /**
   * 构造函数
   * @param options - 是否默认开启权限校验，默认为true
   */
  constructor(options: CommonType.NodeServerOptions) {
    const {
      port,
      host = "127.0.0.1",
      defaultVerify = true,
      prefixPath = "",
      timeout = 10 * 1000
    } = options;
    this.port = port;
    this.host = host;
    this.timeout = timeout;
    this.#router = createRouter({
      openPermissionVerify: defaultVerify,
      prefixPath,
      pubSub: this.#pubSub,
      notFoundHandle: this.#notFountHandler,
      methodNotAllowedHandle: this.#methodNotAllowedHandle,
      authenticationHandler: this.#authenticationHandler,
      paramsErrorHandler: this.#paramsErrorHandler
    });
    this.get = this.#router.get;
    this.post = this.#router.post;

    // 创建HTTP服务器，并监听指定的端口和主机
    http
      .createServer((req, res) => this._main.call(this, req, res))
      .listen(port, host);
    console.log(`Server running at http://${host}:${port}/`);
  }

  /**
   * 处理路由请求
   * @param req - HTTP请求对象
   * @param res - HTTP响应对象
   */
  async _main(
    req: http.IncomingMessage,
    originalRes: http.ServerResponse<http.IncomingMessage> & {
      req: http.IncomingMessage;
    }
  ) {
    timeoutHandler(originalRes, this.timeout);
    /* 给res添加响应方法 */
    const send = createSend(req, originalRes, this.#pubSub);
    const res = new Proxy(originalRes, {
      get(target, prop, receiver) {
        if (prop === "send") {
          return send;
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as CommonType.NodeResponseForExternal;
    try {
      await this.#router.main.call(this, req, res);
    } catch (error) {
      this.#pubSub.publish("catch", error as Error, req, res);
      this.#errorCatchHandler(req, res, error as Error); // 错误处理
    }
  }

  // 注册全局错误处理函数
  catch(handler: CommonType.ErrorCatch) {
    this.#errorCatchHandler = handler;
  }

  // 注册全局权限校验处理函数
  authentication(handler: CommonType.Authentication) {
    this.#router.setOptions("authenticationHandler", handler);
  }

  // 注册全局参数错误处理函数
  paramsError(handler: CommonType.ApiHandler) {
    this.#router.setOptions("paramsErrorHandler", handler);
  }

  // 注册全局找不到路径处理函数
  notFount(handler: CommonType.ApiHandler) {
    this.#router.setOptions("notFoundHandle", handler);
  }

  // 注册全局请求方法错误处理函数
  methodNotAllowed(handler: CommonType.MethodNotAllowed) {
    this.#router.setOptions("methodNotAllowedHandle", handler);
  }

  // 监听器
  /**
   * @param eventName -request: 接收到新请求后触发; response: 调用sent函数后后触发; catch: 服务报错后触发;
   */
  on<T extends keyof CommonType.On>(eventName: T, handler: CommonType.On[T]) {
    this.#pubSub.subscribe(eventName, handler);
  }
}
