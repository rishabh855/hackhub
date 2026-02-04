
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
        });
    }

    async validate(payload: any) {
        // NextAuth uses 'sub' for user ID usually, or custom fields if we set them.
        // In auth.ts: token.id = user.id
        // So payload should have 'id' or 'sub'.
        // Let's support both or check what NextAuth typically sends.
        // Standard NextAuth JWT contains keys like: name, email, picture, sub, iat, exp, jti.
        // We added token.id in the callback.
        return { userId: payload.id || payload.sub, email: payload.email };
    }
}
