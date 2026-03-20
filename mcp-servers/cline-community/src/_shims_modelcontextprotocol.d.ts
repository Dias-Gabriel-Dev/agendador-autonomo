declare module "@modelcontextprotocol/sdk/server/index.js" {
  export class Server {
    constructor(info: any, opts: any);
    onerror: (err: any) => void;
    setRequestHandler(schema: any, handler: any): void;
    connect(transport: any): Promise<void>;
    close(): Promise<void>;
  }
  export default Server;
}

declare module "@modelcontextprotocol/sdk/server/stdio.js" {
  export class StdioServerTransport {}
  export default StdioServerTransport;
}

declare module "@modelcontextprotocol/sdk/types.js" {
  export const CallToolRequestSchema: any;
  export const ListToolsRequestSchema: any;
  export const ErrorCode: any;
  export const McpError: any;
}
