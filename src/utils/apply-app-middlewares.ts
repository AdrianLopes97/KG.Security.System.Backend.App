import {
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  type INestApplication,
} from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AllExceptionsFilter } from "~/commons/all-exceptions.filter";
import { formatValidationErrors } from "./format-validation-errors";

export function applyAppMiddlewares(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new UnprocessableEntityException(
          formatValidationErrors(validationErrors),
        );
      },
    }),
  );

  app.useGlobalInterceptors();
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
}
