import { StoreObject } from './StoreObject';

/**
 * Interface for all object store clients.
 */
export interface ObjectStoreClient {
  readonly getObject: (key: string, bucket: string) => Promise<StoreObject>;

  /**
   * Retrieve the keys for all the objects in the specified bucket with the specified key prefix.
   *
   * This will handle pagination if the backend supports it (S3 does, Minio doesn't).
   *
   * @param prefix
   * @param bucket
   */
  readonly listObjectKeys: (prefix: string, bucket: string) => AsyncIterable<string>;

  readonly putObject: (object: StoreObject, key: string, bucket: string) => Promise<void>;

  /**
   * Delete the object corresponding to`key`.
   *
   * @throws [NonExistingObjectError] If the object does not exist
   */
  readonly deleteObject: (key: string, bucket: string) => Promise<void>;
}
