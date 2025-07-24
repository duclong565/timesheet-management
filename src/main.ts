import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ResponseTransformInterceptor } from './common/interceptor/response-transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with explicit configuration
  app.enableCors({
    origin: [
      'http://localhost:3001', // Frontend development server
      'http://localhost:3000', // Alternative frontend port
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Bearer',
    ],
    credentials: true,
  });
  
  app.setGlobalPrefix('time-management');

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Timesheet Management API')
    .setDescription(
      `
      Comprehensive Timesheet Management System API providing endpoints for:
      - User authentication and authorization (JWT + Google OAuth)
      - Employee management with role-based access control
      - Timesheet tracking and approval workflows
      - Project and task management
      - Working time management
      - Request management (leave, overtime, etc.)
      - Dashboard analytics and reporting
      - Audit logging and compliance tracking
      
      This API follows RESTful principles and includes comprehensive error handling,
      pagination, filtering, and search capabilities across all resources.
    `,
    )
    .setVersion('1.0.0')
    .setContact(
      'Development Team',
      'https://github.com/your-org/timesheet-management',
      'dev@company.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000/time-management', 'Development Server')
    .addServer('https://api.company.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addOAuth2(
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: {
              profile: 'Access your basic profile information',
              email: 'Access your email address',
            },
          },
        },
      },
      'Google-OAuth2',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Roles', 'Role and permission management')
    .addTag('Projects', 'Project management and assignment')
    .addTag('Tasks', 'Task management within projects')
    .addTag('Timesheets', 'Timesheet creation, tracking, and approval')
    .addTag('Working Times', 'Working schedule and time management')
    .addTag('Requests', 'Leave requests, overtime, and other employee requests')
    .addTag('Dashboard', 'Analytics, metrics, and dashboard data')
    .addTag('Branches', 'Company branch management')
    .addTag('Clients', 'Client management and project assignments')
    .addTag('Positions', 'Employee position and hierarchy management')
    .addTag('Capabilities', 'Skill and capability tracking')
    .addTag('Audit Logs', 'System audit trails and compliance logging')
    .addTag('Health', 'API health checks and system status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8f9fa; border-radius: 4px; padding: 10px; }
    `,
    customSiteTitle: 'Timesheet Management API Documentation',
    customfavIcon: '/favicon.ico',
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(
    `📚 API Documentation available at: ${await app.getUrl()}/api/docs`,
  );
}
bootstrap();
