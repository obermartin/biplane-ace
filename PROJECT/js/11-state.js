'use strict';
/* ============================== GAME STATE ============================== */
const WORLD=1050; // half-size of playable area
const G={
  state:'menu', ci:0, li:0, score:0, kills:0, quota:0,
  heightAt:(x,z)=>0, waterLevel:-999,
  solids:[], stunts:[], emitters:[], spinners:[],
  enemies:[], boss:null, spawnT:0, budget:0, config:null,
  unlocked:[1,1,1], time:0, qacc:0, hintT:0, water:null, ripI:0, pus:[]
};

