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

            // Test that required field is not optional
            expect(result.name._def.typeName).toBe('ZodString');
            // Test that optional field is optional
            expect(result.email._def.typeName).toBe('ZodOptional');
        });

        test('should convert enum properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'] }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.status._def.typeName).toBe('ZodOptional');
            expect(result.status._def.innerType._def.typeName).toBe('ZodEnum');
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
            expect(result.age._def.innerType._def.typeName).toBe('ZodNumber');
            expect(result.count._def.innerType._def.typeName).toBe('ZodNumber');
        });

        test('should convert boolean properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    active: { type: 'boolean' }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.active._def.innerType._def.typeName).toBe('ZodBoolean');
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
            expect(result.tags._def.innerType._def.typeName).toBe('ZodArray');
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
            expect(result.address._def.innerType._def.typeName).toBe('ZodObject');
        });

        test('should handle unknown types as any', () => {
            const schema = {
                type: 'object',
                properties: {
                    unknown: { type: 'unknownType' }
                }
            };

            const result = convertToZodSchema(schema);
            expect(result.unknown._def.innerType._def.typeName).toBe('ZodAny');
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
