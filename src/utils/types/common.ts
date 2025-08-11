import http, { OutgoingHttpHeader, OutgoingHttpHeaders } from "http";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoreValue = any;

export interface NodeServerOptions {
  port: number;
  host?: string;
  defaultVerify?: boolean;
  prefixPath?: string;
  /**
   * 预留http或https
   */
  mode?: "http";
}

export interface ErrorListItem {
  key: string;
  type: string;
  wrongType: string;
}

export interface QueryParams {
  query?: { [key: string]: StoreValue };
  body?: { [key: string]: StoreValue };
}

export type NodeRequest = http.IncomingMessage & {
  errorList?: ErrorListItem[];
  queryParams?: QueryParams;
  user?: StoreValue;
};

export type NodeResponseForInternal =
  http.ServerResponse<http.IncomingMessage> & {
    req: NodeRequest;
  };

export interface SendOptions {
  isSerialization?: boolean;
  code?: number;
  headers?: OutgoingHttpHeaders | OutgoingHttpHeader[];
}

export type Send = (data: StoreValue, options?: SendOptions) => void;

export type NodeResponseForExternal = NodeResponseForInternal & {
  send: Send;
};

export interface ErrorCatch {
  (req: NodeRequest, res: NodeResponseForExternal, error: Error): void;
}

export interface Authentication {
  (req: NodeRequest, res: NodeResponseForExternal): Promise<boolean>;
}

export interface ApiHandler {
  (req: NodeRequest, res: NodeResponseForExternal): void;
}

export interface paramsItem {
  key: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
}

export interface ApiOptions {
  openPermissionVerify?: boolean;
  paramsList?: paramsItem[];
}

export interface ApiListItem {
  methods: "GET" | "POST";
  path: string;
  handler: ApiHandler;
  options: ApiOptions;
}

export interface GetReqParams {
  (req: NodeRequest): Promise<{
    query: { [key: string]: StoreValue };
    body: StoreValue;
  }>;
}

export type On = {
  // 接收到新请求后触发
  request: (req: NodeRequest) => void;
  // 调用sent函数后后触发
  response: (
    data: StoreValue,
    res: NodeResponseForInternal,
    req: NodeRequest
  ) => void;
  // 服务报错后触发
  catch: (error: Error, req: NodeRequest, res: NodeResponseForInternal) => void;
};
