// Type declarations for hafas-client (no official @types package available)
declare module 'hafas-client' {
  export interface HafasClient {
    locations(query: string, options?: any): Promise<any[]>;
    departures(stationId: string, options?: any): Promise<{ departures: any[] }>;
    nearby(location: any, options?: any): Promise<any[]>;
  }

  export function createClient(profile: any, userAgent: string): HafasClient;
}

declare module 'hafas-client/p/db/index.js' {
  export const profile: any;
}

declare module 'hafas-client/p/nahsh/index.js' {
  export const profile: any;
}

declare module 'hafas-client/p/db-busradar-nrw/index.js' {
  export const profile: any;
}

declare module 'hafas-client/p/insa/index.js' {
  export const profile: any;
}
