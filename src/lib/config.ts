export interface ClientConfig {
  readonly endpoint: string;
  readonly tlsEnabled: boolean;
  readonly credentials?: ClientCredentials;
}

export interface ClientCredentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}
