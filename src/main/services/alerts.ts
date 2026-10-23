import type { AlertRule } from '../../shared/types';
export interface AlertCandidate { ruleId:string; metric:string; level:string; value:number; message:string }
const starts=new Map<string,number>(); const cooldown=new Map<string,number>();
export function evaluateRules(values:Record<string,number|null>, rules:AlertRule[], now=Date.now()):AlertCandidate[] {
 const out:AlertCandidate[]=[];
 for(const rule of rules){ const value=values[rule.metric]; const key=rule.id; if(!rule.enabled||value==null||!Number.isFinite(value)){starts.delete(key);continue;}
  if(value<rule.threshold-5){starts.delete(key);continue;}
  if(value<rule.threshold){continue;} const began=starts.get(key)??now; starts.set(key,began);
  const last=cooldown.get(key);
  if(now-began<rule.duration*1000||(last!==undefined&&now-last<60000)) continue;
  cooldown.set(key,now); out.push({ruleId:rule.id,metric:rule.metric,level:rule.level,value,message:`${rule.metric.toUpperCase()} ${rule.level}: ${value.toFixed(1)}% exceeded ${rule.threshold}% threshold.`});
 }
 return out;
}
export function resetAlertState(){starts.clear();cooldown.clear();}
