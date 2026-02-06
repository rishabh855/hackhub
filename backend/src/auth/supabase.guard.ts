import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private supabase: SupabaseClient;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.supabase = createClient(
            this.configService.get<string>('SUPABASE_URL') || '',
            this.configService.get<string>('SUPABASE_KEY') || ''
        );
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('No authorization header found');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                console.error('Supabase Auth Error:', error);
                throw new UnauthorizedException('Invalid token');
            }

            // Sync User to Prisma
            // We upsert to ensure existence
            // user.id is UUID
            // Prisma user.id is String @default(cuid()).
            // We will force use UUID.

            console.log(`Syncing user ${user.id} to Prisma...`);

            // Strategy:
            // 1. Try to find user by Supabase ID (UUID).
            // 2. If valid, update and return.
            // 3. If not found, try to find by Email (Legacy CUID user).
            // 4. If found, update metadata and return (keeps CUID).
            // 5. If not found, create new user with Supabase ID (UUID).

            console.log(`Checking user sync for ${user.email} (${user.id})...`);

            let dbUser = await this.prisma.user.findUnique({
                where: { id: user.id }
            });

            if (dbUser) {
                // User exists with matching UUID - just update
                console.log(`User found by ID ${dbUser.id}, updating...`);
                dbUser = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email: user.email,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name,
                        image: user.user_metadata?.avatar_url || user.user_metadata?.picture
                    }
                });
            } else {
                // Not found by UUID, check email
                const legacyUser = await this.prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (legacyUser) {
                    // Legacy CUID user found.
                    // We keep using their CUID as the app's internal ID.
                    // We just update their details.
                    console.log(`Legacy user found by email ${legacyUser.id}, updating...`);
                    dbUser = await this.prisma.user.update({
                        where: { id: legacyUser.id }, // Update by CUID
                        data: {
                            // Don't update ID.
                            name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name,
                            image: user.user_metadata?.avatar_url || user.user_metadata?.picture
                        }
                    });
                } else {
                    // New user - create with Supabase UUID
                    console.log(`Creating new user ${user.id}...`);
                    dbUser = await this.prisma.user.create({
                        data: {
                            id: user.id, // Explicitly set UUID
                            email: user.email,
                            name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name,
                            image: user.user_metadata?.avatar_url || user.user_metadata?.picture
                        }
                    });
                }
            }
            console.log(`User synced: ${dbUser.id}`);

            request.user = dbUser;
            return true;
        } catch (err) {
            console.error('Auth Guard Error:', err);
            // @ts-ignore
            throw new UnauthorizedException(`Authentication failed: ${err.message || err}`);
        }
    }
}
