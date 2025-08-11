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
import formidable from "formidable";
import path from "path";
import { createDir } from "fs-manage";

/* const getPostParams = async (req: NodeRequest) => {
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
}; */

// 通用流数据收集
function collectStream(req: NodeRequest): Promise<string> {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

// 解析 URL Encoded 数据
async function parseUrlEncodedBody(req: NodeRequest) {
  const data = await collectStream(req);
  return Object.fromEntries(new URLSearchParams(data).entries());
}

// 解析 FormData（文件上传）
async function parseFormData(req: NodeRequest) {
  let uploadDir = "";
  if (process.env.UPLOAD_PATH && process.env.UPLOAD_PATH.slice(0, 1) === "/") {
    uploadDir = process.env.UPLOAD_PATH;
  } else {
    uploadDir = path.resolve(
      process.cwd(),
      process.env.UPLOAD_PATH || "uploads"
    );
  }
  await createDir(uploadDir);
  const form = formidable({ multiples: true, uploadDir, keepExtensions: true });
  const [fields, files] = await form.parse(req);
  return { ...fields, files };
}

// 解析 JSON 请求体
async function parseJsonBody(req: NodeRequest) {
  const data = await collectStream(req);
  return JSON.parse(data);
}

export const getReqParams: GetReqParams = async req => {
  /* const method = req.method?.toUpperCase() as string;
  const reqMethods: { [key: string]: (req: NodeRequest) => StoreValue } = {
    GET: getGetParams,
    POST: getPostParams
  };
  const queryParams = reqMethods[method](req);
  return queryParams; */

  const query = Object.fromEntries(
    new URLSearchParams(req.url?.split("?")[1] || "").entries()
  );

  let body: StoreValue = {};
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    body = await parseJsonBody(req);
  } else if (contentType.includes("multipart/form-data")) {
    body = await parseFormData(req);
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    body = await parseUrlEncodedBody(req);
  }

  return { query, body };
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
    const { isSerialization = true } = options ?? {};
    if (typeof data === "object" && isSerialization) {
      res.end(JSON.stringify(data)); // 将对象转换为 JSON 字符串
    } else {
      res.end(data); // 发送原始数据
    }
  };
