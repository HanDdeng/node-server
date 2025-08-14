import { CommonType } from "..";
import type createpubSub from "hd-pub-sub";

export interface CreateRouterParams {
  prefixPath?: string;
  openPermissionVerify?: boolean;
  pubSub: ReturnType<typeof createpubSub<CommonType.On>>;
  notFoundHandle: CommonType.ApiHandler;
  methodNotAllowedHandle?: CommonType.MethodNotAllowed;
  authenticationHandler?: CommonType.Authentication;
  paramsErrorHandler?: CommonType.ApiHandler;
}

export interface SetOptions {
  <
    T extends keyof Omit<
      CreateRouterParams,
      "prefixPath" | "openPermissionVerify" | "pubSub"
    >
  >(
    k: T,
    value: CreateRouterParams[T]
  ): void;
}

export interface Get {
  (
    path: string,
    handler: CommonType.ApiHandler,
    options?: CommonType.ApiOptions
  ): void;
}

export interface Post {
  (
    path: string,
    handler: CommonType.ApiHandler,
    options?: CommonType.ApiOptions
  ): void;
}

export interface VerifyParams {
  (
    req: CommonType.NodeRequest,
    res: CommonType.NodeResponseForExternal,
    route: CommonType.ApiListItem
  ): boolean;
}
