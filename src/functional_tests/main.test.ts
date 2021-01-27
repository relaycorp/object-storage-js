import { Storage } from '@google-cloud/storage';
import { config as loadDotEnvVars } from 'dotenv';
import { get as getEnvVar } from 'env-var';
import { Client as MinioClient } from 'minio';

import { asyncIterableToArray } from '../lib/_test_utils';
import { AdapterType } from '../lib/adapters';
import { OBJECT, OBJECT1_KEY, OBJECT_PREFIX } from '../lib/adapters/_test_utils';
import { initObjectStoreClient } from '../lib/init';

loadDotEnvVars();

const OBJECT_STORE_HOST = '127.0.0.1';
const OBJECT_STORE_BUCKET = getEnvVar('OBJECT_STORE_BUCKET').required().asString();
const OBJECT_STORE_ACCESS_KEY_ID = getEnvVar('OBJECT_STORE_ACCESS_KEY_ID').required().asString();
const OBJECT_STORE_SECRET_KEY = getEnvVar('OBJECT_STORE_SECRET_KEY').required().asString();

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

  await testClient('minio', minioPort);
});

test('GCS', async () => {
  const gcsPort = 8080;
  const gcsClient = new Storage({
    apiEndpoint: `http://${OBJECT_STORE_HOST}:${gcsPort}`,
    projectId: 'this is not actually used, but we have to set it :shrugs:',
  });
  await gcsClient.createBucket(OBJECT_STORE_BUCKET);

  await testClient('gcs', gcsPort, false);
});

async function testClient(
  adapterType: AdapterType,
  port: number,
  passCredentials = true,
): Promise<void> {
  const client = initObjectStoreClient(
    adapterType,
    `${OBJECT_STORE_HOST}:${port}`,
    passCredentials ? OBJECT_STORE_ACCESS_KEY_ID : undefined,
    passCredentials ? OBJECT_STORE_SECRET_KEY : undefined,
    false,
  );

  await expect(
    asyncIterableToArray(client.listObjectKeys(OBJECT_PREFIX, OBJECT_STORE_BUCKET)),
  ).resolves.toHaveLength(0);
  await expect(client.getObject(OBJECT1_KEY, OBJECT_STORE_BUCKET)).rejects.not.toBeNull();

  await client.putObject(OBJECT, OBJECT1_KEY, OBJECT_STORE_BUCKET);

  await expect(
    asyncIterableToArray(client.listObjectKeys(OBJECT_PREFIX, OBJECT_STORE_BUCKET)),
  ).resolves.toEqual([OBJECT1_KEY]);

  await expect(client.getObject(OBJECT1_KEY, OBJECT_STORE_BUCKET)).resolves.toEqual(OBJECT);

  await expect(client.deleteObject(OBJECT1_KEY, OBJECT_STORE_BUCKET)).toResolve();
  await expect(
    asyncIterableToArray(client.listObjectKeys(OBJECT_PREFIX, OBJECT_STORE_BUCKET)),
  ).resolves.toHaveLength(0);

  await expect(client.deleteObject('non-existing.txt', OBJECT_STORE_BUCKET)).toResolve();
}
