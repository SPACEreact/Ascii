const assert=require('node:assert/strict');
const {effects,warp,sortedCells}=require('../sea-glass.js');
assert.equal(effects.length,20);
const settings={seaIntensity:.65,seaScale:1,seaChaos:.25,seaSpeed:1,seaRadius:.35};
for(const [id] of effects)for(const ratio of [.5625,1,1.7778])for(const intensity of [0,.65,2])for(const [x,y] of [[0,0],[.5,.5],[.48,.53],[1,1]]){
 const w=warp(id,x,y,1,{...settings,seaIntensity:intensity},{x:.5,y:.5,active:true},ratio);
 for(const value of Object.values(w))assert(Number.isFinite(value),id+' nonfinite warp');assert(w.alpha>=0&&w.alpha<=1);assert(w.size>0);
}
const cells=[{c:'a',color:'#dddddd'},{c:'b',color:'#444444'},{c:'c',color:'#999999'}],copy=JSON.stringify(cells);
assert.deepEqual(sortedCells(cells,1,3,.1).map(c=>c.c),['b','c','a']);assert.equal(JSON.stringify(cells),copy,'Pixel sort mutated cached source');
const p={x:.5,y:.5,active:false};assert.deepEqual(warp('none',.2,.3,1,settings,p,1),{x:.2,y:.3,alpha:1,size:1});
assert.deepEqual(warp('ocean',.2,.3,1,{...settings,seaIntensity:0},p,1),{x:.2,y:.3,alpha:1,size:1});
assert.notDeepEqual(warp('magnet',.48,.53,1,settings,{...p,active:true},1),warp('magnet',.48,.53,1,settings,p,1));
assert.notDeepEqual(warp('pulse',.2,.3,.35,settings,p,1),warp('none',.2,.3,.35,settings,p,1));
console.log('PASS Sea Glass: portrait/landscape bounds, pointer force, neutral intensity and non-mutating pixel sort');
