import { AdapterType, CLIENT_BY_ADAPTER_NAME } from './adapters';
import { ClientHMACKeyConfig } from './ClientConfig';
import { ObjectStorageError } from './ObjectStorageError';
import { ObjectStoreClient } from './ObjectStoreClient';

type clientConstructor = (config: ClientHMACKeyConfig) => ObjectStoreClient;

const CONSTRUCTORS: { readonly [key: string]: clientConstructor } = Object.entries(
  CLIENT_BY_ADAPTER_NAME,
).reduce((acc, [k, v]) => ({ ...acc, [k]: (config: ClientHMACKeyConfig) => new v(config) }), {});

/**
 * Return object store client for the specified `type`.
 *
 * @param type
 * @param endpointURL
 * @param accessKeyId
 * @param secretAccessKey
 * @param tlsEnabled
 */
export function initObjectStoreClientWithHMACKeys(
  type: AdapterType,
  endpointURL: string,
  accessKeyId: string,
  secretAccessKey: string,
  tlsEnabled = true,
): ObjectStoreClient {
  const constructor = CONSTRUCTORS[type];
  if (!constructor) {
    throw new ObjectStorageError(`Unknown client type "${type}"`);
  }
  return constructor({
    accessKeyId,
    endpointURL,
    secretAccessKey,
    tlsEnabled,
  });
}
