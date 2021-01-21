interface ClientConfig {
  readonly endpoint: string;
  readonly tlsEnabled?: boolean;
}

export interface ClientHMACKeyConfig extends ClientConfig {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}
