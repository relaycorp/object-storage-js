import { config as loadDotEnvVars } from 'dotenv';
import { get as getEnvVar } from 'env-var';
import { Client as MinioClient } from 'minio';

import { asyncIterableToArray } from '../lib/_test_utils';
import { AdapterType } from '../lib/adapters';
import { initObjectStoreClientWithHMACKeys } from '../lib/constructors';
import { StoreObject } from '../lib/StoreObject';

loadDotEnvVars();

const OBJECT_STORE_HOST = '127.0.0.1';
const OBJECT_STORE_BUCKET = getEnvVar('OBJECT_STORE_BUCKET').required().asString();
const OBJECT_STORE_ACCESS_KEY_ID = getEnvVar('OBJECT_STORE_ACCESS_KEY_ID').required().asString();
const OBJECT_STORE_SECRET_KEY = getEnvVar('OBJECT_STORE_SECRET_KEY').required().asString();

const STUB_OBJECT: StoreObject = { body: Buffer.from('the body'), metadata: { key: 'value' } };
const STUB_OBJECT_KEY = 'object.ext';

test('Minio', async () => {
  const minioPort = 9000;
  const minioClient = new MinioClient({
    accessKey: OBJECT_STORE_ACCESS_KEY_ID,
    endPoint: OBJECT_STORE_HOST,
    port: minioPort,
    secretKey: OBJECT_STORE_SECRET_KEY,
    useSSL: false,
  });
  await minioClient.makeBucket(OBJECT_STORE_BUCKET, '');

  await testClient('minio', `${OBJECT_STORE_HOST}:${minioPort}`);
});

async function testClient(adapterType: AdapterType, endpoint: string): Promise<void> {
  const client = initObjectStoreClientWithHMACKeys(
    adapterType,
    endpoint,
    OBJECT_STORE_ACCESS_KEY_ID,
    OBJECT_STORE_SECRET_KEY,
    false,
  );

  await expect(
    asyncIterableToArray(client.listObjectKeys('/', OBJECT_STORE_BUCKET)),
  ).resolves.toHaveLength(0);
  await expect(client.getObject(STUB_OBJECT_KEY, OBJECT_STORE_BUCKET)).rejects.not.toBeNull();

  await client.putObject(STUB_OBJECT, STUB_OBJECT_KEY, OBJECT_STORE_BUCKET);

  await expect(
    asyncIterableToArray(client.listObjectKeys('/', OBJECT_STORE_BUCKET)),
  ).resolves.toEqual([`/${STUB_OBJECT_KEY}`]);

  await expect(client.getObject(STUB_OBJECT_KEY, OBJECT_STORE_BUCKET)).resolves.toEqual(
    STUB_OBJECT,
  );
}
