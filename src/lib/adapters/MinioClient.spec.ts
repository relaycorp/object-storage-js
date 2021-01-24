import { ObjectStorageError } from '../ObjectStorageError';
import { MinioClient } from './MinioClient';

jest.mock('aws-sdk');

describe('Constructor', () => {
  test('Error should be thrown if endpoint is not set', () => {
    // tslint:disable-next-line:no-unused-expression
    expect(() => new MinioClient({ tlsEnabled: true })).toThrow(
      new ObjectStorageError('The Minio adapter requires an endpoint'),
    );
  });
});
