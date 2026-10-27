import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestaurantSearch} from '../lib/restaurant-search.ts';
const flush=async()=>{await Promise.resolve();await Promise.resolve()};

test('typing is debounced and clearing a short query cancels pending work',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});
 const calls=[],states=[];
 const search=createRestaurantSearch(async query=>{calls.push(query);return [query]},state=>states.push(state));
 search.search('Mer');t.mock.timers.tick(200);search.search('Mermeta');
 t.mock.timers.tick(399);assert.equal(calls.length,0);
 t.mock.timers.tick(1);await flush();assert.deepEqual(calls,['Mermeta']);assert.deepEqual(states.at(-1).results,['Mermeta']);
 search.search('Mermeta Restaurant');search.search('Me');t.mock.timers.tick(2000);await flush();
 assert.equal(calls.length,1);assert.equal(states.at(-1).searched,false);assert.deepEqual(states.at(-1).results,[]);
 search.cancel();
});

test('new typing aborts old requests and late responses cannot replace the current query',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});
 const pending=[],states=[];
 const search=createRestaurantSearch((query,signal)=>new Promise(resolve=>pending.push({query,signal,resolve})),state=>states.push(state));
 search.search('Mer');t.mock.timers.tick(400);
 search.search('Mermeta');assert.equal(pending[0].signal.aborted,true);
 t.mock.timers.tick(1200);pending[1].resolve(['Mermeta']);await flush();
 pending[0].resolve(['Wrong old result']);await flush();
 assert.equal(states.at(-1).query,'Mermeta');assert.deepEqual(states.at(-1).results,['Mermeta']);
 search.cancel();
});

test('Enter respects request spacing and repeated queries reuse results',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});
 const calls=[];
 const search=createRestaurantSearch(async query=>{calls.push(query);return []},()=>{});
 search.search('Mermeta',true);t.mock.timers.tick(0);await flush();
 search.search('Mermeta Restaurant',true);t.mock.timers.tick(1199);assert.equal(calls.length,1);
 t.mock.timers.tick(1);await flush();assert.equal(calls.length,2);
 search.search('  mermeta   restaurant ');t.mock.timers.tick(2000);await flush();assert.equal(calls.length,2);
 search.cancel();
});

test('choosing a result or closing the editor cancels updates, and genuine failures remain retryable',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:10000});
 let rejectRequest;const states=[];
 const search=createRestaurantSearch(()=>new Promise((_,reject)=>{rejectRequest=reject}),state=>states.push(state));
 search.search('Mermeta');t.mock.timers.tick(400);search.cancel();
 const count=states.length;rejectRequest(Error('Aborted'));await flush();assert.equal(states.length,count);
 search.search('Mermeta');t.mock.timers.tick(1200);rejectRequest(Error('Please retry'));await flush();
 assert.equal(states.at(-1).error,'Please retry');assert.equal(states.at(-1).searched,false);
 search.search('Mermeta');t.mock.timers.tick(1200);assert.equal(states.at(-1).searching,true);
 search.cancel();rejectRequest(Error('Aborted'));await flush();
});
