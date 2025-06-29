import { Controller, Post, Body, Get, Param, UseGuards, Req, Res, Query, Put, Delete, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCandidatProfileDto, UpdateCoordinateurProfileDto } from './dto/update-profile.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    
    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });

    return {
      user,
      accessToken,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    
    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1* 24 * 60 * 60 * 1000, // 1 day
    });

    return {
      user,
      accessToken,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
    
    // Set new tokens as HTTP-only cookies
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    return {
      user,
      accessToken,
    };
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({ status: 400, description: 'User not found or email already verified' })
  resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Get('test-email-config')
  @ApiOperation({ summary: 'Test email configuration' })
  @ApiResponse({ status: 200, description: 'Email configuration test result' })
  async testEmailConfig() {
    return this.authService.testEmailConfiguration();
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return {
      succes: true,
      donnees: req.user
    };
  }

  // @Get('users')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Get all users (Admin only)' })
  // @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  // @ApiResponse({ status: 403, description: 'Forbidden' })
  // getUsers(@Query() query: GetUsersDto, @Req() req) {
  //   return this.authService.getUsers(query, req.user);
  // }

  // @Get('users/:id')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Get user by ID' })
  // @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // getUserById(@Param('id') id: string, @Req() req) {
  //   return this.authService.getUserById(id, req.user);
  // }

  // @Put('users/:id')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Update user' })
  // @ApiResponse({ status: 200, description: 'User updated successfully' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // updateUser(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateUserDto,
  //   @Req() req,
  // ) {
  //   return this.authService.updateUser(id, dto, req.user);
  // }

  // @Delete('users/:id')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Delete user' })
  // @ApiResponse({ status: 200, description: 'User deleted successfully' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // deleteUser(@Param('id') id: string, @Req() req) {
  //   return this.authService.deleteUser(id, req.user);
  }

//   @Put('users/:id/profile')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Update user profile' })
//   @ApiResponse({ status: 200, description: 'Profile updated successfully' })
//   @ApiResponse({ status: 404, description: 'User not found' })
//   updateProfile(
//     @Param('id') id: string,
//     @Body() dto: UpdateCandidatProfileDto | UpdateCoordinateurProfileDto,
//     @Req() req,
//   ) {
//     return this.authService.updateProfile(id, dto, req.user);
//   }
// }
