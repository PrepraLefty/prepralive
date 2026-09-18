import { NextResponse } from "next/server";
import { buildTaxPacket } from "@/lib/tax/buildTaxPacket";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userId, startDate, endDate } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const packet = await buildTaxPacket(userId, startDate, endDate);

    return NextResponse.json(packet);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to generate tax packet" },
      { status: 500 }
    );
  }
}