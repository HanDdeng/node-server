import http from "http";
import {
  ApiHandler,
  ErrorCatch,
  NodeRequest,
  NodeResponseForInternal,
  Authentication,
  ErrorListItem,
  NodeServerOptions,
  On,
  NodeResponseForExternal
} from "./utils/types";
import {
  getReqParams,
  getType,
  defaultNotFountHandler,
  defaultErrorCatchHandler,
  createSend,
  createRouter
} from "@utils/tools";
import url from "url";
export { getType } from "@utils/tools";
import createpubSub from "hd-pub-sub";

// 定义一个NodeServer类，用于创建和管理HTTP服务器
export class NodeServer {
  port: number; // 服务器端口号
  host: string; // 服务器主机名
  get: typeof this.router.get;
  post: typeof this.router.post;
  #pubSub = createpubSub<On>(); // 发布订阅
  #errorCatchHandler: ErrorCatch = defaultErrorCatchHandler; // 错误捕获处理函数
  #notFountHandler: ApiHandler = defaultNotFountHandler; // 找不到API路径时的处理函数
  #paramsErrorHandler?: ApiHandler; // 请求参数错误时的处理函数
  #methodsErrorHandler?: ApiHandler; // 请求方法错误时的处理函数
  #authenticationHandler?: Authentication; // 权限校验处理函数
  private router: ReturnType<typeof createRouter>; // 路由

  /**
   * 构造函数
   * @param options - 是否默认开启权限校验，默认为true
   */
  constructor(options: NodeServerOptions) {
    const {
      port,
      host = "127.0.0.1",
      defaultVerify = true,
      prefixPath = ""
    } = options;
    this.port = port;
    this.host = host;
    this.router = createRouter({
      openPermissionVerify: defaultVerify,
      prefixPath
    });
    this.get = this.router.get;
    this.post = this.router.post;

    // 创建HTTP服务器，并监听指定的端口和主机
    http
      .createServer((req, res) => this._routes.call(this, req, res))
      .listen(port, host);
    console.log(`Server running at http://${host}:${port}/`);
  }

  /**
   * 处理路由请求
   * @param req - HTTP请求对象
   * @param res - HTTP响应对象
   */
  async _routes(req: NodeRequest, originalRes: NodeResponseForInternal) {
    const res = {
      ...originalRes,
      send: createSend(req, originalRes, this.#pubSub)
    } as NodeResponseForExternal;
    try {
      this.#pubSub.publish("request", req);
      const method = req.method?.toUpperCase(); // 获取请求方法
      const { pathname } = url.parse(req.url as string, true); // 解析请求URL路径

      // 如果请求路径不存在，执行notFount传入的方法
      if (!this.router.routes.find(item => item.path === pathname)) {
        this.#notFountHandler(req, res);
        return;
      }
      const currentApi = this.router.routes.find(
        item => item.path === pathname && item.methods === method
      );
      // 请求路径存在但请求方法不正确，如果自定义了methodsError即执行，否则执行notFount方法
      if (!currentApi) {
        if (this.#methodsErrorHandler) {
          this.#methodsErrorHandler?.(req, res);
        } else {
          this.#notFountHandler(req, res);
        }
        return;
      }

      // 判断当前api是否开启权限校验，开启即进行鉴权
      if (currentApi.options.openPermissionVerify) {
        const verifyRes =
          (await this.#authenticationHandler?.(req, res)) ?? true;
        if (!verifyRes) {
          return;
        }
      }
      const queryParams = await getReqParams(req); // 获取请求参数

      // 判断当前API是否开启参数校验，开启即校验
      if (currentApi.options.paramsList?.length) {
        const errorList: ErrorListItem[] = [];
        const method = { GET: "query", POST: "body" }[
          req.method?.toUpperCase() ?? "GET"
        ] as "query" | "body";
        currentApi.options.paramsList?.forEach(item => {
          const itemType = getType(queryParams[method][item.key]); // 获取参数类型
          if (item.required === false && itemType === "undefined") {
            return;
          }
          if (itemType !== item.type) {
            errorList.push({ ...item, wrongType: itemType });
          }
        });
        if (errorList.length) {
          req.errorList = errorList;
          this.#paramsErrorHandler?.(req, res); // 处理参数错误
          return;
        } else {
          req.queryParams = queryParams; // 参数校验通过，保存参数
        }
      } else {
        req.queryParams = queryParams;
      }
      await currentApi.handler(req, res); // 执行API处理函数
    } catch (error) {
      this.#pubSub.publish("catch", error as Error, req, res);
      this.#errorCatchHandler(req, res, error as Error); // 错误处理
    }
  }

  // 注册全局错误处理函数
  catch(handler: ErrorCatch) {
    this.#errorCatchHandler = handler;
  }

  // 注册全局权限校验处理函数
  permissionVerify(handler: Authentication) {
    this.#authenticationHandler = handler;
  }

  /* // 注册GET请求处理函数
  get(
    path: Parameters<typeof this.router.get>[0],
    handler: Parameters<typeof this.router.get>[1],
    options?: Parameters<typeof this.router.get>[2]
  ) {
    this.router.get(path, handler, options);
  }

  // 注册POST请求处理函数
  post(
    path: Parameters<typeof this.router.get>[0],
    handler: Parameters<typeof this.router.get>[1],
    options?: Parameters<typeof this.router.get>[2]
  ) {
    this.router.post(path, handler, options);
  } */

  // 注册全局参数错误处理函数
  paramsError(handler: ApiHandler) {
    this.#paramsErrorHandler = handler;
  }

  // 注册全局找不到路径处理函数
  notFount(handler: ApiHandler) {
    this.#notFountHandler = handler;
  }

  // 注册全局请求方法错误处理函数
  methodsError(handler: ApiHandler) {
    this.#methodsErrorHandler = handler;
  }

  // 监听器
  /**
   * @param eventName -request: 接收到新请求后触发; response: 调用sent函数后后触发; catch: 服务报错后触发;
   */
  on<T extends keyof On>(eventName: T, handler: On[T]) {
    this.#pubSub.subscribe(eventName, handler);
  }
}
