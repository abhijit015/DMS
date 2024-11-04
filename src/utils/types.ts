export type ClientSchemaT = {
  client_id: string;
  name: string;
  email: string;
  access_key: string;
};

export type AppSchemaT = {
  app_id: string;
  name: string;
  client_id: string;
  data_keys: DataKeys;  
};

export type DataKey = {
  type: string;
  required: boolean;
};

export type DataKeys = Record<string, DataKey>; 

export type DocSchemaT = {
  doc_id?: string;
  app_id: string;
  client_id: string;
  doc?: File;
  doc_title?: string;
  doc_path?: string;
  doc_type?: string;
  doc_buffer?: Buffer;
  meta_data?: string;
  version_num?: number;
};
