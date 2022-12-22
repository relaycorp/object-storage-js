import VError from 'verror';

export class ObjectStorageError extends VError {
  public override readonly name = 'ObjectStorageError';
}
