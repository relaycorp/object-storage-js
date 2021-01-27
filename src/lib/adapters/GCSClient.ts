import { GetFilesOptions, Storage } from '@google-cloud/storage';

import { ClientConfig } from '../config';
import { NonExistingObjectError, ObjectStorageError } from '../errors';
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

  public async deleteObject(key: string, bucket: string): Promise<void> {
    const file = this.client.bucket(bucket).file(key);
    try {
      await file.delete();
    } catch (error) {
      if (error.code === 404) {
        throw new NonExistingObjectError(
          `Object ${key} in bucket ${bucket} doesn't exist (${error.message})`,
        );
      }
      throw error;
    }
  }

  public async getObject(key: string, bucket: string): Promise<StoreObject> {
    const [gcsFile] = await this.client.bucket(bucket).file(key).get();
    const download = await gcsFile.download();
    return { body: download[0], metadata: gcsFile.metadata.metadata ?? {} };
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

  public async putObject(object: StoreObject, key: string, bucket: string): Promise<void> {
    const file = this.client.bucket(bucket).file(key);
    await file.save(object.body, {
      resumable: false, // https://github.com/fsouza/fake-gcs-server/issues/346
    });
    await file.setMetadata({ metadata: object.metadata });
  }
}
