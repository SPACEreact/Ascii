const assert=require('node:assert/strict');
const {dither,grade,texture,kernels,bayer}=require('../print-studio.js');
const w=64,h=48,src=new Uint8ClampedArray(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;src[i]=x*255/(w-1);src[i+1]=y*255/(h-1);src[i+2]=(x+y)*255/(w+h-2);src[i+3]=x<2?0:255;}
const settings={printPitch:7,printAngle:45,printLevels:4,printStrength:1,printColour:'duotone',printInk:'#000000',printPaper:'#ffffff',contrast:1,brightness:0,gamma:1};
assert.equal(grade(src,{printWhite:255}),src,'neutral grade should be free');
assert.deepEqual(texture(src,w,h,'halftone',{...settings,printStrength:0}),src,'zero mix preserves source');
const stretched=grade(new Uint8ClampedArray([64,64,64,255,192,192,192,255]),{printBlack:64,printWhite:192});
assert.deepEqual([...stretched],[0,0,0,255,255,255,255,255]);
const grey=grade(new Uint8ClampedArray([128,128,128,255]),{printHue:135,printWhite:255});
assert.deepEqual([...grey],[128,128,128,255],'hue preserves neutral greys');
const methods=[...Object.keys(kernels),'bayer','white-noise','pocket','halftone','spot','pop','clustered','coarse','line-screen','crosshatch','pattern','wavy','rings','spiral','sunburst','ridgeline','contour','outline','waveform','photocopy','modulation','diagonal','threshold','posterize'];
for(const method of methods){
 const a=texture(src,w,h,method,settings),b=texture(src,w,h,method,settings);
 assert.deepEqual(a,b,method+' is deterministic');assert.notDeepEqual(a,src,method+' changes output');
 for(let i=3;i<src.length;i+=4)assert.equal(a[i],src[i],method+' preserves alpha');
}
for(const method of [...Object.keys(kernels),'bayer','white-noise']){
 const v=new Float32Array(w*h).fill(.5);dither(v,w,h,method,2);
 assert(v.every(x=>x===0||x===1),method+' emits legal quantized tones');
 const mean=v.reduce((a,b)=>a+b,0)/v.length;assert(Math.abs(mean-.5)<.08,method+' preserves average luminance');
}
const values=new Set();for(let y=0;y<8;y++)for(let x=0;x<8;x++)values.add(bayer(x,y));assert.equal(values.size,64);
assert.deepEqual([...dither(new Float32Array([.4]),1,1,'atkinson',2)],[0],'one-pixel boundaries');
console.log('PASS 32 deterministic print effects, 10 glyph dithers, alpha, mix, levels and hue');
