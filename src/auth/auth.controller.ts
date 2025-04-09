import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.auth.dto';
import { Public } from './decorators/public-route.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginAuthDto: LoginDto) {
    return this.authService.login(loginAuthDto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  //Google OAuth
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    //Redirects to Google for authentication
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req, @Res() res) {
    // This is the callback after Google has authenticated the user
    return this.authService.googleLogin(req).then((result) => {
      // Return data directly
      return res.status(200).json({
        message: 'Google authentication successful',
        user: result.user,
        token: result.token,
      })

      // return res.redirect for FE
    });
  }
}
