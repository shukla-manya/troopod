import { NextResponse } from "next/server";
import { PersonalizeRequestSchema } from "../../../lib/validators";
import { runPersonalization, ScrapingError, AIValidationError } from "../../../services/personalization-service";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PersonalizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (
    parsed.data.adInput.type === "file" &&
    parsed.data.adInput.value.length > 6_000_000
  ) {
    return NextResponse.json(
      { error: "Image file is too large. Please use an image under 4MB." },
      { status: 400 }
    );
  }

  try {
    const result = await runPersonalization(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScrapingError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof AIValidationError) {
      return NextResponse.json(
        { error: "AI output failed validation. Please try again." },
        { status: 422 }
      );
    }
    console.error("[personalize]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Personalization failed" },
      { status: 500 }
    );
  }
}
