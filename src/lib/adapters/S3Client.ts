import { S3 } from 'aws-sdk';
import * as http from 'http';
import * as https from 'https';

import { ClientConfig } from '../config';
import { ObjectStoreClient } from '../ObjectStoreClient';
import { StoreObject } from '../StoreObject';

/**
 * Thin wrapper around S3-compatible object storage library.
 */
export class S3Client implements ObjectStoreClient {
  protected readonly client: S3;

  constructor(config: ClientConfig) {
    const agentOptions = { keepAlive: true };
    const agent = config.tlsEnabled ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
    const options = {
      endpoint: config.endpoint,
      httpOptions: { agent },
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      sslEnabled: config.tlsEnabled,
    };
    this.client = new S3({ ...options, ...(config.credentials && config.credentials) });
  }

  public async getObject(key: string, bucket: string): Promise<StoreObject> {
    const data = await this.client.getObject({ Bucket: bucket, Key: key }).promise();
    return { body: data.Body as Buffer, metadata: data.Metadata || {} };
  }

  public async *listObjectKeys(prefix: string, bucket: string): AsyncIterable<string> {
    let continuationToken: string | undefined;
    do {
      const request = this.client.listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        ...(continuationToken && { ContinuationToken: continuationToken }),
      });
      const response = await request.promise();
      for (const objectData of response.Contents as S3.ObjectList) {
        yield objectData.Key as string;
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken !== undefined);
  }

  public async putObject(object: StoreObject, key: string, bucket: string): Promise<void> {
    const request = this.client.putObject({
      Body: object.body,
      Bucket: bucket,
      Key: key,
      Metadata: object.metadata,
    });
    await request.promise();
  }

  public async deleteObject(key: string, bucket: string): Promise<void> {
    await this.client.deleteObject({ Key: key, Bucket: bucket }).promise();
  }
}
