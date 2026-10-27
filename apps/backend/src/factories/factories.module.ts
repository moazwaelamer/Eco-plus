import { Module } from '@nestjs/common';
import { FactoriesController } from './factories.controller.js';
import { FactoriesService } from './factories.service.js';

@Module({ controllers: [FactoriesController], providers: [FactoriesService] })
export class FactoriesModule {}
