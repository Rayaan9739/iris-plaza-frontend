import { AuthService } from "./auth.service";
import { SignUpDto, SignInDto, RefreshTokenDto, SetDobDto } from "./dto/auth.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    signIn(signInDto: SignInDto): Promise<{
        message: string;
        code: string;
    } | {
        accessToken: string;
        refreshToken: string;
        user: any;
        message?: undefined;
        code?: undefined;
    }>;
    setDob(setDobDto: SetDobDto): Promise<{
        message: string;
        code: string;
    }>;
    refresh(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
