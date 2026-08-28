# Google Maps Platform — Maps JavaScript API 3D Maps Setup for VAYU Skyview

This document describes how to configure the Google Maps Platform JavaScript 3D Maps API for **VAYU Skyview (/skyview)**.

---

## 1. Google Cloud Project & API Activation

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new project named \ayu-cpi-production\.
3. Enable **Billing** for your Google Cloud Project (required for Maps JavaScript API and Photorealistic 3D Maps).
4. Navigate to **APIs & Services** > **Library**.
5. Search for and **Enable** the following APIs:
   - **Maps JavaScript API** (Includes Photorealistic 3D Maps and \maps3d\ library).

---

## 2. API Key Generation & Security Restrictions

Client-side Google Maps keys must always be restricted by HTTP referrer to prevent unauthorized usage and quota exhaustion.

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **API Key**.
3. Under **Application restrictions**:
   - Select **Websites (HTTP referrers)**.
   - Add Website restrictions:
     - \http://localhost:3000/*\ (Local Next.js development)
     - \http://localhost:*/*     - \https://*.vercel.app/*\ (Vercel Preview Deployments)
     - \https://your-production-domain.com/*\ (Custom Production Domain)
4. Under **API restrictions**:
   - Select **Restrict key**.
   - Check **Maps JavaScript API**.
5. Save the configuration.

---

## 3. Environment Variable Configuration

In your local \.env.local\ or Vercel Environment Variables:

\\env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_restricted_api_key_here
\
> **Note**: Never commit actual Google Maps API keys to Git. Keep keys in \.env.local\ or deployment platform secret managers.

---

## 4. API Usage & Attribution Compliance

- **Isolated Execution**: Google Maps JavaScript 3D API is loaded strictly on-demand when \/skyview\ is opened, avoiding unnecessary API consumption across the rest of the application.
- **Google Attribution**: Standard Google copyright notices and 3D data provider attributions are automatically preserved by the Google Maps Platform 3D Web Component (\<gmp-map-3d>\).
