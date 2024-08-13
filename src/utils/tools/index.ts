import {
  ApiHandler,
  GetReqParams,
  NodeRequest,
  NodeResponse,
  StoreValue,
} from "@utils/types";
import url from "url";

const getPostParams = async (req: NodeRequest) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
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
  const reqMethods: { [key: string]: (req: NodeRequest) => any } = {
    GET: getGetParams,
    POST: getPostParams,
  };
  const queryParmas = reqMethods[method](req);
  return queryParmas;
};

export const notFount: ApiHandler = (req, res) => {
  res.writeHead(404, {
    "Content-Type": "text/plain;charset='utf-8'",
  });
  res.end("404 NOT FOUNT");
};

export const getType = (param: StoreValue) => {
  return Object.prototype.toString.call(param).slice(8, -1).toLowerCase();
};