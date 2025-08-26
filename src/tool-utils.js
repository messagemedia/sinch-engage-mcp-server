import axios from 'axios';
import config from './config.js';
import { handleError } from './error-handler.js';

/**
 * Attempts to parse a value into its appropriate type (boolean, number, JSON, or string).
 * @param {any} value - The value to be parsed.
 * @param {string} [schemaType] - The expected type from the schema (e.g., 'string', 'number').
 * @returns {any} - The parsed value in its appropriate type, or the original value if parsing fails.
 */
export function parseValueToType(value, schemaType) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();

    // Handle boolean strings
    if (schemaType === 'boolean' || (!schemaType && (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false'))) {
        if (trimmed.toLowerCase() === 'true') return true;
        if (trimmed.toLowerCase() === 'false') return false;
    }

    // Handle numeric strings
    if ((schemaType === 'number' || schemaType === 'integer' || !schemaType) && !isNaN(trimmed) && trimmed !== '') {
        const num = Number(trimmed);
        if (Number.isFinite(num)) return num;
    }
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch (err) {
            // Return the original string if JSON parsing fails
        }
    }

    return value;
}

/**
 * Processes and transforms parameters based on the tool definition schema.
 * @param {Object} toolDefinition - The tool's definition containing schema information.
 * @param {Object} parameters - The parameters to be transformed.
 * @returns {Object} - The transformed parameters.
 */
export function processParameters(toolDefinition, parameters) {
    if (!parameters) parameters = {};
    for (const [key, value] of Object.entries(parameters)) {
        parameters[key] = parseValueToType(value);
    }
    if (toolDefinition.requestBodySchema) {
        return mapParametersToSchema(parameters, toolDefinition.requestBodySchema);
    }
    return parameters;
}

/**
 * Maps and coerces parameters to match a given schema.
 * @param {Object} parameters - The parameters to be coerced.
 * @param {Object} schema - The schema to match the parameters against.
 * @returns {Object} - The parameters coerced to match the schema.
 */
export function mapParametersToSchema(parameters, schema) {
    if (!schema || schema.type !== 'object') return parameters; // Handle undefined schema
    const result = {};
    const properties = schema.properties || {};
    for (const [propName, propDef] of Object.entries(properties)) {
        if (parameters[propName] !== undefined) {
            let paramValue = parseValueToType(parameters[propName], propDef.type); // Pass schema type

            if (propDef.type === 'object' && propDef.properties) {
                if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                    result[propName] = mapParametersToSchema(paramValue, propDef);
                } else {
                    result[propName] = {};
                }
            } else if (propDef.type === 'array' && propDef.items) {
                if (Array.isArray(paramValue)) {
                    if (propDef.items.type === 'object') {
                        result[propName] = paramValue.map(item =>
                            typeof item === 'object' ? mapParametersToSchema(item, propDef.items) : item
                        );
                    } else {
                        result[propName] = paramValue;
                    }
                } else if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                    result[propName] = [mapParametersToSchema(paramValue, propDef.items)];
                } else {
                    result[propName] = [];
                }
            } else {
                result[propName] = paramValue;
            }
        }
    }
    return result;
}

/**
 * Splits parameters into path, query, and body based on their locations.
 * @param {Object} parameters - The parameters to split.
 * @param {Object} parameterLocations - Mapping of parameter names to their locations (path, query, body).
 * @returns {Object} - An object containing pathParams, queryParams, and bodyParams.
 */
export function splitParametersByLocation(parameters, parameterLocations) {
    const pathParams = {};
    const queryParams = {};
    const bodyParams = {};
    if (!parameterLocations || typeof parameterLocations !== 'object') {
        return { pathParams: {}, queryParams: {}, bodyParams: { ...parameters } };
    }
    for (const [key, value] of Object.entries(parameters)) {
        const location = parameterLocations[key];
        if (location === 'path') {
            pathParams[key] = value;
        } else if (location === 'query') {
            queryParams[key] = value;
        } else {
            bodyParams[key] = value;
        }
    }
    return { pathParams, queryParams, bodyParams };
}

