import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import { version } from "../package.json";
import { AppModule } from "./app.module";
import "./dayjs";
import { env } from "./env";
import { applyAppMiddlewares } from "./utils/apply-app-middlewares";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const payloadLimit: string | number | undefined = "50mb";
  app.use(json({ limit: payloadLimit }));
  app.use(urlencoded({ limit: payloadLimit, extended: true }));

  applyAppMiddlewares(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("K.G. Security System API")
    .setDescription("API pública da plataforma do K.G. Security System")
    .setVersion(version)
    .addBearerAuth()
    .addServer(env.SERVER_URL)
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPathname = "api";

  SwaggerModule.setup(swaggerPathname, app, swaggerDocument, {
    jsonDocumentUrl: "docs/swagger/json",
  });

  await app.listen(env.PORT);
  console.log(`Server running at http://localhost:${env.PORT}`);
  console.log(`Swagger at http://localhost:${env.PORT}/${swaggerPathname}`);
}

bootstrap();
