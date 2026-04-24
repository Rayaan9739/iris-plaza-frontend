import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/')
  getStatus() {
    return { 
      status: "API running", 
      service: "Iris Plaza Backend",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  healthCheck() {
    return { 
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}
