import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';

@Controller('auth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
    // Will fail gracefully if credentials not configured
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.oauthService.handleOAuthCallback(req.user as any);
    // Set refresh token in httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    // Redirect to frontend callback with access token in URL
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?accessToken=${result.accessToken}`
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
    // Will fail gracefully if credentials not configured
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.oauthService.handleOAuthCallback(req.user as any);
    // Set refresh token in httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    // Redirect to frontend callback with access token in URL
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?accessToken=${result.accessToken}`
    );
  }
}

