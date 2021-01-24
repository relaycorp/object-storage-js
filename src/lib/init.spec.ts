import { ACCESS_KEY, ENDPOINT, SECRET_ACCESS_KEY } from './_test_utils';
import { AdapterType, CLIENT_BY_ADAPTER_NAME } from './adapters';
import { S3Client } from './adapters/S3Client';
import { initObjectStoreClient } from './init';
import { ObjectStorageError } from './ObjectStorageError';

jest.mock('./adapters/S3Client');

describe('initObjectStoreClient', () => {
  test('An invalid type should be refused', () => {
    const invalidType = 'foo';
    expect(() =>
      initObjectStoreClient(invalidType as any, ENDPOINT, ACCESS_KEY, SECRET_ACCESS_KEY),
    ).toThrowError(new ObjectStorageError(`Unknown client type "${invalidType}"`));
  });

  test.each(Object.getOwnPropertyNames(CLIENT_BY_ADAPTER_NAME))(
    '%s client should be returned if requested',
    (adapterName) => {
      const client = initObjectStoreClient(
        adapterName as any,
        ENDPOINT,
        ACCESS_KEY,
        SECRET_ACCESS_KEY,
      );

      const expectedClientClass = CLIENT_BY_ADAPTER_NAME[adapterName as AdapterType];
      expect(client).toBeInstanceOf(expectedClientClass);
      expect(expectedClientClass).toBeCalledWith({
        credentials: {
          accessKeyId: ACCESS_KEY,
          secretAccessKey: SECRET_ACCESS_KEY,
        },
        endpoint: ENDPOINT,
        tlsEnabled: true,
      });
    },
  );

  test('Endpoint should be unset if absent', () => {
    initObjectStoreClient('s3');

    expect(S3Client).toBeCalledWith(
      expect.not.objectContaining({
        endpoint: expect.anything(),
      }),
    );
  });

  test('Credentials should be unset if absent', () => {
    initObjectStoreClient('s3');

    expect(S3Client).toBeCalledWith(
      expect.not.objectContaining({
        credentials: expect.anything(),
      }),
    );
  });

  test('Partially setting credentials should be refused', () => {
    expect(() => initObjectStoreClient('s3', ENDPOINT, ACCESS_KEY, undefined)).toThrow(
      new ObjectStorageError(
        'Both access key id and secret access key must be set, or neither must be set',
      ),
    );
    expect(() => initObjectStoreClient('s3', ENDPOINT, undefined, SECRET_ACCESS_KEY)).toThrow(
      new ObjectStorageError(
        'Both access key id and secret access key must be set, or neither must be set',
      ),
    );
  });

  test('TLS should be disabled if requested', () => {
    initObjectStoreClient('s3', ENDPOINT, ACCESS_KEY, SECRET_ACCESS_KEY, false);

    expect(S3Client).toBeCalledWith(
      expect.objectContaining({
        tlsEnabled: false,
      }),
    );
  });
});
