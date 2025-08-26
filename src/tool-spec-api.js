import axios from 'axios';
import config from './config.js';
import { handleError } from "./error-handler.js";

const toolSpecApiClient = axios.create({
    baseURL: config.api.platformUrl,
    timeout: config.api.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': config.getAuthHeader()
    }
});

/**
 * Get list of available tool definitions from the MCP API with optional filtering
 * @returns {Promise} Response with tool definitions
 */
export async function listResources() {
    try {
        const queryParams = config.getFilterQueryParams();
        const response = await toolSpecApiClient.get('/v1/mcp/tools', { 
            params: queryParams 
        });
        const tools = response.data.resources || [];
        return { resources: tools };
    } catch (error) {
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData?.error === 'INVALID_FILTER_PARAMETER') {
                const errorCode = errorData.error;
                const invalidParams = errorData.invalid_parameters || [];
                const errorMsg = invalidParams.length > 0
                    ? `${errorCode}: ${invalidParams.join(', ')}`
                    : errorCode;
                throw new Error(errorMsg);
            }
        }
        // Throw other errors for standard error handling
        throw error;
    }
}

export async function waitForToolsToLoadOrFail(maxRetries = config.retries.max, delayMs = config.retries.delayMs) {
    let retries = 0;
    let tools = [];
    while (retries < maxRetries) {
        try {
            // Fetch tools with server-side filtering applied
            const response = await listResources();
            const tools = response.resources || [];

            if (tools.length > 0) {
                return tools;
            }
        } catch (error) {
            handleError(error, { phase: 'waitForToolsToLoadOrFail', retry: retries });
        }
        retries++;
        console.error(`No tools loaded, retrying (${retries}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delayMs));
    }
    const err = new Error('Failed to load any tools from the API after multiple attempts.');
    handleError(err, { phase: 'waitForToolsToLoadOrFail' });
    throw err;
}