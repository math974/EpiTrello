# OAuth Authentication Testing with Postman

This guide explains how to test OAuth authentication using Postman.

## Prerequisites

1. **OAuth Applications Configured**:
   - Google OAuth app with redirect URI: `http://localhost:4000/auth/google/callback`
   - GitHub OAuth app with redirect URI: `http://localhost:4000/auth/github/callback`

2. **Environment Variables Set**:
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   OAUTH_REDIRECT_URI=http://localhost:4000/auth/{provider}/callback
   FRONTEND_URL=http://localhost:3000
   ```

## Testing OAuth Flow

### Important Note

OAuth authentication **cannot be fully tested in Postman** because it requires:
1. Browser redirects to OAuth provider (Google/GitHub)
2. User interaction to authorize the application
3. OAuth provider redirects back to the callback URL

However, you can test the endpoints and understand the flow.

### Option 1: Test via Browser (Recommended)

1. **Start the backend**:
   ```bash
   docker compose -f docker-compose.dev.yml --env-file .env.dev up backend
   ```

2. **Open in browser**:
   - Google: `http://localhost:4000/auth/google`
   - GitHub: `http://localhost:4000/auth/github`

3. **Complete OAuth flow**:
   - You'll be redirected to Google/GitHub login
   - After authentication, you'll be redirected back
   - The callback will redirect to: `http://localhost:3000/auth/callback?accessToken=...&refreshToken=...`

4. **Extract tokens**:
   - Copy the `accessToken` and `refreshToken` from the URL
   - Use them in Postman for subsequent GraphQL requests

### Option 2: Test Endpoints in Postman

#### 1. Test OAuth Initiation (Redirect)

**Request**: `GET /auth/google`
- **Method**: GET
- **URL**: `http://localhost:4000/auth/google`
- **Expected**: 302 Redirect to Google OAuth

**Request**: `GET /auth/github`
- **Method**: GET
- **URL**: `http://localhost:4000/auth/github`
- **Expected**: 302 Redirect to GitHub OAuth

**Note**: Postman will show the redirect URL. You can manually visit it in a browser.

#### 2. Test Callback (Manual)

The callback endpoint requires a valid OAuth code from the provider, which you can only get by completing the OAuth flow in a browser.

**Request**: `GET /auth/google/callback`
- **Method**: GET
- **URL**: `http://localhost:4000/auth/google/callback?code=...&state=...`
- **Expected**: 302 Redirect to frontend with tokens

**Request**: `GET /auth/github/callback`
- **Method**: GET
- **URL**: `http://localhost:4000/auth/github/callback?code=...&state=...`
- **Expected**: 302 Redirect to frontend with tokens

### Using OAuth Tokens in GraphQL

After completing the OAuth flow and obtaining tokens:

1. **Set Authorization Header**:
   - In Postman, go to the "Authorization" tab
   - Select "Bearer Token"
   - Paste the `accessToken` from the callback URL

2. **Test GraphQL Query**:
   ```graphql
   query {
     meStrict {
       id
       email
       username
       avatar
     }
   }
   ```

3. **Refresh Token** (when access token expires):
   ```graphql
   mutation {
     refreshToken(input: {
       refreshToken: "your_refresh_token_here"
     }) {
       accessToken
       refreshToken
       user {
         id
         email
         username
       }
     }
   }
   ```

## Complete OAuth Flow Example

### Step 1: Initiate OAuth (Browser)

Visit in browser:
```
http://localhost:4000/auth/google
```

### Step 2: Authorize (Browser)

- Google will show login/consent screen
- Click "Allow" or "Continue"
- You'll be redirected to: `http://localhost:4000/auth/google/callback?code=...&state=...`

### Step 3: Backend Processes Callback

The backend:
1. Exchanges the code for user info
2. Creates/finds user in database
3. Creates OAuthAccount record
4. Generates JWT tokens
5. Redirects to: `http://localhost:3000/auth/callback?accessToken=...&refreshToken=...`

### Step 4: Use Tokens in Postman

1. Copy `accessToken` from the redirect URL
2. In Postman, create a new request:
   - **Method**: POST
   - **URL**: `http://localhost:4000/graphql`
   - **Headers**:
     - `Content-Type: application/json`
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`
   - **Body** (GraphQL):
     ```json
     {
       "query": "query { meStrict { id email username } }"
     }
     ```

## Testing Different Scenarios

### Scenario 1: New User (First OAuth Login)

1. Use a Google/GitHub account that hasn't been used before
2. Complete OAuth flow
3. Check database: New `User` and `OAuthAccount` records should be created
4. User should have `passwordHash = null`

### Scenario 2: Existing OAuth User (Re-login)

1. Use a Google/GitHub account that was previously used
2. Complete OAuth flow
3. Check database: Existing `User` and `OAuthAccount` records should be found
4. New tokens should be generated

### Scenario 3: Link OAuth to Existing Email User

1. Create a user via GraphQL registration (with email/password)
2. Use the same email with OAuth (Google/GitHub)
3. Complete OAuth flow
4. Check database: `OAuthAccount` should be linked to existing `User`
5. User can now login with either password or OAuth

## Troubleshooting

### Error: "Email is required for OAuth authentication"

- The OAuth provider didn't return an email
- Check OAuth app scopes (should include `email` or `user:email`)

### Error: "Invalid credentials" when using password login

- OAuth users have `passwordHash = null`
- They can only login via OAuth, not with password

### Redirect URL Mismatch

- Ensure `OAUTH_REDIRECT_URI` matches exactly what's configured in OAuth app
- Google: Must match exactly (including http vs https, trailing slashes)
- GitHub: More flexible, but should match

### Tokens Not Working

- Access tokens expire after 15 minutes
- Use refresh token to get new access token
- Check token is in `Authorization: Bearer TOKEN` header format

## Environment Variables Summary

```bash
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Required for GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# OAuth callback URL (optional, has defaults)
OAUTH_REDIRECT_URI=http://localhost:4000/auth/{provider}/callback

# Frontend URL for redirect after OAuth (optional, has defaults)
FRONTEND_URL=http://localhost:3000
```

## Postman Collection Example

You can create a Postman collection with:

1. **OAuth Initiation**:
   - GET `http://localhost:4000/auth/google`
   - GET `http://localhost:4000/auth/github`

2. **GraphQL with OAuth Token**:
   - POST `http://localhost:4000/graphql`
   - Headers: `Authorization: Bearer {{accessToken}}`
   - Body: GraphQL queries/mutations

3. **Refresh Token**:
   - POST `http://localhost:4000/graphql`
   - Body: `refreshToken` mutation

Note: The actual OAuth callback must be done in a browser, then copy tokens to Postman.


