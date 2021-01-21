/**
 * Store object.
 */
export interface StoreObject {
  readonly metadata: { readonly [key: string]: string };
  readonly body: Buffer;
}
