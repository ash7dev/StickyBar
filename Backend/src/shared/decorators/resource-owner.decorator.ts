import { SetMetadata } from '@nestjs/common';

export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const ResourceOwner = () => SetMetadata(RESOURCE_OWNER_KEY, true);
