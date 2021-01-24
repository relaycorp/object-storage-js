import { GetFilesOptions, Storage } from '@google-cloud/storage';

import { ClientConfig } from '../config';
import { ObjectStorageError } from '../ObjectStorageError';
import { ObjectStoreClient } from '../ObjectStoreClient';
import { StoreObject } from '../StoreObject';

export class GCSClient implements ObjectStoreClient {
  protected readonly client: Storage;

  constructor(config: ClientConfig) {
    if (config.credentials) {
      throw new ObjectStorageError('GCS adapter does not accept HMAC key credentials');
    }
    if (!config.endpoint && !config.tlsEnabled) {
      throw new ObjectStorageError('GCS adapter requires custom endpoint if TLS is to be disabled');
    }
    const apiEndpointScheme = config.tlsEnabled ? 'https' : 'http';
    const apiEndpoint = config.endpoint ? `${apiEndpointScheme}://${config.endpoint}` : undefined;
    this.client = new Storage({ ...(apiEndpoint && { apiEndpoint }) });
  }

  public async deleteObject(_key: string, _bucket: string): Promise<void> {
    throw new Error();
  }

  public async getObject(_key: string, _bucket: string): Promise<StoreObject> {
    throw new Error();
  }

  public async *listObjectKeys(prefix: string, bucket: string): AsyncIterable<string> {
    let query: GetFilesOptions = { prefix, autoPaginate: false };
    do {
      const retrievalResult = await this.client.bucket(bucket).getFiles(query);
      for (const file of retrievalResult[0]) {
        yield file.name;
      }
      query = retrievalResult[1];
    } while (query !== null);
  }

  public async putObject(_object: StoreObject, _key: string, _bucket: string): Promise<void> {
    throw new Error();
  }
}
