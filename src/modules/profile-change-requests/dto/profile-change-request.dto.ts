import { ProfileChangeRequest, User } from '@prisma/client';

export class ProfileChangeRequestDto implements ProfileChangeRequest {
  id: string;
  userId: string;
  requestedData: any;
  status: any;
  reviewedById: string;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}
