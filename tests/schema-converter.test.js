import { convertToZodSchema, normalizeSchema } from '../src/schema-converter.js';

describe('Schema Converter', () => {
    describe('convertToZodSchema', () => {
        test('should handle empty schema', () => {
            const result = convertToZodSchema({});
            expect(result).toEqual({});
        });

        test('should handle schema without properties', () => {
            const schema = { type: 'object' };
            const result = convertToZodSchema(schema);
            expect(result).toEqual({});
        });

        test('should convert string properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', description: 'User email' }
                },
                required: ['name']
            };

            const result = convertToZodSchema(schema);
            expect(result.name).toBeDefined();
            expect(result.email).toBeDefined();

            // Zod 4: use public type / isOptional (not internal _def.typeName)
            expect(result.name.isOptional()).toBe(false);
            expect(result.name.type).toBe('string');
            expect(result.email.isOptional()).toBe(true);
            expect(result.email.def.innerType.type).toBe('string');
        });

        test('should convert enum properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'] }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.status.isOptional()).toBe(true);
            expect(result.status.def.innerType.type).toBe('enum');
        });

        test('should convert number properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    age: { type: 'number' },
                    count: { type: 'integer' }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.age.def.innerType.type).toBe('number');
            expect(result.count.def.innerType.type).toBe('number');
        });

        test('should convert boolean properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    active: { type: 'boolean' }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.active.def.innerType.type).toBe('boolean');
        });

        test('should convert array properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    tags: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.tags.def.innerType.type).toBe('array');
        });

        test('should handle nested objects', () => {
            const schema = {
                type: 'object',
                properties: {
                    address: {
                        type: 'object',
                        properties: {
                            street: { type: 'string' },
                            city: { type: 'string' }
                        },
                        required: ['street']
                    }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.address.def.innerType.type).toBe('object');
        });

        test('should handle unknown types as any', () => {
            const schema = {
                type: 'object',
                properties: {
                    unknown: { type: 'unknownType' }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.unknown.def.innerType.type).toBe('any');
        });
    });

    describe('normalizeSchema', () => {
        test('should normalize null/undefined schema', () => {
            expect(normalizeSchema(null)).toEqual({
                type: 'object',
                properties: {},
                required: []
            });

            expect(normalizeSchema(undefined)).toEqual({
                type: 'object',
                properties: {},
                required: []
            });
        });

        test('should normalize empty object', () => {
            const result = normalizeSchema({});
            expect(result).toEqual({
                type: 'object',
                properties: {},
                required: []
            });
        });

        test('should preserve existing fields', () => {
            const schema = {
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name']
            };

            const result = normalizeSchema(schema);
            expect(result).toEqual(schema);
        });

        test('should add missing fields', () => {
            const schema = {
                properties: { name: { type: 'string' } }
            };

            const result = normalizeSchema(schema);
            expect(result).toEqual({
                type: 'object',
                properties: { name: { type: 'string' } },
                required: []
            });
        });
    });
});
