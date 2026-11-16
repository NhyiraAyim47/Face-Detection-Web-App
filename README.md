# AI Face Detection Web App (YOLO26 Nano + Vercel)

A modern, production-grade Next.js web application for real-time face detection, powered by your custom-trained YOLO model from [Ultralytics HUB](https://platform.ultralytics.com/nhyirah/ai-face-detection-model/exp-2) and designed for zero-hassle deployment on **Vercel**.

---

## Features
- **Drag & Drop Upload & Webcam Mode**: Easily test with uploaded photos or real-time webcam captures.
- **Dynamic Bounding Box Visualization**: Renders accurate detection boxes, confidence percentage badges, and target labels over detected faces.
- **Customizable Inference Thresholds**: Interactive sliders for Confidence threshold and IoU NMS threshold.
- **Vercel Serverless Architecture**: Keeps your Ultralytics API key completely hidden on the server side via Next.js Route Handlers (`/api/predict`).

---

## 1. Get Your Ultralytics Cloud Credentials
To connect the live model to this web app:

1. Open your model page on [Ultralytics Hub (exp-2)](https://platform.ultralytics.com/nhyirah/ai-face-detection-model/exp-2).
2. Click the **Deploy** tab / button:
   - Select your preferred cloud region and deploy.
   - Ultralytics will generate your dedicated endpoint URL, e.g.:
     `https://your-deployment-url.run.app/predict`
3. In your Ultralytics account settings, navigate to **API Keys** and generate an API key.

---

## 2. Local Setup & Testing

1. Install dependencies:
   ```bash
   cd face-detection-app
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   ULTRALYTICS_ENDPOINT_URL=https://your-deployment-url.run.app/predict
   ULTRALYTICS_API_KEY=your_ultralytics_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Deploying to Vercel (1-Click)

### Option A: Using the Vercel Dashboard (Easiest)
1. Push this project folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Face Detection App"
   git branch -M main
   git remote add origin https://github.com/your-username/face-detection-app.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your `face-detection-app` repository.
4. Under **Environment Variables**, add:
   - `ULTRALYTICS_ENDPOINT_URL`: Your Cloud Run endpoint URL.
   - `ULTRALYTICS_API_KEY`: Your Ultralytics API key.
5. Click **Deploy**. Vercel will build and deploy your app in under 1 minute!

### Option B: Using the Vercel CLI
```bash
npm i -g vercel
vercel
```
Follow the interactive prompts and add your environment variables when asked.
