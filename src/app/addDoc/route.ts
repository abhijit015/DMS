import { NextRequest, NextResponse } from "next/server";
import { validateReqAuth } from "@/services/authorise";
import { addDoc } from "@/services/document";
import { DocSchemaT } from "@/utils/types";

export async function POST(req: NextRequest) {
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
      const data = await req.formData();
      let docData: DocSchemaT = {
        client_id: clientId as string,
        app_id: data.get("app_id") as string,
        meta_data: data.get("meta_data") as string,
        doc: data.get("doc") as File,
      };

      result = await addDoc(docData);
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
