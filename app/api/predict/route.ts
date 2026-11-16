import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const conf = formData.get("conf")?.toString() || "0.25";
    const iou = formData.get("iou")?.toString() || "0.50";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided in request." },
        { status: 400 }
      );
    }

    const endpointUrl = process.env.ULTRALYTICS_ENDPOINT_URL;
    const apiKey = process.env.ULTRALYTICS_API_KEY;

    // Check if cloud credentials are provided
    if (!endpointUrl || !apiKey || endpointUrl.includes("your-deployment-url")) {
      return NextResponse.json({
        warning: "Ultralytics endpoint or API key not configured yet.",
        setupRequired: true,
        message:
          "To connect your live model: 1) Deploy your model on platform.ultralytics.com to get your Cloud Run endpoint URL. 2) Copy your API Key. 3) Add ULTRALYTICS_ENDPOINT_URL and ULTRALYTICS_API_KEY to your .env.local file or Vercel Environment Variables.",
        predictions: [
          {
            name: "Face (Demo)",
            class: 0,
            confidence: 0.942,
            box: { x1: 0.25, y1: 0.18, x2: 0.75, y2: 0.72 },
          },
        ],
      });
    }

    // Prepare multipart form data for the Ultralytics API
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    apiFormData.append("conf", conf);
    apiFormData.append("iou", iou);
    apiFormData.append("imgsz", "640");

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Ultralytics API returned error ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    // Standardize detection format
    let predictions: any[] = [];
    if (Array.isArray(rawData)) {
      predictions = rawData;
    } else if (rawData.predictions && Array.isArray(rawData.predictions)) {
      predictions = rawData.predictions;
    } else if (rawData.results && Array.isArray(rawData.results)) {
      predictions = rawData.results;
    } else if (rawData.images && rawData.images[0]?.results) {
      predictions = rawData.images[0].results;
    } else {
      predictions = [rawData];
    }

    return NextResponse.json({
      success: true,
      count: predictions.length,
      predictions,
      raw: rawData,
    });
  } catch (error: any) {
    console.error("Inference Error:", error);
    return NextResponse.json(
      { error: "Internal server error during inference", details: error.message },
      { status: 500 }
    );
  }
}
