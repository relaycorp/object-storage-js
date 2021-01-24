import { AdapterType, CLIENT_BY_ADAPTER_NAME } from './adapters';
import { ClientConfig } from './config';
import { ObjectStorageError } from './ObjectStorageError';
import { ObjectStoreClient } from './ObjectStoreClient';

type clientConstructor = (config: ClientConfig) => ObjectStoreClient;

const CONSTRUCTORS: { readonly [key: string]: clientConstructor } = Object.entries(
  CLIENT_BY_ADAPTER_NAME,
).reduce((acc, [k, v]) => ({ ...acc, [k]: (config: ClientConfig) => new v(config) }), {});

/**
 * Return object store client for the specified `type`.
 *
 * @param type
 * @param endpoint
 * @param accessKeyId
 * @param secretAccessKey
 * @param tlsEnabled
 */
export function initObjectStoreClient(
  type: AdapterType,
  endpoint: string,
  accessKeyId?: string,
  secretAccessKey?: string,
  tlsEnabled = true,
): ObjectStoreClient {
  const constructor = CONSTRUCTORS[type];
  if (!constructor) {
    throw new ObjectStorageError(`Unknown client type "${type}"`);
  }
  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new ObjectStorageError(
      'Both access key id and secret access key must be set, or neither must be set',
    );
  }
  const credentials = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
  return constructor({
    credentials,
    endpoint,
    tlsEnabled,
  });
}
