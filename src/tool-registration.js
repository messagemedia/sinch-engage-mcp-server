import { z } from "zod";
import { executeTool } from "./tool-utils.js";
import { convertToZodSchema, normalizeSchema } from "./schema-converter.js";

/**
 * Tool registration helpers for MCP server
 * Provides clean separation of concerns for tool registration process
 */

/**
 * Extracts tool name from tool definition
 * @param {Object} toolDefinition - Tool definition object
 * @returns {string} - Tool name
 */
function extractToolName(toolDefinition) {
    return toolDefinition.name || toolDefinition.id || 'unnamed-tool';
}

/**
 * Extracts tool description from tool definition
 * @param {Object} toolDefinition - Tool definition object
 * @returns {string} - Tool description
 */
function extractToolDescription(toolDefinition) {
    const name = extractToolName(toolDefinition);
    return toolDefinition.description || `Tool: ${name}`;
}

/**
 * Creates a Zod schema for tool parameters
 * @param {Object} toolDefinition - Tool definition object
 * @returns {Object} - Zod schema shape for tool parameters
 */
function createToolSchema(toolDefinition) {
    // Get parameters from either requestBodySchema or parameters field, default to empty object if undefined
    const parameters = toolDefinition.requestBodySchema || toolDefinition.parameters || {};

    // Normalize and convert to Zod schema
    const normalizedSchema = normalizeSchema(parameters);
    return convertToZodSchema(normalizedSchema);
}

/**
 * Creates a complete tool registration object
 * @param {Object} toolDefinition - Tool definition from API
 * @returns {Object} - Tool registration object with name, description, schema, and handler
 */
export function createToolRegistration(toolDefinition) {
    const name = extractToolName(toolDefinition);
    const description = extractToolDescription(toolDefinition);
    const schema = createToolSchema(toolDefinition);

    async function toolHandler(params) {
        return executeTool(toolDefinition, params);
    }

    return {
        name,
        description,
        schema,
        handler: toolHandler
    };
}

/**
 * Validates that a tool definition has the minimum required fields.
 * A valid tool definition must be an object and have either a 'name' or 'id' property.
 * @param {Object} toolDefinition - Tool definition to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidToolDefinition(toolDefinition) {
    if (!toolDefinition || typeof toolDefinition !== 'object') {
        return false;
    }

    // Must have either name or id
    const hasIdentifier = toolDefinition.name || toolDefinition.id;

    return Boolean(hasIdentifier);
}
