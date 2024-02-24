
import {describe, expect, it} from '@jest/globals';

//import {validateDomainFormat} from './validateDomainFormat'
// @ts-ignore
const {validateDomainFormat} = jest.requireActual("./validateDomainFormat");


describe('validateDomainFormat', () => {
    it('should return true for valid domains', () => {
        expect(validateDomainFormat('example.com')).toBe(true)
        expect(validateDomainFormat('example.co.uk')).toBe(true)
        expect(validateDomainFormat('example.com.au')).toBe(true)
    });
    it('should return false for invalid domains', () => {
        expect(validateDomainFormat('example')).toBe(false)
        expect(validateDomainFormat('example.')).toBe(false)
        expect(validateDomainFormat('example.com.')).toBe(false)
        expect(validateDomainFormat('example .com')).toBe(false)
    })
});
