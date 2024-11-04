import { executeQuery } from "@/utils/db";

export async function validateReqAuth(
  clientId: string | null,
  accessKey: string | null
) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!clientId) {
        proceed = false;
        errMsg = "Client ID is required.";
      }
    }

    if (proceed) {
      if (!accessKey) {
        proceed = false;
        errMsg = "Access Key is required.";
      }
    }

    if (proceed) {
      const qry = "SELECT * FROM client WHERE id = ? AND access_key = ?";
      const results = await executeQuery(qry, [clientId, accessKey]);

      if (results.length <= 0) {
        proceed = false;
        errMsg = "Invalid Client ID or Access Key.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}
