import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildObservationContent, parseObservation, buildStatement, parseStatement } from './protocol';

describe('Observation', () => {
  it('should build observation content', () => {
    const observation = {
      subject: 'John_Doe@globalcoordination.johndoe.com',
      property: 'Among the members of this network they are the most appropriate to represent',
      value: 'Germany',
    };

    const content = buildObservationContent(observation);
    
    assert.ok(content.includes('Type: Observation'));
    assert.ok(content.includes('Subject: John_Doe@globalcoordination.johndoe.com'));
    assert.ok(content.includes('Property: Among the members of this network they are the most appropriate to represent'));
    assert.ok(content.includes('Value: Germany'));
  });

  it('should parse observation content', () => {
    const content =
      '    Type: Observation\n' +
      '    Subject: John_Doe@globalcoordination.johndoe.com\n' +
      '    Property: Among the members of this network they are the most appropriate to represent\n' +
      '    Value: Germany\n';

    const parsed = parseObservation(content);

    assert.strictEqual(parsed.subject, 'John_Doe@globalcoordination.johndoe.com');
    assert.strictEqual(parsed.property, 'Among the members of this network they are the most appropriate to represent');
    assert.strictEqual(parsed.value, 'Germany');
  });

  it('should build and parse observation in a statement', () => {
    const observation = {
      subject: 'John_Doe@globalcoordination.johndoe.com',
      property: 'Among the members of this network they are the most appropriate to represent',
      value: 'Germany',
    };

    const content = buildObservationContent(observation);
    const statement = buildStatement({
      domain: 'example.com',
      author: 'Test Author',
      time: new Date('2023-06-15T10:00:00Z'),
      content,
    });

    const parsed = parseStatement({ statement });
    assert.strictEqual(parsed.type, 'observation');
    
    const parsedObservation = parseObservation(parsed.content);
    assert.strictEqual(parsedObservation.subject, observation.subject);
    assert.strictEqual(parsedObservation.property, observation.property);
    assert.strictEqual(parsedObservation.value, observation.value);
  });

  it('should throw error when subject is missing', () => {
    assert.throws(() => {
      buildObservationContent({
        subject: '',
        property: 'Some property',
        value: 'Some value',
      });
    }, /Subject is required/);
  });

  it('should throw error when property is missing', () => {
    assert.throws(() => {
      buildObservationContent({
        subject: 'test@example.com',
        property: '',
        value: 'Some value',
      });
    }, /Property is required/);
  });

  it('should throw error when value is missing', () => {
    assert.throws(() => {
      buildObservationContent({
        subject: 'test@example.com',
        property: 'Some property',
        value: '',
      });
    }, /Value is required/);
  });

  it('should handle various subject formats', () => {
    const observations = [
      {
        subject: 'user@domain.com',
        property: 'role',
        value: 'administrator',
      },
      {
        subject: 'https://example.com/resource/123',
        property: 'status',
        value: 'active',
      },
      {
        subject: 'Organization Name',
        property: 'headquarters',
        value: 'Berlin, Germany',
      },
    ];

    observations.forEach((obs) => {
      const content = buildObservationContent(obs);
      const parsed = parseObservation(content);
      assert.strictEqual(parsed.subject, obs.subject);
      assert.strictEqual(parsed.property, obs.property);
      assert.strictEqual(parsed.value, obs.value);
    });
  });
});