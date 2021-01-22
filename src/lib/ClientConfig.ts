interface ClientConfig {
  readonly endpointURL: string;
  readonly tlsEnabled: boolean;
}

export interface ClientHMACKeyConfig extends ClientConfig {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}
