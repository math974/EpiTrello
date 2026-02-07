import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID') || 'dummy';
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET') || 'dummy';
    const callbackURL = config.get<string>('OAUTH_REDIRECT_URI') || 'http://localhost:4000/auth/github/callback';
    
    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL.replace('{provider}', 'github'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ): Promise<any> {
    const { id, emails, displayName, photos, username } = profile;
    const user = {
      provider: 'github',
      providerUserId: id.toString(),
      email: emails?.[0]?.value,
      name: displayName || username,
      avatar: photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}

