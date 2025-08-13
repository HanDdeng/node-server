import {
  ApiHandler,
  ApiListItem,
  ApiOptions,
  CreateRouterParams
} from "@utils/types";

export const createRouter = (params?: CreateRouterParams) => {
  const { prefixPath = "", openPermissionVerify = false } = params ?? {};
  let routes: ApiListItem[] = [];
  // 注册GET请求处理函数
  const get = (path: string, handler: ApiHandler, options?: ApiOptions) => {
    routes = [
      ...routes,
      {
        methods: "GET",
        path: `${prefixPath}${path}`,
        handler,
        options: {
          openPermissionVerify,
          paramsList: [],
          ...options
        }
      }
    ];
  };

  // 注册POST请求处理函数
  const post = (path: string, handler: ApiHandler, options?: ApiOptions) => {
    routes = [
      ...routes,
      {
        methods: "POST",
        path: `${prefixPath}${path}`,
        handler,
        options: {
          openPermissionVerify,
          paramsList: [],
          ...options
        }
      }
    ];
  };

  return {
    routes,
    get,
    post
  };
};
