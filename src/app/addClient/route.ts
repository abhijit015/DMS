import { NextRequest, NextResponse } from "next/server";
import { addClient } from "../../services/client";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await addClient(data);

    if (result.status) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    const response = {
      status: false,
      message: String(error),
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
