import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUsername = await this.userService.findByUsername(
      createUserDto.username,
    );
    const existingEmail = await this.userService.findByEmail(
      createUserDto.email,
    );

    if (existingEmail || existingUsername) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.userService.createUser({
      username: createUserDto.username,
      password: hashedPassword,
      email: createUserDto.email,
      name: createUserDto.name,
      surname: createUserDto.surname,
			allowedLeavedays: createUserDto.allowedLeavedays,
			is_active: createUserDto.is_active,
    });

    const payload = { username: newUser.username, sub: newUser.id };

    const token = await this.jwtService.sign(payload);

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      token,
    };
  }

  async login(loginAuthDto: LoginDto) {
    const user = await this.userService.findByUsername(loginAuthDto.username);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const verifyPassword = await bcrypt.compare(
      loginAuthDto.password,
      user.password,
    );
    if (!verifyPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { username: user.username, sub: user.id };
    const token = await this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }
}
