import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Main purpose is to extract userID
// This decorator is used to extract the user object from the request
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
