#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { waitForToolsToLoadOrFail } from "./tool-spec-api.js";
import { handleError } from "./error-handler.js";
import { createToolRegistration, isValidToolDefinition } from "./tool-registration.js";
import config from './config.js';

// Global variables to track state
let server;
let registeredTools = [];

/**
 * Register tools with the MCP server
 */
async function registerToolsWithServer(server, toolDefinitions) {
    const results = { registered: [], failed: [] };

    for (const toolDefinition of toolDefinitions) {
        try {
            const registration = createToolRegistration(toolDefinition);

            server.tool(
                registration.name,
                registration.description,
                registration.schema,
                registration.handler
            );

            results.registered.push(registration.name);
        } catch (error) {
            const toolName = toolDefinition.name || toolDefinition.id || 'unknown';
            console.error(`Failed to register tool ${toolName}:`, error.message);
            results.failed.push({ name: toolName, error: error.message });
            handleError(error, { phase: 'registerToolsWithServer', toolDefinition });
        }
    }

    registeredTools = results.registered;
    return results;
}

async function startMCPServer() {
    console.error('Starting MCP server initialization...');

    // Check for required API credentials
    if (!config.isValid()) {
        console.error('\n\x1bERROR: MCP server startup failed. API_KEY and API_SECRET environment variables are required to pull tools from the tool API.\x1b');
        console.error('Please set these environment variables before starting the server.');
        console.error('\nSample MCP server config:');
        console.error(`\n{\n  "mcpServers": {\n    "Sinch MessageMedia": {\n      "command": "node",\n      "args": [\n        "/path/to/project-mcp-local-server/src/index.js"\n      ],\n      "env": {\n        "API_KEY": "your-key",\n        "API_SECRET": "your-secret",\n        "MCP_TOOL_CATEGORIES": "Reporting, Contacts",\n        "MCP_TOOL_MODES": "read, write",\n        "MCP_TOOL_EXCLUDE_MODES": "delete",\n        "MCP_SERVER_NAME": "Sinch MessageMedia MCP Server",\n        "MCP_SERVER_VERSION": "0.2.0"\n      }\n    }\n  }\n}`);
        process.exit(1);
    }

    // Create the MCP server
    server = new McpServer({
        name: config.server.name,
        version: config.server.version,
    });

    // Wait for tools to load (must succeed or throw)
    const tools = await waitForToolsToLoadOrFail();
    await registerToolsWithServer(server, tools);

    // Connect to stdio transport (only after tools are registered)
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

process.on('SIGTERM', () => {
    console.error('Shutting down MCP server...');
    process.exit(0);
});

startMCPServer().catch((error) => {
    handleError(error, { phase: 'startMCPServer' });
    process.exit(1);
});
