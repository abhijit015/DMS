import {
  generateSecureToken,
  generateUUID,
  isValidEmailFormat,
} from "@/utils/commonLibrary";
import { executeQuery } from "@/utils/db";
import { ClientSchemaT } from "@/utils/types";

export async function addClient(data: ClientSchemaT) {
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
      data.client_id = generateUUID();
      data.access_key = generateSecureToken(32);
      const qry =
        "insert into client (id,name,email,access_key) values (?,?,?,?)";
      const results = await executeQuery(qry, [
        data.client_id,
        data.name,
        data.email,
        data.access_key,
      ]);
      if (results.affectedRows <= 0) {
        proceed = false;
        errMsg = "Failed to add client. Please try again.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed
        ? {
            client_id: data.client_id,
            access_key: data.access_key,
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

export async function modifyClient(data: ClientSchemaT) {
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

      if (data.email) {
        updates.push("email = ?");
        values.push(data.email);
      }

      values.push(data.client_id);

      const updateQuery = `UPDATE client SET ${updates.join(
        ", "
      )} WHERE id = ?`;
      const results = await executeQuery(updateQuery, values);

      if (results.affectedRows <= 0) {
        proceed = false;
        errMsg = "Failed to modify client. Please try again.";
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

async function clientEmailExists(email: string) {
  try {
    const qry = "SELECT * FROM client WHERE email = ?";
    const results = await executeQuery(qry, [email]);

    if (results.length > 0) {
      return {
        status: false,
        message: "Client email already exists.",
        data: null,
      };
    } else {
      return {
        status: true,
        message: "No client found with the specified email.",
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

async function isValidClientID(id: string) {
  try {
    const qry = "SELECT * FROM client WHERE id = ?";
    const results = await executeQuery(qry, [id]);

    if (results.length > 0) {
      return {
        status: true,
        message: "Success.",
        data: null,
      };
    } else {
      return {
        status: false,
        message: "No client found with the specified id.",
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

async function validateDataB4Add(data: ClientSchemaT) {
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
      if (!data.email) {
        proceed = false;
        errMsg = "Email is required.";
      }
    }

    if (proceed) {
      if (!isValidEmailFormat(data.email)) {
        proceed = false;
        errMsg = "Invalid Email format.";
      }
    }

    if (proceed) {
      const result = clientEmailExists(data.email);
      if (!(await result).status) {
        proceed = false;
        errMsg = (await result).message;
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

async function validateDataB4Modify(data: ClientSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!data.client_id) {
        proceed = false;
        errMsg = "Client ID is required.";
      }
    }

    if (proceed) {
      if (!data.name && !data.email) {
        proceed = false;
        errMsg =
          "At least one field to update (name or email) must be provided.";
      }
    }

    if (proceed) {
      if (data.email) {
        if (!isValidEmailFormat(data.email)) {
          proceed = false;
          errMsg = "Invalid Email format.";
        }
      }
    }

    if (proceed) {
      const result = isValidClientID(data.client_id);
      if (!(await result).status) {
        proceed = false;
        errMsg = (await result).message;
      }
    }

    if (proceed) {
      const result = clientEmailExists(data.email);
      if (!(await result).status) {
        proceed = false;
        errMsg = (await result).message;
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
