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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiOAuth2,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiExcludeEndpoint,
  ApiParam,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.auth.dto';
import { Public } from './decorators/public-route.decorator';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiResponse as ApiResponseClass,
  ErrorResponse,
  ValidationErrorResponse,
} from '../common/dto/api-response.dto';

// Response DTOs for documentation
class UserProfileResponse {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class LoginResponse {
  user: UserProfileResponse;
  token: string;
}

class GoogleCallbackResponse {
  message: string;
  user: UserProfileResponse;
  token: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description: `
      Creates a new user account in the system. The user will be assigned a default 'USER' role.
      Password will be automatically hashed before storage. Email must be unique.
      
      **Business Rules:**
      - Email must be unique across all users
      - Password must meet minimum security requirements
      - User is created with 'USER' role by default
      - Account is activated immediately
    `,
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration details',
    examples: {
      example1: {
        summary: 'Standard employee registration',
        value: {
          email: 'john.doe@company.com',
          password: 'SecurePass123!',
          name: 'John',
          surname: 'Doe',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: ApiResponseClass<UserProfileResponse>,
    example: {
      success: true,
      message: 'User registered successfully',
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@company.com',
        name: 'John',
        surname: 'Doe',
        role: 'USER',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Email already exists',
    type: ErrorResponse,
    example: {
      success: false,
      message: 'User with this email already exists',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/auth/register',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during registration',
    type: ErrorResponse,
  })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user and get access token',
    description: `
      Authenticates a user with email and password, returning a JWT access token.
      The token should be included in the Authorization header for protected endpoints.
      
      **Authentication Flow:**
      1. Validate email and password
      2. Check if user account is active
      3. Generate JWT access token
      4. Return user profile and token
      
      **Token Usage:**
      Include the token in requests as: Authorization: Bearer <token>
    `,
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      example1: {
        summary: 'Employee login',
        value: {
          email: 'john.doe@company.com',
          password: 'SecurePass123!',
        },
      },
      example2: {
        summary: 'Admin login',
        value: {
          email: 'admin@company.com',
          password: 'AdminPass123!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful, returns user profile and JWT token',
    type: ApiResponseClass<LoginResponse>,
    example: {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@company.com',
          name: 'John',
          surname: 'Doe',
          role: 'USER',
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email or password format',
    type: ValidationErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
    type: ErrorResponse,
    example: {
      success: false,
      message: 'Invalid email or password',
      statusCode: 401,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/auth/login',
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during authentication',
    type: ErrorResponse,
  })
  login(@Body() loginAuthDto: LoginDto) {
    return this.authService.login(loginAuthDto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: `
      Retrieves the complete profile information for the currently authenticated user.
      Requires a valid JWT token in the Authorization header.
      
      **Returns:**
      - Complete user profile data
      - Role and permissions information
      - Account status and timestamps
    `,
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserProfileResponse,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'john.doe@company.com',
      name: 'John',
      surname: 'Doe',
      role: 'USER',
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    type: ErrorResponse,
    example: {
      success: false,
      message: 'Unauthorized access - Invalid token',
      statusCode: 401,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/auth/profile',
    },
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOAuth2(['Google-OAuth2'])
  @ApiOperation({
    summary: 'Initiate Google OAuth authentication',
    description: `
      Redirects to Google's OAuth 2.0 authorization server to begin the authentication process.
      This endpoint should be accessed directly by the browser, not via API calls.
      
      **OAuth Flow:**
      1. User clicks login with Google
      2. Redirected to this endpoint
      3. Automatically redirected to Google OAuth
      4. User grants permissions
      5. Google redirects to callback endpoint
      
      **Note:** This endpoint returns a redirect, not JSON data.
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth authorization URL',
    headers: {
      Location: {
        description: 'Google OAuth authorization URL',
        schema: {
          type: 'string',
          example: 'https://accounts.google.com/o/oauth2/auth?client_id=...',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'OAuth configuration error',
    type: ErrorResponse,
  })
  googleAuth() {
    //Redirects to Google for authentication
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOAuth2(['Google-OAuth2'])
  @ApiOperation({
    summary: 'Google OAuth callback endpoint',
    description: `
      Handles the callback from Google OAuth after user authentication.
      Processes the authorization code and creates or authenticates the user.
      
      **Callback Flow:**
      1. Google redirects here with authorization code
      2. Exchange code for user profile information
      3. Create user account if doesn't exist
      4. Generate JWT token for the user
      5. Return authentication result
      
      **Note:** This endpoint is called by Google, not directly by clients.
    `,
  })
  @ApiOkResponse({
    description: 'Google authentication successful',
    type: GoogleCallbackResponse,
    example: {
      message: 'Google authentication successful',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@gmail.com',
        name: 'John',
        surname: 'Doe',
        role: 'USER',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Google OAuth authentication failed',
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid OAuth callback parameters',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Error processing Google OAuth callback',
    type: ErrorResponse,
  })
  googleAuthCallback(@Req() req, @Res() res) {
    // This is the callback after Google has authenticated the user
    return this.authService.googleLogin(req).then((result) => {
      // Return data directly
      return res.status(200).json({
        message: 'Google authentication successful',
        user: result.user,
        token: result.token,
      });

      // return res.redirect for FE
    });
  }
}
