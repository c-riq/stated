
import {describe, expect, it} from '@jest/globals';
//import { checkDnssecValidation } from './dnssec';
const {checkDnssecValidation} = jest.requireActual("./dnssec");



describe('process delv output', () => {
    it('should throw an error if output cannot be processed', () => {
        expect(() => {
            checkDnssecValidation('invalid output', true)
        }).toThrowError()
    });
    it('should recognize correct validation response', () => {
        expect(() => {
            checkDnssecValidation(`
            ; fully validated
            "-BDCwOELwSMh1-f5iieDzxhLuzwDLGHs8P9Q1n7Vgro"
            "-G2fVdQ7xu_z2pFKZlx3gM-Cd5K8CmEU7-t_gVdG6qw"
            `, true)
        }).toBeTruthy()
    });
});
