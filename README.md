# @relaycorp/object-storage

This library allows you to interact with major object storage backends (e.g., Amazon S3) using a unified interface.

## Install

Releases are automatically pushed to NPM. For example, to get the latest release, run:

```
npm install @relaycorp/object-storage
```

## Supported backends

| Backend | Name | SDK used internally | Access/secret key support                                                                                                                                        |
| --- | --- | --- | --- |
| Amazon S3 | `s3` | AWS | Optional |
| Google Cloud Storage (GCS) | `gcs` | GCP | Unsupported. Use alternative authentication methods instead, like [workload identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity). |
| Minio | `minio` | AWS | Required |

## Supported operations

- Get object (along with its metadata).
- Create/update object (along with its metadata).
- Delete object.
- List objects under a given prefix. Pagination is handled automatically: We return an iterable and retrieve the next page lazily.

We welcome PRs to support additional operations, as long as each new operation is supported across all backends in a normalised way, and has unit and functional tests.

## Example

```typescript
import { initObjectStoreClient } from '@relaycorp/object-storage';

async function main(): Promise<void> {
  const client = initObjectStoreClient(
    process.env.STORE_BACKEND,
    process.env.STORE_ENDPOINT,
    process.env.STORE_ACCESS_KEY,
    process.env.STORE_SECRET_KEY,
  );

  for await (const objectKey of client.listObjectKeys("prefix/", process.env.STORE_BUCKET)) {
    console.log("- ", objectKey)
  }
}
```

## API documentation

The API documentation can be found on [docs.relaycorp.tech](https://docs.relaycorp.tech/object-storage-js/).

## Contributing

We love contributions! If you haven't contributed to a Relaycorp project before, please take a minute to [read our guidelines](https://github.com/relaycorp/.github/blob/master/CONTRIBUTING.md) first.
