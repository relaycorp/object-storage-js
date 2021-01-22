import { ACCESS_KEY, ENDPOINT, SECRET_ACCESS_KEY } from './_test_utils';
import { AdapterType, CLIENT_BY_ADAPTER_NAME } from './adapters';
import { S3Client } from './adapters/S3Client';
import { initObjectStoreClientWithHMACKeys } from './constructors';
import { ObjectStorageError } from './ObjectStorageError';

jest.mock('./adapters/S3Client');

describe('initObjectStoreClientWithHMACKeys', () => {
  test('An invalid type should be refused', () => {
    const invalidType = 'foo';
    expect(() =>
      initObjectStoreClientWithHMACKeys(
        invalidType as any,
        ENDPOINT,
        ACCESS_KEY,
        SECRET_ACCESS_KEY,
      ),
    ).toThrowError(new ObjectStorageError(`Unknown client type "${invalidType}"`));
  });

  test.each([Object.getOwnPropertyNames(CLIENT_BY_ADAPTER_NAME)])(
    '%s client should be returned if requested',
    (adapterName) => {
      const client = initObjectStoreClientWithHMACKeys(
        adapterName as any,
        ENDPOINT,
        ACCESS_KEY,
        SECRET_ACCESS_KEY,
      );

      const expectedClientClass = CLIENT_BY_ADAPTER_NAME[adapterName as AdapterType];
      expect(client).toBeInstanceOf(expectedClientClass);
      expect(expectedClientClass).toBeCalledWith({
        accessKeyId: ACCESS_KEY,
        endpointURL: ENDPOINT,
        secretAccessKey: SECRET_ACCESS_KEY,
        tlsEnabled: true,
      });
    },
  );

  test('TLS should be disabled if requested', () => {
    initObjectStoreClientWithHMACKeys('s3', ENDPOINT, ACCESS_KEY, SECRET_ACCESS_KEY, false);

    expect(S3Client).toBeCalledWith(
      expect.objectContaining({
        tlsEnabled: false,
      }),
    );
  });
});
