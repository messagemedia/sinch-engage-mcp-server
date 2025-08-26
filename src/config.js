/**
 * Configuration module for MCP Local Server
 * Centralizes all environment variable access and configuration settings
 * Load and validate all configuration from environment variables
 */
function loadConfig() {
    // Region configuration (EU or AU default)
    const region = process.env.SINCH_ENGAGE_REGION || 'AU';
    // API credentials (required)
    const apiKey = process.env.SINCH_ENGAGE_API_KEY;
    const apiSecret = process.env.SINCH_ENGAGE_API_SECRET;

    // Region to URL mapping
    const regionUrlMap = {
        'AU': 'https://api.messagemedia.com',
        'EU': 'https://eu.app.api.sinch.com'
    };
    const platformUrl = regionUrlMap[region];


    // Tool filtering options by category and mode (optional)
    const toolCategories = process.env.MCP_TOOL_CATEGORIES?.split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

    const toolModes = process.env.MCP_TOOL_MODES?.split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

    const excludedToolModes = process.env.MCP_TOOL_EXCLUDE_MODES?.split(',')
        .map(s => s.trim())
        .filter(Boolean) || [];

    // Mode tag mapping
    const modeTagMap = {
        'read': 'MCP_MODE_READ',
        'write': 'MCP_MODE_WRITE',
        'delete': 'MCP_MODE_DELETE'
    };

    // Server configuration
    const serverName = process.env.MCP_SERVER_NAME || "Sinch MessageMedia MCP Server";
    const serverVersion = process.env.MCP_SERVER_VERSION || "0.4.0";

    // Retry configuration
    const maxRetries = parseInt(process.env.MCP_MAX_RETRIES || "3", 10);
    const retryDelayMs = parseInt(process.env.MCP_RETRY_DELAY_MS || "3000", 10);

    return {
        region,
        api: {
            platformUrl,
            timeout: 10000,
            auth: {
                basic: {
                    username: apiKey,
                    password: apiSecret
                }
            }
        },
        tools: {
            categories: toolCategories,
            modes: toolModes,
            excludedModes: excludedToolModes,
            modeTagMap
        },
        server: {
            name: serverName,
            version: serverVersion
        },
        retries: {
            max: maxRetries,
            delayMs: retryDelayMs
        },

        // Utility functions
        isValid() {
            return Boolean(this.api.auth.basic.username && this.api.auth.basic.password);
        },
        getAuthHeader() {
            return `Basic ${btoa(`${this.api.auth.basic.username}:${this.api.auth.basic.password}`)}`;
        },
        getFilterQueryParams() {
            const params = {};

            if (this.tools.categories.length > 0) {
                params.categories = this.tools.categories
                    .map(c => c.trim().toLowerCase())
                    .join(',');
            }

            if (this.tools.modes.length > 0) {
                params.modes = this.tools.modes
                    .map(m => m.trim().toLowerCase())
                    .join(',');
            }

            if (this.tools.excludedModes.length > 0) {
                params.exclude_modes = this.tools.excludedModes
                    .map(m => m.trim().toLowerCase())
                    .join(',');
            }

            return params;
        }
    };
}

const config = loadConfig();

export default config;