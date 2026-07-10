import { PartialType } from '@nestjs/mapped-types';
import { CreateLogementDto } from './create-logement.dto';

export class UpdateLogementDto extends PartialType(CreateLogementDto) {}
