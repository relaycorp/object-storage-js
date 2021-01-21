import { StoreObject } from './StoreObject';

/**
 * Interface for all object store clients.
 */
export interface ObjectStoreClient {
  getObject(key: string, bucket: string): Promise<StoreObject>;

  /**
   * Retrieve the keys for all the objects in the specified bucket with the specified key prefix.
   *
   * This will handle pagination if the backend supports it (S3 does, Minio doesn't).
   *
   * @param prefix
   * @param bucket
   */
  listObjectKeys(prefix: string, bucket: string): AsyncIterable<string>;

  putObject(object: StoreObject, key: string, bucket: string): Promise<void>;

  deleteObject(key: string, bucket: string): Promise<void>;
}
