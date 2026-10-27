import test from 'node:test';
import assert from 'node:assert/strict';
import {paperOutline,paperSections,paperSectionPose,PAPER_PIXEL_SCALE,PAPER_SECTION_DURATION} from '../lib/paper-shape.ts';

const sizes=[[280,320],[357,679],[375,700],[980,800],[980,1200]];

test('the worn outline stays inside mobile and desktop sheets, with only pixel steps',()=>{
 for(const [width,height] of sizes){
  const points=paperOutline(width,height);
  points.forEach(([x,y],i)=>{
   assert.ok(x>=0&&x<=width&&y>=0&&y<=height);
   const [nextX,nextY]=points[(i+1)%points.length];
   assert.ok(x===nextX||y===nextY,'Every edge must be horizontal or vertical');
  });
 }
});

test('square sections cover every pixel exactly once, including partial mobile edge tiles',()=>{
 for(const [cssWidth,cssHeight] of sizes){
  const width=Math.ceil(cssWidth/PAPER_PIXEL_SCALE),height=Math.ceil(cssHeight/PAPER_PIXEL_SCALE);
  const coverage=new Uint8Array(width*height);
  for(const section of paperSections(width,height)){
   assert.ok(section.width>0&&section.width<=32&&section.height>0&&section.height<=32);
   for(let y=section.y;y<section.y+section.height;y++)for(let x=section.x;x<section.x+section.width;x++){
    assert.ok(x>=0&&x<width&&y>=0&&y<height);
    coverage[y*width+x]++;
   }
  }
  assert.ok(coverage.every(count=>count===1));
 }
});

test('sections settle exactly onto the final tile background and only move on whole pixels',()=>{
 for(const [cssWidth,cssHeight] of sizes){
  const width=Math.ceil(cssWidth/PAPER_PIXEL_SCALE),height=Math.ceil(cssHeight/PAPER_PIXEL_SCALE);
  for(const section of paperSections(width,height)){
   assert.deepEqual(paperSectionPose({...section,open:1},width,height),
    {x:section.x,y:section.y,width:section.width,height:section.height});
   for(const open of [0,.15,.5,.85]){
    const pose=paperSectionPose({...section,open},width,height);
    assert.ok(Object.values(pose).every(Number.isInteger));
    assert.ok(pose.width>0&&pose.height>0);
   }
  }
 }
});

test('opening is staggered and completes, including the handoff, in under 600 ms',()=>{
 for(const [cssWidth,cssHeight] of sizes){
  const sections=paperSections(Math.ceil(cssWidth/4),Math.ceil(cssHeight/4));
  assert.ok(new Set(sections.map(section=>section.delay)).size>=3);
  assert.ok(Math.max(...sections.map(section=>section.delay))+PAPER_SECTION_DURATION+.08<.6);
 }
});
