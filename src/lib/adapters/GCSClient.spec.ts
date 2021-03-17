import { Storage } from '@google-cloud/storage';

import { asyncIterableToArray, CLIENT_CREDENTIALS, ENDPOINT, mockSpy } from '../_test_utils';
import { ObjectStorageError } from '../errors';
import {
  BUCKET,
  CLIENT_CONFIG,
  OBJECT,
  OBJECT1_KEY,
  OBJECT2_KEY,
  OBJECT_PREFIX,
} from './_test_utils';
import { GCSClient } from './GCSClient';

const mockFile: any = {
  delete: mockSpy(jest.fn()),
  download: mockSpy(jest.fn(), () => Promise.resolve([OBJECT.body])),
  get: mockSpy(jest.fn(), () => Promise.resolve([mockFile, {}])),
  metadata: { metadata: OBJECT.metadata },
  save: mockSpy(jest.fn()),
  setMetadata: mockSpy(jest.fn()),
};
const mockBucket = {
  file: mockSpy(jest.fn(), () => mockFile),
  getFiles: mockSpy(jest.fn(), () => Promise.resolve([[], null])),
};
const mockStorage = {
  bucket: mockSpy(jest.fn(), (bucketName) => {
    expect(bucketName).toEqual(BUCKET);
    return mockBucket;
  }),
};
jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => mockStorage),
}));

const CLIENT = new GCSClient(CLIENT_CONFIG);

