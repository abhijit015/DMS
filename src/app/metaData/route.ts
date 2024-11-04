import { NextRequest, NextResponse } from "next/server";
import { addMetaData, modifyMetaData } from "../../services/metaData";
import { validateAccessKey } from "@/services/authorise";

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateAccessKey(request);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid access key or client ID." },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (typeof data !== "object" || data === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    data.client_id = request.headers.get("client_id") || "";
    data.app_id = data.app_id || "";

    await addMetaData(data);

    return NextResponse.json({ message: "Metadata added successfully." });
  } catch (error) {
    console.error("Error adding metadata:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isValid = await validateAccessKey(request);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid access key or client ID." },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (typeof data !== "object" || data === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    data.client_id = request.headers.get("client_id") || "";
    data.app_id = data.app_id || "";

    await modifyMetaData(data);

    return NextResponse.json({ message: "Metadata updated successfully." });
  } catch (error) {
    console.error("Error updating metadata:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// export async function DELETE(request: NextRequest) {

//     try {
//         const isValid = await validateAccessKey(request);
//         if (!isValid) {
//             return NextResponse.json({ error: 'Invalid access key or client ID.' }, { status: 401 });
//         }

//         const client_id = request.headers.get('client_id') || '';
//         const app_id = new URL(request.url).searchParams.get('app_id') || '';

//         if (!client_id || !app_id) {
//             return NextResponse.json({ error: 'client_id and app_id are required.' }, { status: 400 });
//         }

//         await deleteMetaData(client_id, app_id);

//         return NextResponse.json({ message: 'Metadata deleted successfully.' });
//     }

//     catch (error) {
//         console.error('Error deleting metadata:', error);
//         return NextResponse.json({ error: String(error) }, { status: 500 });
//     }
// }
