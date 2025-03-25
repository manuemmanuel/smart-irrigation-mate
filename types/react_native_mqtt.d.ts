declare module 'react_native_mqtt' {
  interface MQTTInitOptions {
    size: number;
    storageBackend: any;
    defaultExpires: number;
    enableCache: boolean;
    reconnect: boolean;
    sync: Record<string, any>;
  }

  interface PahoMQTTClient {
    connect(options: { onSuccess: () => void; useSSL: boolean; onFailure: (err: any) => void }): void;
    disconnect(): void;
    isConnected(): boolean;
    subscribe(topic: string): void;
    send(message: any): void;
    onConnectionLost: (callback: (responseObject: any) => void) => void;
    onMessageArrived: (callback: (message: any) => void) => void;
  }

  interface PahoMQTTMessage {
    destinationName: string;
    payloadString: string;
  }

  interface PahoMQTT {
    MQTT: {
      Client: new (host: string, port: number, clientId: string) => PahoMQTTClient;
      Message: new (payload: string) => PahoMQTTMessage;
    };
  }

  const Paho: PahoMQTT;
  const init: (options: MQTTInitOptions) => void;

  export default init;
  export { Paho };
} 