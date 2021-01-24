import { Storage } from '@google-cloud/storage';

import { asyncIterableToArray, CLIENT_CREDENTIALS, ENDPOINT, mockSpy } from '../_test_utils';
import { ObjectStorageError } from '../ObjectStorageError';
import {
  BUCKET,
  CLIENT_CONFIG,
  OBJECT,
  OBJECT1_KEY,
  OBJECT2_KEY,
  OBJECT_PREFIX,
} from './_test_utils';
import { GCSClient } from './GCSClient';

const mockFile = {
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

describe('putObject', () => {
  test('Object should be created with specified parameters', async () => {
    await CLIENT.putObject(OBJECT, OBJECT1_KEY, BUCKET);

    expect(mockBucket.file).toBeCalledWith(OBJECT1_KEY);
    expect(mockFile.save).toBeCalledWith(OBJECT.body);
    expect(mockFile.setMetadata).toBeCalledWith(OBJECT.metadata);
  });
});
