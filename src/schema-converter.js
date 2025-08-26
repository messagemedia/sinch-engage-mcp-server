import { z } from "zod";

/**
 * Type mapping lookup table for converting schema types to Zod types
 */
const TYPE_MAPPING = {
    'string': (property) => property.enum ? z.enum(property.enum) : z.string(),
    'boolean': () => z.boolean(),
    'number': () => z.number(),
    'integer': () => z.number().int(),
    'array': (property) => z.array(createZodType(property.items || { type: 'any' })),
    'object': (property) => z.object(convertToZodSchema(normalizeSchema(property))),
    'any': () => z.any()
};

/**
 * Creates a Zod type for a single property based on its schema definition
 * @param {Object} property - Property schema definition
 * @returns {ZodType} - Corresponding Zod type
 */
function createZodType(property) {
    if (!property || !property.type) {
        return z.any();
    }

    const typeCreator = TYPE_MAPPING[property.type];
    if (!typeCreator) {
        return z.any();
    }

    let zodType = typeCreator(property);

    if (property.description) {
        zodType = zodType.describe(property.description);
    }

    return zodType;
}

/**
 * Converts a JSON Schema-like object to a plain object suitable for passing to z.object()
 * @param {Object} schema - Schema object with properties and required fields
 * @returns {Object} - Plain object mapping property names to Zod types, suitable for z.object()
 */
export function convertToZodSchema(schema) {
    if (!schema?.properties) {
        return {};
    }

    const shape = {};
    const required = schema.required || [];

    for (const [key, property] of Object.entries(schema.properties)) {
        let zodType = createZodType(property);

        if (!required.includes(key)) {
            zodType = zodType.optional();
        }

        shape[key] = zodType;
    }

    return shape;
}

/**
 * Normalizes a schema object to ensure it has the expected structure.
 * If 'type', 'properties', or 'required' fields are missing, they will default to "object", {} (empty object), and [] (empty array) respectively.
 * @param {Object} schema - Raw schema object
 * @returns {Object} - Normalized schema with type, properties, and required fields (defaults applied if missing)
 */
export function normalizeSchema(schema) {
    if (!schema || typeof schema !== 'object') {
        return { type: "object", properties: {}, required: [] };
    }

    return {
        type: schema.type || "object",
        properties: schema.properties || {},
        required: schema.required || []
    };
}
