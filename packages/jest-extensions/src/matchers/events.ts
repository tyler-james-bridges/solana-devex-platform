import { PublicKey, TransactionSignature } from '@solana/web3.js';
import type { Program, Event } from '@coral-xyz/anchor';
import type { MatcherContext, EventTestData } from '../types/blockchain';
import { getTestContext, retry } from '../utils';

/**
 * Check if transaction emitted a specific event
 */
export async function toHaveEmittedEvent(
  this: MatcherContext,
  signature: TransactionSignature | Program,
  eventName: string,
  eventData?: any
) {
  // Handle both transaction signature and program cases
  let program: Program | null = null;
  let txSignature: TransactionSignature | null = null;

  if (typeof signature === 'string') {
    txSignature = signature;
    // Will need to get program from test context or require it as parameter
  } else if (signature && typeof signature === 'object' && 'programId' in signature) {
    program = signature as Program;
    // For program case, we need a way to get recent events
  }

  if (!program) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvent', 'signatureOrProgram', 'eventName');
        return `${hint}\n\nProgram instance required for event matching. Pass a Program object or ensure program is available in test context.`;
      }
    };
  }

  try {
    let events: Event[] = [];

    if (txSignature) {
      // Get events for specific transaction
      const { connection } = getTestContext();
      const tx = await retry(async () => {
        const result = await connection.getParsedTransaction(txSignature!, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        if (result === null) {
          throw new Error('Transaction not found');
        }
        return result;
      });

      // Extract events from transaction logs
      const logs = tx.meta?.logMessages || [];
      events = await parseEventsFromLogs(program, logs);
    } else {
      // Get recent events from program
      const eventListener = program.addEventListener(eventName as any, () => {});
      
      // This is a simplified approach - in practice, you might want to:
      // 1. Listen for events during test execution
      // 2. Store events in a test context
      // 3. Query historical events if the program supports it
      
      program.removeEventListener(eventListener);
    }

    const matchingEvents = events.filter(event => 
      event.name === eventName
    );

    if (eventData !== undefined) {
      // Filter by event data if provided
      const dataMatchingEvents = matchingEvents.filter(event => 
        deepEqual(event.data, eventData)
      );
      
      const pass = dataMatchingEvents.length > 0;

      return {
        pass,
        message: () => {
          const hint = this.utils.matcherHint('toHaveEmittedEvent', 'signatureOrProgram', 'eventName, eventData');
          
          if (pass) {
            return `${hint}\n\nExpected not to emit event "${eventName}" with specified data, but found ${dataMatchingEvents.length} matching event(s)`;
          } else {
            const receivedEvents = matchingEvents.map(e => JSON.stringify(e.data));
            const expectedData = JSON.stringify(eventData);
            
            return `${hint}\n\nExpected to emit event "${eventName}" with data: ${expectedData}\nFound ${matchingEvents.length} event(s) with name "${eventName}" but none matched data\nReceived data: [${receivedEvents.join(', ')}]`;
          }
        }
      };
    }

    const pass = matchingEvents.length > 0;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvent', 'signatureOrProgram', 'eventName');
        
        if (pass) {
          return `${hint}\n\nExpected not to emit event "${eventName}", but found ${matchingEvents.length} matching event(s)`;
        } else {
          const availableEvents = events.map(e => e.name);
          const eventsList = availableEvents.length > 0 
            ? `Available events: ${availableEvents.join(', ')}`
            : 'No events found';
          
          return `${hint}\n\nExpected to emit event "${eventName}", but it was not found\n${eventsList}`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvent', 'signatureOrProgram', 'eventName');
        return `${hint}\n\nFailed to check events: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if multiple events were emitted
 */
export async function toHaveEmittedEvents(
  this: MatcherContext,
  signature: TransactionSignature | Program,
  expectedEvents: Array<{ name: string; data?: any }>
) {
  // Handle both transaction signature and program cases
  let program: Program | null = null;
  let txSignature: TransactionSignature | null = null;

  if (typeof signature === 'string') {
    txSignature = signature;
  } else if (signature && typeof signature === 'object' && 'programId' in signature) {
    program = signature as Program;
  }

  if (!program) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvents', 'signatureOrProgram', 'expectedEvents');
        return `${hint}\n\nProgram instance required for event matching.`;
      }
    };
  }

  try {
    let events: Event[] = [];

    if (txSignature) {
      const { connection } = getTestContext();
      const tx = await retry(async () => {
        const result = await connection.getParsedTransaction(txSignature!, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        if (result === null) {
          throw new Error('Transaction not found');
        }
        return result;
      });

      const logs = tx.meta?.logMessages || [];
      events = await parseEventsFromLogs(program, logs);
    }

    const missingEvents: string[] = [];
    const foundEvents: Array<{ name: string; data?: any }> = [];

    for (const expectedEvent of expectedEvents) {
      const matchingEvents = events.filter(event => {
        if (event.name !== expectedEvent.name) {
          return false;
        }
        
        if (expectedEvent.data !== undefined) {
          return deepEqual(event.data, expectedEvent.data);
        }
        
        return true;
      });

      if (matchingEvents.length > 0) {
        foundEvents.push(expectedEvent);
      } else {
        missingEvents.push(`${expectedEvent.name}${expectedEvent.data ? ` with data ${JSON.stringify(expectedEvent.data)}` : ''}`);
      }
    }

    const pass = missingEvents.length === 0;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvents', 'signatureOrProgram', 'expectedEvents');
        
        if (pass) {
          return `${hint}\n\nExpected not to emit all specified events, but all ${expectedEvents.length} events were found`;
        } else {
          const foundList = foundEvents.map(e => e.name).join(', ');
          const missingList = missingEvents.join(', ');
          
          return `${hint}\n\nExpected to emit ${expectedEvents.length} events, but ${missingEvents.length} were missing\nFound: [${foundList}]\nMissing: [${missingList}]`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveEmittedEvents', 'signatureOrProgram', 'expectedEvents');
        return `${hint}\n\nFailed to check events: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Helper function to parse events from transaction logs
 */
async function parseEventsFromLogs(program: Program, logs: string[]): Promise<Event[]> {
  const events: Event[] = [];
  
  try {
    // This is a simplified implementation
    // In practice, you'd need to properly decode the event logs
    // using the program's IDL and event discriminators
    
    const eventParser = (program as any).eventParser;
    if (!eventParser) {
      return events;
    }

    for (const log of logs) {
      try {
        // Look for program log entries that contain event data
        if (log.includes('Program data:') || log.includes('Program log:')) {
          // Extract and decode event data
          // This would need to be implemented based on Anchor's event encoding
          
          // For now, return empty array as this requires deep Anchor integration
        }
      } catch (error) {
        // Skip logs that can't be parsed as events
        continue;
      }
    }
  } catch (error) {
    console.warn('Failed to parse events from logs:', error);
  }

  return events;
}

/**
 * Deep equality check for event data
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}