import { ENDPOINT } from '../_test_utils';
import { ClientConfig } from '../config';
import { StoreObject } from '../StoreObject';

export const BUCKET = 'the-bucket';
export const OBJECT: StoreObject = { body: Buffer.from('the-body'), metadata: { key: 'value' } };
export const OBJECT_PREFIX = 'prefix/';
export const OBJECT1_KEY = `${OBJECT_PREFIX}the-object.txt`;
export const OBJECT2_KEY = `${OBJECT_PREFIX}another-object.txt`;

export const CLIENT_CONFIG: ClientConfig = {
  endpoint: ENDPOINT,
  tlsEnabled: true,
};

export async function getPromiseRejection<ErrorType extends Error>(
  promise: Promise<any>,
): Promise<ErrorType> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected promise to throw');
}
