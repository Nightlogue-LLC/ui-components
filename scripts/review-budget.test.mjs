import test from 'node:test';
import assert from 'node:assert/strict';
import {checkReviewBudget, reviewRequests, findingsForSha, MAX_REPAIRS} from './review-budget.mjs';

const shas=Array.from({length:8},(_,i)=>(i+1).toString(16).repeat(40));
const codex='chatgpt-codex-connector[bot]';
const owner='shavonne-senpai';
function history(severities) {
  const comments=[],inline=[];
  for(let i=0;i<severities.length;i++){
    const sha=shas[i];
    comments.push({
      user:{login:owner},created_at:new Date(2026,0,1,0,i).toISOString(),
      body:`@codex review\n<!-- nightlogue-codex-request:${sha} -->${i?'\n<!-- nightlogue-review-budget:v1 '+JSON.stringify({round:i,severity:severities[i-1]})+' -->':''}`,
    });
    comments.push({
      user:{login:codex},updated_at:new Date(2026,0,1,1,i).toISOString(),
      body:'<!-- codex-review-state:v1 '+JSON.stringify({code_review:{
        commit_sha:sha,status:'completed',has_any_findings:true,has_unresolved_findings:true,
      }})+' -->',
    });
    comments.push({user:{login:codex},body:`<!-- codex-review-receipt:v1 --> Reviewed commit: ${sha.slice(0,10)}`});
    inline.push({user:{login:codex},commit_id:sha,path:`src/file-${i}.ts`,body:`[${severities[i]}] Fix consequence ${i}`});
  }
  return {comments,inline};
}

test('initial review is round zero, and only owner-authored markers count',()=>{
  assert.deepEqual(checkReviewBudget({comments:[],inline:[],sha:shas[0]}),
    {allowed:true,round:0,severity:'initial'});
  const fake={user:{login:'another-user'},body:`<!-- nightlogue-codex-request:${shas[0]} -->`};
  assert.equal(reviewRequests([fake]).length,0);
  assert.equal(findingsForSha([{user:{login:'random'},commit_id:shas[0],body:'[P3] Minor'}],shas[0]).length,0);
});
test('P3 permits one repair review, then applies a hold',()=>{
  let h=history(['P3']);
  assert.deepEqual(checkReviewBudget({...h,sha:shas[1]}),{allowed:true,round:1,severity:'P3'});
  h=history(['P3','P3']);
  const next=checkReviewBudget({...h,sha:shas[2]});
  assert.equal(next.reason,'severity_limit');
  assert.equal(next.severity,'P3');
});
test('P2 permits three repair reviews, P1 five and global limit five',()=>{
  for(const [type,limit] of [['P2',3],['P1',5]]){
    const allowed=history(Array(limit).fill(type));
    assert.equal(checkReviewBudget({...allowed,sha:shas[limit]}).allowed,true);
    const blocked=history(Array(limit+1).fill(type));
    const result=checkReviewBudget({...blocked,sha:shas[limit+1]});
    assert.equal(result.allowed,false);
    assert.ok(['severity_limit','global_limit'].includes(result.reason));
  }
  assert.equal(MAX_REPAIRS,5);
});
test('unclassified bot findings are treated as P1, never P3',()=>{
  const h=history(['P2']);
  h.inline=[{user:{login:codex},commit_id:shas[0],path:'src/a.ts',body:'Problem without severity'}];
  assert.equal(checkReviewBudget({...h,sha:shas[1]}).severity,'P1');
});
test('no two consecutive unsuccessful repair attempts continue unchanged findings',()=>{
  const h=history(['P2','P2','P2']);
  h.inline.forEach(c=>{c.path='src/repeat.ts';c.body='[P2] Same correctness issue';});
  assert.equal(checkReviewBudget({...h,sha:shas[3]}).reason,'no_progress');
});
test('previous review needs a completed state and receipt',()=>{
  const h=history(['P1']);
  const withoutReceipt=h.comments.filter(c=>!c.body?.includes('codex-review-receipt:v1'));
  assert.equal(checkReviewBudget({comments:withoutReceipt,inline:h.inline,sha:shas[1]}).reason,'previous_review_pending');
  h.comments.find(c=>c.body?.includes('codex-review-state:v1')).body='<!-- codex-review-state:v1 {"code_review":{"status":"running"}} -->';
  assert.equal(checkReviewBudget({...h,sha:shas[1]}).reason,'previous_review_pending');
});
test('same SHA is never requested twice even after a restart',()=>{
  const h=history(['P2']);
  assert.equal(checkReviewBudget({...h,sha:shas[0]}).reason,'already_requested');
});
