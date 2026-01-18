import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';

import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { ChatModule } from './chat/chat.module';
import { SnippetsModule } from './snippets/snippets.module';
import { AiModule } from './ai/ai.module';
import { DecisionsModule } from './decisions/decisions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TeamsModule,
    ProjectsModule,
    TasksModule,
    ChatModule,
    SnippetsModule,
    AiModule,
    DecisionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
