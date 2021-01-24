export interface ClientConfig {
  readonly credentials?: ClientCredentials;
  readonly endpoint?: string;
  readonly tlsEnabled: boolean;
}

export interface ClientCredentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}