describe('Constructor', () => {
  test('Specified endpoint should be specified', () => {
    // tslint:disable-next-line:no-unused-expression
    new GCSClient(CLIENT_CONFIG);

    expect(Storage).toBeCalledWith(expect.objectContaining({ apiEndpoint: `https://${ENDPOINT}` }));
  });

  test('No endpoint should be specified if none was passed', () => {
    // tslint:disable-next-line:no-unused-expression
    new GCSClient({ tlsEnabled: true });

    expect(Storage).toBeCalledWith(expect.not.objectContaining({ apiEndpoint: expect.anything() }));
  });

  test('HMAC key credentials should be refused', () => {
    expect(() => new GCSClient({ ...CLIENT_CONFIG, credentials: CLIENT_CREDENTIALS })).toThrow(
      new ObjectStorageError('GCS adapter does not accept HMAC key credentials'),
    );
  });

  test('TSL should be enabled if requested', () => {
    // tslint:disable-next-line:no-unused-expression
    new GCSClient({ endpoint: ENDPOINT, tlsEnabled: true });

    expect(Storage).toBeCalledWith(
      expect.objectContaining({ apiEndpoint: expect.stringMatching(/^https:\/\//) }),
    );
  });

  test('TSL may be disabled if requested and custom endpoint is set', () => {
    // tslint:disable-next-line:no-unused-expression
    new GCSClient({ endpoint: ENDPOINT, tlsEnabled: false });

    expect(Storage).toBeCalledWith(
      expect.objectContaining({ apiEndpoint: expect.stringMatching(/^http:\/\//) }),
    );
  });

  test('TSL may not be disabled if default endpoint is used', () => {
    // tslint:disable-next-line:no-unused-expression
    expect(() => new GCSClient({ tlsEnabled: false })).toThrow(
      new ObjectStorageError('GCS adapter requires custom endpoint if TLS is to be disabled'),
    );
  });
});

describe('listObjectKeys', () => {
  test('Prefix should be honored', async () => {
    await asyncIterableToArray(CLIENT.listObjectKeys(OBJECT_PREFIX, BUCKET));

    expect(mockBucket.getFiles).toBeCalledWith(expect.objectContaining({ prefix: OBJECT_PREFIX }));
  });

  test('Keys for objects matching criteria should be yielded', async () => {
    const objectKeys: readonly string[] = [`${OBJECT_PREFIX}logo.png`, `${OBJECT_PREFIX}logo.gif`];
    mockBucket.getFiles.mockResolvedValue([objectKeys.map((k) => ({ name: k })), null]);

    const retrievedKeys = await asyncIterableToArray(CLIENT.listObjectKeys(OBJECT_PREFIX, BUCKET));

    expect(retrievedKeys).toEqual(objectKeys);
  });

  test('Pagination should be handled seamlessly', async () => {
    const objectKeys1: readonly string[] = [OBJECT1_KEY, OBJECT2_KEY];
    const page2Query = { foo: 'bar' };
    mockBucket.getFiles.mockResolvedValueOnce([objectKeys1.map((k) => ({ name: k })), page2Query]);
    const objectKeys2: readonly string[] = [
      `${OBJECT_PREFIX}style.css`,
      `${OBJECT_PREFIX}mobile.css`,
    ];
    mockBucket.getFiles.mockResolvedValueOnce([objectKeys2.map((k) => ({ name: k })), null]);

    const retrievedKeys = await asyncIterableToArray(CLIENT.listObjectKeys(OBJECT_PREFIX, BUCKET));

    expect(retrievedKeys).toEqual([...objectKeys1, ...objectKeys2]);

    expect(mockBucket.getFiles).nthCalledWith(1, expect.objectContaining({ autoPaginate: false }));
    expect(mockBucket.getFiles).nthCalledWith(2, page2Query);
  });
});

describe('getObject', () => {
  test('Object should be retrieved with the specified key', async () => {
    await CLIENT.getObject(OBJECT1_KEY, BUCKET);

    expect(mockBucket.file).toBeCalledWith(OBJECT1_KEY);
  });

  test('Body and metadata should be output', async () => {
    const object = await CLIENT.getObject(OBJECT1_KEY, BUCKET);

    expect(object).toHaveProperty('body', OBJECT.body);
    expect(object).toHaveProperty('metadata', OBJECT.metadata);
  });

  test('Metadata should fall back to empty object when undefined', async () => {
    mockFile.get.mockResolvedValue([{ download: mockFile.download, metadata: {} }]);

    const object = await CLIENT.getObject(OBJECT1_KEY, BUCKET);

    expect(object).toHaveProperty('body', OBJECT.body);
    expect(object).toHaveProperty('metadata', {});
  });

  test('Nothing should be returned if the key does not exist', async () => {
    mockFile.get.mockRejectedValue(new ApiError('Whoops', 404));

    await expect(CLIENT.getObject(OBJECT1_KEY, BUCKET)).resolves.toBeNull();
  });

  test('Errors other than a missing key should be propagated', async () => {
    const apiError = new Error('Whoops');
    mockFile.get.mockRejectedValue(apiError);

    await expect(CLIENT.getObject(OBJECT1_KEY, BUCKET)).rejects.toEqual(apiError);
  });
});

describe('putObject', () => {
  test('Object should be created with specified parameters', async () => {
    await CLIENT.putObject(OBJECT, OBJECT1_KEY, BUCKET);

    expect(mockBucket.file).toBeCalledWith(OBJECT1_KEY);
    expect(mockFile.save).toBeCalledWith(OBJECT.body, { resumable: false });
    expect(mockFile.setMetadata).toBeCalledWith({ metadata: OBJECT.metadata });
  });
});

describe('deleteObject', () => {
  test('Specified object should be deleted', async () => {
    await CLIENT.deleteObject(OBJECT1_KEY, BUCKET);

    expect(mockBucket.file).toBeCalledWith(OBJECT1_KEY);
    expect(mockFile.delete).toBeCalledWith();
  });

  test('Failure to delete non-existing object should be suppressed', async () => {
    mockFile.delete.mockRejectedValue(new ApiError('Whoops', 404));

    await expect(CLIENT.deleteObject(OBJECT1_KEY, BUCKET)).toResolve();
  });

  test('Other errors should be propagated', async () => {
    const apiError = new Error('Whoops');
    mockFile.delete.mockRejectedValue(apiError);

    await expect(CLIENT.deleteObject(OBJECT1_KEY, BUCKET)).rejects.toEqual(apiError);
  });
});

/**
 * Mock GCS' own `ApiError`.
 */
class ApiError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
  }
}
