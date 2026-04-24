export declare class HealthController {
    getStatus(): {
        status: string;
        service: string;
        version: string;
        timestamp: string;
    };
    healthCheck(): {
        status: string;
        timestamp: string;
    };
}
