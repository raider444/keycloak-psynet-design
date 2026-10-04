import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextVersion,stableVersion} from './release-version.mjs';
test('numeric ordering, unrelated and prerelease tags',()=>{
 assert.equal(nextVersion(['v1.9.9','v1.10.0','v2.0.0-rc.1','v01.99.0','unrelated'],'1.0.0','patch'),'1.10.1');
});
test('bump resets lower components and starts from package version without tags',()=>{
 assert.equal(nextVersion([],'1.0.0','minor'),'1.1.0');
 assert.equal(nextVersion(['v3.4.5'],'1.0.0','major'),'4.0.0');
 assert.equal(nextVersion(['v3.4.5'],'1.0.0','minor'),'3.5.0');
 assert.throws(()=>nextVersion([],'1.0.0','typo'));
 for(const v of ['v1.2.3','1.2','01.2.3','1.2.3\n','1.2.3-rc.1'])assert(!stableVersion.test(v));
});
