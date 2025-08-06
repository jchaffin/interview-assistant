import { NextRequest, NextResponse } from "next/server";

interface ResponseData {
  text: string;
  audio?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResponseData | ErrorResponse>> {
  try {
    const body: Record<string, unknown> = await request.json();
    
    // Validate required fields
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    const responseData: ResponseData = {
      text: body.text,
      audio: body.audio as string | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error processing response request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
  