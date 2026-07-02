# One-time demo deployment

## 1. Deploy the backend on Render

Create a **Web Service** from this repository and use:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/`

Add the values from your local `server/.env` to Render's Environment page. At
minimum the server requires:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=use_a_random_secret_at_least_32_characters_long
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

Also add the Cloudinary, payment, SMS/WhatsApp, Shiprocket, email, and metal-rate
variables used by the demo features you want to show. Do not commit `server/.env`.

After deployment, copy the Render URL, for example:

```text
https://your-service.onrender.com
```

## 2. Deploy the frontend on Vercel

Create a Vercel project from the same repository and use:

- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Vercel environment variable for Production, Preview, and Development:

```env
VITE_API_BASE_URL=https://your-service.onrender.com
```

Deploy again after adding or changing a `VITE_` variable because Vite embeds it
at build time.

## 3. Connect CORS

Copy the final Vercel URL into Render:

```env
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

If more than one frontend domain is needed, use comma-separated values:

```env
CLIENT_ORIGIN=https://your-frontend.vercel.app,https://www.example.com
```

Restart/redeploy the Render service after changing it.
