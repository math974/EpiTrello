import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') || 'dummy';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || 'dummy';
    const callbackURL = config.get<string>('OAUTH_REDIRECT_URI') || 'http://localhost:4000/auth/google/callback';
    
    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL.replace('{provider}', 'google'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const user = {
      provider: 'google',
      providerUserId: id,
      email: emails?.[0]?.value,
      name: displayName,
      avatar: photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}

