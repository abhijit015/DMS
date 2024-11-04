import { generateUUID } from "@/utils/commonLibrary";
import { executeQuery } from "@/utils/db";
import { AppSchemaT } from "@/utils/types";

export async function addApp(data: AppSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const isValidData = await validateDataB4Add(data);

      if (!isValidData.status) {
        proceed = false;
        errMsg = isValidData.message;
      }
    }

    if (proceed) {
      data.app_id = generateUUID();
      const qry =
        "insert into apps (id,name, client_id, data_keys) values (?,?,?,?)";
      const results = await executeQuery(qry, [
        data.app_id,
        data.name,
        data.client_id,
        data.data_keys,
      ]);
      if (results.affectedRows <= 0) {
        proceed = false;
        errMsg = "Failed to add app. Please try again.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed
        ? {
            app_id: data.app_id,
          }
        : null,
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

export async function modifyApp(data: AppSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const isValidData = await validateDataB4Modify(data);

      if (!isValidData.status) {
        proceed = false;
        errMsg = isValidData.message;
      }
    }

    if (proceed) {
      const updates = [];
      const values = [];

      if (data.name) {
        updates.push("name = ?");
        values.push(data.name);
      }

      if (data.data_keys) {
        updates.push("data_keys = ?");
        values.push(data.data_keys);
      }

      values.push(data.app_id);

      const updateQuery = `UPDATE apps SET ${updates.join(", ")} WHERE id = ?`;
      const results = await executeQuery(updateQuery, values);

      if (results.affectedRows <= 0) {
        proceed = false;
        errMsg = "Failed to modify app. Please try again.";
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

async function appNameExists(data: AppSchemaT) {
  try {
    const qry = "SELECT * FROM apps WHERE name = ? and client_id = ?";
    const results = await executeQuery(qry, [data.name, data.client_id]);

    if (results.length > 0) {
      return {
        status: false,
        message: "App name already exists.",
        data: null,
      };
    } else {
      return {
        status: true,
        message: "No app found with the specified name.",
        data: null,
      };
    }
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function isValidAppID(app_id: string, client_id: string) {
  try {
    const qry = "SELECT * FROM apps WHERE id = ? and client_id=?";
    const results = await executeQuery(qry, [app_id, client_id]);

    if (results.length > 0) {
      return {
        status: true,
        message: "Success.",
        data: null,
      };
    } else {
      return {
        status: false,
        message: "No app found with the specified id.",
        data: null,
      };
    }
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

async function validateDataB4Add(data: AppSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!data.name) {
        proceed = false;
        errMsg = "Name is required.";
      }
    }

    if (proceed) {
      if (!data.client_id) {
        proceed = false;
        errMsg = "Client ID is required.";
      }
    }


    if (proceed) {
      if (!data.data_keys) {
        proceed = false;
        errMsg = "Data keys are required.";
      }
    }


    if (proceed) {
      if (data.data_keys) {
        for (const [key, value] of Object.entries(data.data_keys)) {
          if (
            typeof value !== "object" ||
            typeof value.type !== "string" ||
            typeof value.required !== "boolean"
          ) {
            proceed = false;
            errMsg = `Invalid format for data_keys entry: ${key}`;
            break;
          }
        }
      }
    }

    if (proceed) {
      const result = await appNameExists(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
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

async function validateDataB4Modify(data: AppSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!data.app_id) {
        proceed = false;
        errMsg = "App ID is required.";
      }
    }

    if (proceed) {
      if (!data.name && !data.data_keys) {
        proceed = false;
        errMsg =
          "At least one field to update (name or data keys) must be provided.";
      }
    }

    if (proceed) {
      if (data.data_keys) {
        for (const [key, value] of Object.entries(data.data_keys)) {
          if (
            typeof value !== "object" ||
            typeof value.type !== "string" ||
            typeof value.required !== "boolean"
          ) {
            proceed = false;
            errMsg = `Invalid format for data_keys entry: ${key}`;
            break;
          }
        }
      }
    }

    if (proceed) {
      if (data.data_keys) {
        const qry = "select * from document where app_id=?";
        const result = await executeQuery(qry, [data.app_id]);
        if (result.length > 0) {
          proceed = false;
          errMsg =
            "Data Keys cannot be modified because documents exist for this App ID. Please delete all associated documents to modify Data Keys.";
        }
      }
    }

    if (proceed) {
      const result = await isValidAppID(data.app_id, data.client_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await appNameExists(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
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
