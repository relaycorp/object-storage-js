import { ClientConfig } from '../config';
import { ObjectStorageError } from '../ObjectStorageError';
import { S3Client } from './S3Client';

export class MinioClient extends S3Client {
  constructor(config: ClientConfig) {
    if (!config.endpoint) {
      throw new ObjectStorageError('The Minio adapter requires an endpoint');
    }
    super(config);
  }
}
