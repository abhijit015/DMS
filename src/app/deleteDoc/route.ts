import { NextRequest, NextResponse } from "next/server";
import { validateReqAuth } from "@/services/authorise";
import { deleteDoc } from "@/services/document";

export async function DELETE(req: NextRequest) {
  let result;
  let proceed: boolean = true;

  try {
    const clientId = req.headers.get("client_id");
    const accessKey = req.headers.get("access_key");

    if (proceed) {
      result = await validateReqAuth(clientId, accessKey);

      if (!result.status) {
        proceed = false;
      }
    }

    if (proceed) {
      const data = await req.json();
      data.client_id = clientId;
      result = await deleteDoc(data);
      if (!result.status) {
        proceed = false;
      }
    }

    if (proceed) {
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
