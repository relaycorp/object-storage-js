import { StoreObject } from './StoreObject';

/**
 * Interface for all object store clients.
 */
export interface ObjectStoreClient {
  /**
   * Retrieve the object by key or return `null` if the key doesn't exist.
   */
  readonly getObject: (key: string, bucket: string) => Promise<StoreObject | null>;

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
   * Delete the object corresponding to `key`.
   *
   * This method resolves even if the `key` doesn't exist, in order to provide a normalised API,
   * since Amazon S3 always returns a `204` regardless of whether the object exists (GCS returns a
   * `404` and its SDK throws an error).
   */
  readonly deleteObject: (key: string, bucket: string) => Promise<void>;
}
