import { Module } from '@nestjs/common';
import { SnippetsController } from './snippets.controller';
import { SnippetsService } from './snippets.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [SnippetsController],
    providers: [SnippetsService, PrismaService],
})
export class SnippetsModule { }
