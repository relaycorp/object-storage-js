import { S3Client } from './S3Client';

export type AdapterType = 's3' | 'minio';

export const CLIENT_BY_ADAPTER_NAME = {
  minio: S3Client,
  s3: S3Client,
};
