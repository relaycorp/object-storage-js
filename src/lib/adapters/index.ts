import { GCSClient } from './GCSClient';
import { MinioClient } from './MinioClient';
import { S3Client } from './S3Client';

export type AdapterType = 'gcs' | 'minio' | 's3';

export const CLIENT_BY_ADAPTER_NAME = {
  gcs: GCSClient,
  minio: MinioClient,
  s3: S3Client,
};
