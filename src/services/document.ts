import {
  generateUUID,
  validateDataKeys,
} from "@/utils/commonLibrary";
import { executeQuery, getConn } from "@/utils/db";
import { DataKeys, DocSchemaT } from "@/utils/types";
import {
  writeFile,
  mkdir,
  readFile,
  unlink,
  rm,
  readdir,
  copyFile,
} from "fs/promises";
import { join, dirname } from "path";
import { isValidAppID } from "./apps";
import { exec } from "child_process";

export async function addDoc(data: DocSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let existingDoc: boolean = false;
  let connection;

  try {
    if (proceed) {
      const isValidData = await validateDataB4Add(data);

      if (!isValidData.status) {
        proceed = false;
        errMsg = isValidData.message;
      }
    }

    if (proceed && data.doc) {
      data.doc_buffer = Buffer.from(await data.doc.arrayBuffer());
      data.doc_title = data.doc.name;
      data.doc_type = data.doc.type;
    }

    if (proceed) {
      const result = await isExistingDoc(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        existingDoc = result.data.exists;
        if (existingDoc) {
          data.doc_id = result.data.doc_id;
        } else {
          data.doc_id = generateUUID();
        }
      }
    }

    if (proceed) {
      if (existingDoc) {
        const qry =
          "select max(version_num) as version_num from document_version where doc_id=?";
        const results = await executeQuery(qry, [data.doc_id]);
        if (results.length > 0) {
          data.version_num = results[0].version_num + 1;
        }
      } else {
        data.version_num = 1;
      }
    }

    if (proceed && data.doc_id && data.doc_type && data.doc_buffer) {
      const docDirectory = join(
        "uploads",
        data.client_id,
        data.app_id,
        data.doc_id
      );

      const filePath = join(
        docDirectory,
        `${data.version_num}.${data.doc_type.split("/").pop()}`
      );

      await mkdir(docDirectory, { recursive: true });

      await writeFile(filePath, data.doc_buffer);

      data.doc_path = docDirectory;
    }

    if (proceed && data.doc_path) {
      let qry = "";
      let result;

      if (existingDoc) {
        qry =
          "insert into document_version (doc_id, version_num, meta_data) values (?,?,?)";
        result = await executeQuery(qry, [
          data.doc_id,
          data.version_num,
          data.meta_data,
        ]);
        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Failed to insert document. Please try again.";
          await unlink(data.doc_path);
        }
      } else {
        connection = await getConn();
        await connection.beginTransaction();

        qry =
          "insert into document (id, app_id,doc_title,doc_type,doc_path) values (?,?,?,?,?)";
        result = await executeQuery(
          qry,
          [
            data.doc_id,
            data.app_id,
            data.doc_title,
            data.doc_type,
            data.doc_path,
          ],
          connection
        );

        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Failed to insert document. Please try again.";
          await unlink(data.doc_path);
          await connection.rollback();
        }

        if (proceed) {
          qry =
            "insert into document_version (doc_id, version_num, meta_data) values (?,?,?)";
          result = await executeQuery(
            qry,
            [data.doc_id, data.version_num, data.meta_data],
            connection
          );
          if (result.affectedRows <= 0) {
            proceed = false;
            errMsg = "Failed to insert document. Please try again.";
            await unlink(data.doc_path);
            await connection.rollback();
          }
        }

        if (proceed) {
          await connection.commit();
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed
        ? {
            doc_id: data.doc_id,
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
  } finally {
    if (connection) connection.release();
  }
}

async function isExistingDoc(data: DocSchemaT) {
  try {
    const qry =
      "SELECT id FROM document WHERE app_id = ? and doc_title=? and doc_type=?";
    const results = await executeQuery(qry, [
      data.app_id,
      data.doc_title,
      data.doc_type,
    ]);

    if (results.length > 0) {
      return {
        status: true,
        message: "Document already exists.",
        data: {
          exists: true,
          doc_id: results[0].id,
        },
      };
    } else {
      return {
        status: true,
        message: "Document doesn't exist.",
        data: {
          exists: false,
          doc_id: null,
        },
      };
    }
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: {
        exists: false,
        doc_id: null,
      },
    };
  }
}

async function validateDataB4Add(data: DocSchemaT) {
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
      if (!data.doc) {
        proceed = false;
        errMsg = "Document is required.";
      }
    }

    if (proceed) {
      if (!data.meta_data) {
        proceed = false;
        errMsg = "Meta Data is required.";
      }
    }


    if (proceed) {
      const qry = "select data_keys from apps where id=?";
      const result = await executeQuery(qry, [data.app_id]);

      if (result.length > 0) {
        const dataKeys = result[0].data_keys;

        if (proceed && data.meta_data) {
          const validationResult = validateDataKeys(dataKeys, data.meta_data);
          if (!validationResult.isValid) {
            proceed = false;
            errMsg = validationResult.errors;
          }
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

export async function getDoc(data: DocSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await validateDataB4Get(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const qry =
        "select d.doc_path, d.doc_title, d.doc_type, dv.version_num from document as d, document_version as dv where d.app_id = ? AND d.id = ? and d.id=dv.doc_id and dv.version_num = (SELECT MAX(version_num) FROM document_version WHERE doc_id = d.id)";
      const result = await executeQuery(qry, [data.app_id, data.doc_id]);
      if (result.length > 0) {
        data.doc_path = result[0].doc_path;
        data.doc_title = result[0].doc_title;
        data.doc_type = result[0].doc_type;
        data.version_num = result[0].version_num;
      } else {
        proceed = false;
        errMsg = "Document ID not found.";
      }
    }

    if (proceed && data.doc_path && data.doc_type) {
      const filePath = join(
        data.doc_path,
        `${data.version_num}.${data.doc_type.split("/").pop()}`
      );

      data.doc_buffer = await readFile(join(process.cwd(), filePath));
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed
        ? {
            doc_title: data.doc_title,
            doc_type: data.doc_type,
            doc_buffer: data.doc_buffer,
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

async function validateDataB4Get(data: DocSchemaT) {
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
      if (!data.doc_id) {
        proceed = false;
        errMsg = "Document ID is required.";
      }
    }

    if (proceed) {
      const result = await isValidAppID(data.app_id, data.client_id);
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

export async function deleteDoc(data: DocSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let connection;

  try {
    if (proceed) {
      const result = await validateDataB4Delete(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const qry = "select doc_path from document where id=? and app_id= ?";
      const result = await executeQuery(qry, [data.doc_id, data.app_id]);
      if (result.length > 0) {
        data.doc_path = result[0].doc_path;
      } else {
        proceed = false;
        errMsg = "Document ID not found.";
      }
    }

    if (proceed && data.doc_path) {
      const backupPath = `${data.doc_path}_backup`;

      await mkdir(backupPath, { recursive: true });

      const originalFiles = await readdir(data.doc_path);
      for (const file of originalFiles) {
        const sourceFilePath = join(data.doc_path, file);
        const destFilePath = join(backupPath, file);
        await copyFile(sourceFilePath, destFilePath);
      }

      await rm(data.doc_path, { recursive: true, force: true });

      connection = await getConn();
      await connection.beginTransaction();

      let qry = "delete from document_version where doc_id= ?";
      let result = await executeQuery(qry, [data.doc_id], connection);
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete the docs";
        await connection.rollback();
      }

      if (proceed) {
        qry = "delete from document where id= ?";
        result = await executeQuery(qry, [data.doc_id], connection);
        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Unable to delete the docs";
          await connection.rollback();
        }
      }

      if (proceed) {
        await connection.commit();
      } else {
        await mkdir(data.doc_path, { recursive: true });
        for (const file of originalFiles) {
          const sourcePath = join(backupPath, file);
          const destPath = join(data.doc_path, file);
          await copyFile(sourcePath, destPath);
        }
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
  } finally {
    if (connection) connection.release();
  }
}

async function validateDataB4Delete(data: DocSchemaT) {
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
      if (!data.doc_id) {
        proceed = false;
        errMsg = "Document ID is required.";
      }
    }

    if (proceed) {
      const result = await isValidAppID(data.app_id, data.client_id);
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
