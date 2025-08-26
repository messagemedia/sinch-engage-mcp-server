/**
 * Centralized error handler for MCP server errors.
 * Logs error details and context in a consistent, minimal way.
 * @param {Error} error - The error instance
 * @param {Object} [context] - Optional context (e.g. { phase, tool, params })
 */
export function handleError(error, context = {}) {
    console.error('\n');

    let prefix = '[MCP Error]';
    if (context.phase) prefix += ` [${context.phase}]`;

    // Generic error logging
    console.error(`${prefix} ${error.name || 'Error'}: ${error.message}`);
    if (error.stack) console.error(error.stack);

    // Log extra context if available
    if (context.tool) {
        const toolInfo = context.tool.name || context.tool.id || JSON.stringify(context.tool);
        console.error(`${prefix} Tool: ${toolInfo}`);
    }
    if (context.params) {
        console.error(`${prefix} Params: ${JSON.stringify(context.params)}`);
    }

    console.error('\n');
}
