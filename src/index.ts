import http from "http";
import {
  ApiHandler,
  ApiOptions,
  ApiListItem,
  ErrorCatch,
  NodeRequest,
  NodeResponse,
  PermissionVerify,
  StoreValue,
  errorListItem,
} from "./utils/types";
import { getReqParams, getType, notFount } from "@utils/tools";
import url from "url";

export class NodeServer {
  port: number;
  host: string;
  #errorCatch?: ErrorCatch;
  #openVerify: boolean;
  #apiList?: ApiListItem[];
  #permissionVerifyHanlder?: PermissionVerify;
  #notFountHandler: ApiHandler = notFount;
  #methodsErrorHandler?: ApiHandler;
  #paramsErrorHanlder?: ApiHandler;

  /**
   *
   * @param port
   * @param host
   * @param defaultVerify 默认开启权限校验，后续可单独设置api是否需要权限校验
   */
  constructor(port: number, host: string, defaultVerify = true) {
    this.port = port;
    this.host = host;
    this.#openVerify = defaultVerify;

    http
      .createServer((req, res) => this._routes.call(this, req, res))
      .listen(port, host);
    console.log(`Server running at http://${host}:${port}/`);
  }

  async _routes(req: NodeRequest, res: NodeResponse) {
    try {
      const method = req.method?.toUpperCase();
      const { pathname } = url.parse(req.url as string, true);

      // 请求路径不存在，执行notFount传入方法
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

      // 判断当前api是否开启权限校验，开始即鉴权
      if (currentApi.options.openPermissionVerify) {
        const verifyRes = await this.#permissionVerifyHanlder?.(req, res);
        if (!verifyRes) {
          throw "权限校验错误";
        }
      }
      const queryParmas = await getReqParams(req);

      // 判断当前api是否开启参数校验，开始即鉴权
      if (currentApi.options.openParamsVerify) {
        const errorList: errorListItem[] = [];
        currentApi.options.paramsList?.forEach(item => {
          const itemType = getType(item.key);
          if (itemType !== item.type) {
            errorList.push({ ...item, wrongType: itemType });
          }
        });
        if (errorList.length) {
          req.errorList = errorList;
          this.#paramsErrorHanlder?.(req, res);
          return;
        } else {
          req.queryParmas = queryParmas;
        }
      } else {
        req.queryParmas = queryParmas;
      }
      await currentApi.handler(req, res);
    } catch (error: StoreValue) {
      if (this.#errorCatch) {
        this.#errorCatch(error);
      } else {
        throw error;
      }
    }
  }

  catch(handler?: ErrorCatch) {
    this.#errorCatch = handler;
  }

  permissionVerify(handler: PermissionVerify) {
    this.#permissionVerifyHanlder = handler;
  }

  get(path: string, handler: ApiHandler, options?: ApiOptions) {
    this.#apiList = [
      ...(this.#apiList ?? []),
      {
        methods: "GET",
        path,
        handler,
        options: {
          openPermissionVerify: this.#openVerify,
          openParamsVerify: false,
          paramsList: [],
          ...options,
        },
      },
    ];
  }

  post(path: string, handler: ApiHandler, options?: ApiOptions) {
    this.#apiList = [
      ...(this.#apiList ?? []),
      {
        methods: "GET",
        path,
        handler,
        options: {
          openPermissionVerify: this.#openVerify,
          openParamsVerify: false,
          paramsList: [],
          ...options,
        },
      },
    ];
  }

  paramsError(handler: ApiHandler) {
    this.#paramsErrorHanlder = handler;
  }

  notFount(handler: ApiHandler) {
    this.#notFountHandler = handler;
  }

  methodsErrorHandler(handler: ApiHandler) {
    this.#methodsErrorHandler = handler;
  }
}
