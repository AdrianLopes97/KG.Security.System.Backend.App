import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { formatBytes } from "~/utils/format-bytes";

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, path } = request;
    const userAgent = request.get("user-agent") || "";
    const requestTime = performance.now();

    response.on("close", () => {
      const { statusCode } = response;
      const contentLength = response.get("content-length");
      let contentLengthFormatted = contentLength;
      const responseTime = (performance.now() - requestTime).toLocaleString(
        "en-US",
        { maximumFractionDigits: 2 },
      );

      if (contentLength) {
        contentLengthFormatted = formatBytes(Number(contentLength));
      }

      if (!userAgent.includes("github.com/go-loco/restful")) {
        this.logger.log(
          `${method} ${path} ${statusCode} ${responseTime}ms - ${contentLengthFormatted} - ${userAgent} ${ip}`,
        );
      }
    });

    next();
  }
}
