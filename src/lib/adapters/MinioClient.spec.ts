import { CLIENT_CREDENTIALS, ENDPOINT } from '../_test_utils';
import { ObjectStorageError } from '../ObjectStorageError';
import { MinioClient } from './MinioClient';

jest.mock('aws-sdk');

describe('Constructor', () => {
  test('Error should be thrown if endpoint is not set', () => {
    // tslint:disable-next-line:no-unused-expression
    expect(() => new MinioClient({ credentials: CLIENT_CREDENTIALS, tlsEnabled: true })).toThrow(
      new ObjectStorageError('The Minio adapter requires an endpoint'),
    );
  });

  test('Error should be thrown if credentials are not set', () => {
    // tslint:disable-next-line:no-unused-expression
    expect(() => new MinioClient({ endpoint: ENDPOINT, tlsEnabled: true })).toThrow(
      new ObjectStorageError('The Minio adapter requires credentials'),
    );
  });
});
