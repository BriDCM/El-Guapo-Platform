import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createElGuapoMcpServer } from "./mcp.js";

const { server } = createElGuapoMcpServer();
await server.connect(new StdioServerTransport());