export async function sendToolRequest(toolDefinition, parameters) {
    let requestConfig = null;
    try {
        const method = toolDefinition.method || 'GET';
        let path = toolDefinition.path || '';
        const parameterLocations = toolDefinition.parameter_locations;
        const { pathParams, queryParams, bodyParams } = splitParametersByLocation(
            parameters,
            parameterLocations
        );
        const pathParamNames = (path.match(/\{(\w+)\}/g) || []).map(p => p.replace('{', '').replace('}', ''));
        for (const name of pathParamNames) {
            if (pathParams[name] !== undefined) {
                path = path.replace(`{${name}}`, encodeURIComponent(String(pathParams[name])));
            }
        }
        const url = `${config.api.platformUrl}${path}`;
        let requestData = null;
        if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
            requestData = toolDefinition.requestBodySchema
                ? processParameters(toolDefinition, bodyParams)
                : undefined;
        }
        requestConfig = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        };
        if (requestData) {
            requestConfig.data = requestData;
        }
        requestConfig.headers.Authorization = config.getAuthHeader();
        if (Object.keys(queryParams).length > 0) {
            requestConfig.params = queryParams;
        }
        const response = await axios(requestConfig);
        return response.data;
    } catch (error) {
        console.error('[sendToolRequest] Error:', error.message);
        if (requestConfig) {
            console.error('[sendToolRequest] Request Config:', JSON.stringify(requestConfig, null, 2));
        }
        if (error.response) {
            console.error('[sendToolRequest] Response Data:', JSON.stringify(error.response.data, null, 2));
        }

        const err = new Error(error.message);
        err.response = error.response;
        err.status = error.response?.status;
        err.statusText = error.response?.statusText;
        err.responseData = error.response?.data;
        err.requestConfig = requestConfig ? {
            ...requestConfig,
            headers: {
                ...requestConfig.headers,
                Authorization: requestConfig.headers?.Authorization ? 'REDACTED' : undefined
            },
            data: requestConfig?.data
        } : undefined;
        err.originalError = error;
        throw err;
    }
}

/**
 * Core function to handle tool execution with different formatting options
 * @param {Object} toolDefinition - The tool's definition (path, method, schema, etc.)
 * @param {Object} parameters - Parameters to pass to the tool
 * @param {Object} options - Execution options
 * @param {boolean} options.formatResponse - Whether to format the response as MCP content
 * @param {boolean} options.parseStringAsJson - Whether to attempt parsing string parameters as JSON
 * @returns {Promise<Object>} - Tool execution result
 */
export async function executeTool(toolDefinition, params, options = {}) {
    const { formatResponse = true, parseStringAsJson = false } = options;

    // 1. Process parameters (conditionally parse JSON strings)
    let processedParams = { ...params };
    if (parseStringAsJson) {
        for (const [key, value] of Object.entries(processedParams)) {
            if (typeof value === 'string') {
                const trimmedValue = value.trim();
                if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
                    (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
                    const parsedValue = JSON.parse(trimmedValue);
                    processedParams[key] = parsedValue;
                }
            }
        }
    }

    try {
        // 2. Execute the tool request
        const result = await sendToolRequest(toolDefinition, processedParams);

        // 3. Format the response if required
        if (formatResponse) {
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        } else {
            return result;
        }
    } catch (error) {
        // 4. Handle errors according to options
        handleError(error, { phase: 'executeTool' });
        if (formatResponse) {
            return {
                content: [
                    { type: "text", text: `Error: ${error.message}` },
                    { type: "text", text: `Status: ${error.status || 'unknown'}` },
                    { type: "text", text: `Response: ${JSON.stringify(error.responseData || {}, null, 2)}` }
                ],
                error: { code: "TOOL_EXECUTION_ERROR", message: error.message },
            };
        } else {
            throw error; // Re-throw for direct execution
        }
    }
}