# Google Authentication Setup Guide

To enable Google Sign-In in your application, you need to configure both Google Cloud Platform and Supabase.

## Step 1: Google Cloud Platform (GCP)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (or select an existing one).
3.  **OAuth Consent Screen**:
    *   Navigate to **APIs & Services > OAuth consent screen**.
    *   Select **External** and click **Create**.
    *   Fill in the required fields (App name, User support email, Developer contact information).
    *   Click **Save and Continue**.
4.  **Credentials**:
    *   Navigate to **APIs & Services > Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   **Application type**: Select **Web application**. (Note: Even for mobile apps, we use "Web application" when using Supabase as the intermediary).
    *   **Name**: Enter a name (e.g., "Supabase Auth").
    *   **Authorized redirect URIs**: Add your Supabase Callback URL.
        *   Format: `https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback`
        *   You can find this URL in your Supabase Dashboard under **Authentication > Providers > Google**.
    *   Click **Create**.
    *   **Copy the Client ID and Client Secret**.

## Step 2: Supabase Configuration

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication > Providers**.
3.  Select **Google**.
4.  **Enable** Google provider.
5.  Paste the **Client ID** and **Client Secret** you copied from Google Cloud.
6.  Click **Save**.

## Step 3: Redirect URL Configuration

1.  In Supabase Dashboard, navigate to **Authentication > URL Configuration**.
2.  Under **Redirect URLs**, add the following URL for your Expo app:
    *   `taquanto://auth/callback`
3.  Click **Save**.

## Step 4: Testing

1.  Restart your Expo app (`npx expo start --clear`).
2.  Navigate to the Login screen.
3.  Click "Continue with Google".
4.  A browser window should open for you to sign in with your Google account.
5.  After signing in, you should be redirected back to the app and logged in.
