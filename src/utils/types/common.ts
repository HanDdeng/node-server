import http from "http";

export type StoreValue = any;

export interface errorListItem {
  key: string;
  type: string;
  wrongType: string;
}

export type NodeRequest = http.IncomingMessage & {
  errorList?: errorListItem[];
  queryParmas?: { [key: string]: any };
  user?: string;
};

export type NodeRequestMethod = http.IncomingMessage["method"];

export type NodeResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export interface ErrorCatch {
  (req: NodeRequest, res: NodeResponse, error: Error): void;
}

export interface PermissionVerify {
  (req: NodeRequest, res: NodeResponse): Promise<boolean>;
}

export interface ApiHandler {
  (req: NodeRequest, res: NodeResponse): void;
}

export interface paramsItem {
  key: string;
  type: string;
  required: boolean;
}

export interface ApiOptions {
  openPermissionVerify?: boolean;
  openParamsVerify?: boolean;
  paramsList?: paramsItem[];
}

export interface ApiListItem {
  methods: "GET" | "POST";
  path: string;
  handler: ApiHandler;
  options: ApiOptions;
}

export interface GetReqParams {
  (req: NodeRequest): Promise<{ [key: string]: any }>;
}
