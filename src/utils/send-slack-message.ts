import http from "node:http";
import https from "node:https";
import { HttpPostJsonResult } from "~/types/monitoring.types";

export async function sendSlackMessage(
  url: string,
  body: unknown,
): Promise<HttpPostJsonResult> {
  return new Promise(resolve => {
    try {
      const payload = JSON.stringify(body);
      const isHttps = url.startsWith("https:");
      const client = isHttps ? https : http;
      const req = client.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload).toString(),
          },
        },
        res => {
          let data = "";
          res.on("data", chunk => (data += chunk));
          res.on("end", () => {
            const code = res.statusCode ?? 0;
            const ok = code >= 200 && code < 300;
            resolve({ delivered: ok, statusCode: code, responseBody: data });
          });
        },
      );
      req.on("error", err => {
        resolve({
          delivered: false,
          statusCode: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      });
      req.write(payload);
      req.end();
    } catch (e) {
      resolve({ delivered: false, statusCode: 0, error: String(e) });
    }
  });
}
