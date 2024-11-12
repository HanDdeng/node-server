import createpubSub from "hd-pub-sub";
import {
  ApiHandler,
  ErrorCatch,
  GetReqParams,
  NodeRequest,
  NodeResponseForInternal,
  On,
  Send,
  SendOptions,
  StoreValue
} from "@utils/types";
import url from "url";

const getPostParams = async (req: NodeRequest) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk?.toString() ?? "";
    });
    req.on("end", () => {
      try {
        if (!body) {
          resolve({});
          return;
        }
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
};

const getGetParams = (req: NodeRequest) => {
  const { query } = url.parse(req.url as string, true);
  return query;
};

export const getReqParams: GetReqParams = async req => {
  const method = req.method?.toUpperCase() as string;
  const reqMethods: { [key: string]: (req: NodeRequest) => StoreValue } = {
    GET: getGetParams,
    POST: getPostParams
  };
  const queryParmas = reqMethods[method](req);
  return queryParmas;
};

export const defaultNotFountHandler: ApiHandler = (req, res) => {
  res.send("404 NOT FOUNT", {
    code: 404
  });
};

export const defaultErrorCatchHandler: ErrorCatch = (req, res) => {
  res.send("Internal Server Error", {
    code: 500
  });
};

export const getType = (param: StoreValue) => {
  return Object.prototype.toString.call(param).slice(8, -1).toLowerCase();
};

export const createSend =
  (
    req: NodeRequest,
    res: NodeResponseForInternal,
    pubSub: ReturnType<typeof createpubSub<On>>
  ): Send =>
  (data: StoreValue, options?: SendOptions) => {
    if (!res.headersSent) {
      res.writeHead(options?.code ?? 200, {
        "Content-Type": "application/json",
        ...options?.headers
      });
    }
    pubSub.publish("response", data, res, req);
    // 发送数据并结束响应
    if (typeof data === "object") {
      res.end(JSON.stringify(data)); // 将对象转换为 JSON 字符串
    } else {
      res.end(data); // 发送原始数据
    }
  };
