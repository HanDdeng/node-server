import { CommonType, RouterType } from "@utils/types";
import url from "url";
import { getReqParams, getType } from "..";

export function createRouter(params: RouterType.CreateRouterParams) {
  const { prefixPath = "", pubSub, ...routerOptions } = params;
  const routes: CommonType.ApiListItem[] = [];

  const setOptions: RouterType.SetOptions = (k, value) => {
    routerOptions[k] = value;
  };

  // 注册GET请求处理函数
  const get: RouterType.Get = (path, handler, options) => {
    routes.push({
      method: "GET",
      path: `${prefixPath}${path}`,
      handler,
      options: {
        paramsList: [],
        ...options
      }
    });
  };

  // 注册POST请求处理函数
  const post: RouterType.Post = (path, handler, options) => {
    routes.push({
      method: "POST",
      path: `${prefixPath}${path}`,
      handler,
      options: {
        paramsList: [],
        ...options
      }
    });
  };

  // 匹配routes
  const matchRoutes = (
    req: CommonType.NodeRequest,
    res: CommonType.NodeResponseForExternal
  ) => {
    /* 获取请求方法 */
    const method = req.method?.toUpperCase();
    /* 解析请求URL路径 */
    const { pathname } = url.parse(req.url as string, true);

    const list = routes.filter(v => v.path === pathname);

    if (!list.length) {
      /* 资源不存在 */
      routerOptions.notFoundHandle(req, res);
      return;
    }

    const route = list.find(item => item.method === method);
    if (!route) {
      /* 方法不被允许 */
      if (routerOptions.methodNotAllowedHandle) {
        routerOptions.methodNotAllowedHandle(
          req,
          res,
          list.map(v => v.method)
        );
      } else {
        routerOptions.notFoundHandle(req, res);
      }
      return;
    }

    return route;
  };
  /* 校验参数 */
  const verifyParams: RouterType.VerifyParams = (req, res, route) => {
    if (!route.options.paramsList?.length) {
      return true;
    }
    const errorList: CommonType.ErrorListItem[] = [];
    const k = { GET: "query", POST: "body" }[route.method] as "query" | "body";
    route.options.paramsList?.forEach(item => {
      const itemType = getType(req.queryParams?.[k]?.[item.key]); // 获取参数类型
      if (item.required === false && itemType === "undefined") {
        return;
      }
      if (itemType !== item.type) {
        errorList.push({ ...item, wrongType: itemType });
      }
    });
    if (errorList.length) {
      req.errorList = errorList;
      routerOptions.paramsErrorHandler?.(req, res); // 处理参数错误
      return false;
    }
    return true;
  };

  /* 主函数 */
  const main = async (
    req: CommonType.NodeRequest,
    res: CommonType.NodeResponseForExternal
  ) => {
    pubSub.publish("request", req);

    /* 匹配路由 */
    const route = matchRoutes(req, res);
    if (!route) {
      return;
    }

    /* 权限校验 */
    if (
      route.options.openPermissionVerify ||
      (routerOptions.openPermissionVerify &&
        route.options.openPermissionVerify !== false)
    ) {
      const verifyRes =
        (await routerOptions.authenticationHandler?.(req, res)) ?? true;
      if (!verifyRes) {
        return;
      }
    }

    /* 获取请求参数 */
    req.queryParams = await getReqParams(req); // 获取请求参数

    if (!verifyParams(req, res, route)) {
      return;
    }

    /* 执行API处理函数 */
    await route.handler(req, res);
  };

  return {
    routes,
    setOptions,
    get,
    post,
    main
  };
}
