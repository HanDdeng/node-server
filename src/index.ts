import http from "http";
import {
  ApiHandler,
  ApiOptions,
  ApiListItem,
  ErrorCatch,
  NodeRequest,
  NodeResponse,
  PermissionVerify,
  errorListItem,
  NodeServerOptions
} from "./utils/types";
import { getReqParams, getType, notFount, serverError } from "@utils/tools";
import url from "url";
export { getType } from "@utils/tools";

// 定义一个NodeServer类，用于创建和管理HTTP服务器
export class NodeServer {
  port: number; // 服务器端口号
  host: string; // 服务器主机名
  #apiList?: ApiListItem[]; // 注册的API列表
  #prefixPath: string; // API默认前缀
  #openVerify: boolean; // 是否默认开启权限校验
  #errorCatch?: ErrorCatch; // 错误捕获处理函数
  #notFountHandler: ApiHandler = notFount; // 找不到API路径时的处理函数
  #paramsErrorHanlder?: ApiHandler; // 请求参数错误时的处理函数
  #methodsErrorHandler?: ApiHandler; // 请求方法错误时的处理函数
  #permissionVerifyHanlder?: PermissionVerify; // 权限校验处理函数

  /**
   * 构造函数
   * @param options - 是否默认开启权限校验，默认为true
   */
  constructor(options: NodeServerOptions) {
    const { port, host, defaultVerify = true, prefixPath = "" } = options;
    this.port = port;
    this.host = host;
    this.#openVerify = defaultVerify;
    this.#prefixPath = prefixPath;

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
  async _routes(req: NodeRequest, res: NodeResponse) {
    try {
      const method = req.method?.toUpperCase(); // 获取请求方法
      const { pathname } = url.parse(req.url as string, true); // 解析请求URL路径

      // 如果请求路径不存在，执行notFount传入的方法
      if (!this.#apiList?.find(item => item.path === pathname)) {
        this.#notFountHandler(req, res);
        return;
      }
      const currentApi = this.#apiList?.find(
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
        const verifyRes = await this.#permissionVerifyHanlder?.(req, res);
        if (!verifyRes) {
          return;
        }
      }
      const queryParmas = await getReqParams(req); // 获取请求参数

      // 判断当前API是否开启参数校验，开启即校验
      if (currentApi.options.paramsList?.length) {
        const errorList: errorListItem[] = [];
        currentApi.options.paramsList?.forEach(item => {
          const itemType = getType(queryParmas[item.key]); // 获取参数类型
          if (item.required === false && itemType === "undefined") {
            return;
          }
          if (itemType !== item.type) {
            errorList.push({ ...item, wrongType: itemType });
          }
        });
        if (errorList.length) {
          req.errorList = errorList;
          this.#paramsErrorHanlder?.(req, res); // 处理参数错误
          return;
        } else {
          req.queryParmas = queryParmas; // 参数校验通过，保存参数
        }
      } else {
        req.queryParmas = queryParmas;
      }
      await currentApi.handler(req, res); // 执行API处理函数
    } catch (error) {
      if (this.#errorCatch) {
        this.#errorCatch(req, res, error as Error); // 自定义错误处理
      } else {
        serverError(res); // 默认服务器错误处理
        throw error;
      }
    }
  }

  // 注册全局错误处理函数
  catch(handler?: ErrorCatch) {
    this.#errorCatch = handler;
  }

  // 注册全局权限校验处理函数
  permissionVerify(handler: PermissionVerify) {
    this.#permissionVerifyHanlder = handler;
  }

  // 注册GET请求处理函数
  get(path: string, handler: ApiHandler, options?: ApiOptions) {
    this.#apiList = [
      ...(this.#apiList ?? []),
      {
        methods: "GET",
        path: `${this.#prefixPath}${path}`,
        handler,
        options: {
          openPermissionVerify: this.#openVerify,
          paramsList: [],
          ...options
        }
      }
    ];
  }

  // 注册POST请求处理函数
  post(path: string, handler: ApiHandler, options?: ApiOptions) {
    this.#apiList = [
      ...(this.#apiList ?? []),
      {
        methods: "POST",
        path: `${this.#prefixPath}${path}`,
        handler,
        options: {
          openPermissionVerify: this.#openVerify,
          paramsList: [],
          ...options
        }
      }
    ];
  }

  // 注册全局参数错误处理函数
  paramsError(handler: ApiHandler) {
    this.#paramsErrorHanlder = handler;
  }

  // 注册全局找不到路径处理函数
  notFount(handler: ApiHandler) {
    this.#notFountHandler = handler;
  }

  // 注册全局请求方法错误处理函数
  methodsErrorHandler(handler: ApiHandler) {
    this.#methodsErrorHandler = handler;
  }
}
