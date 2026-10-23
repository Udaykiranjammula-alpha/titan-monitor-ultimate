import si from 'systeminformation';
import os from 'node:os';
import type { Snapshot, ProcessRow, DiskData } from '../../shared/types';
import { metric, safePercent, unsupported } from './metric';
export function normalizeProcessRow(p:any): ProcessRow {
 const cpu=Number(p.cpu);
 const memoryKib=Number(p.memRss);
 return {pid:Number.isFinite(p.pid)?p.pid:0,name:typeof p.name==='string'&&p.name?p.name:'Unknown process',cpu:Number.isFinite(cpu)?Math.max(0,cpu):0,
  // systeminformation reports Windows WorkingSetSize / 1024 as memRss (KiB).
  memory:Number.isFinite(memoryKib)?Math.max(0,memoryKib*1024):0,path:typeof p.path==='string'?p.path:null};
}
export async function collectSnapshot(options:{includeProcesses?:boolean}={}): Promise<Snapshot> {
 const processRequest=options.includeProcesses===false?Promise.resolve({list:[],all:0,running:0,blocked:0,sleeping:0,unknown:0} as unknown as Awaited<ReturnType<typeof si.processes>>):si.processes();
 const [load,cpu,cpuSpeed,cpuTemp,mem,graphics,fs,processes,osInfo,network] = await Promise.allSettled([si.currentLoad(),si.cpu(),si.cpuCurrentSpeed(),si.cpuTemperature(),si.mem(),si.graphics(),si.fsSize(),processRequest,si.osInfo(),si.networkStats()]);
 const get=<T,>(r:PromiseSettledResult<T>,fallback:T):T=>r.status==='fulfilled'?r.value:fallback;
 const unsupportedNum=(unit:string,provider:string,note:string)=>unsupported(unit,provider,note);
 const la=get(load,{currentLoad:0,cpus:[]} as unknown as Awaited<ReturnType<typeof si.currentLoad>>);
 const ci=get(cpu,{manufacturer:'',brand:'',cores:os.cpus().length,physicalCores:0,speed:0,speedMin:0,speedMax:0,processors:0} as Awaited<ReturnType<typeof si.cpu>>);
 const cs=get(cpuSpeed,{avg:0,min:0,max:0,cores:[]}) as Awaited<ReturnType<typeof si.cpuCurrentSpeed>>;
 const ct=get(cpuTemp,{main:-1,cores:[],max:-1,socket:[],chipset:-1});
 const mm=get(mem,{total:0,free:0,used:0,active:0,available:0,swaptotal:0,swapused:0,swapfree:0} as unknown as Awaited<ReturnType<typeof si.mem>>);
 const gi=get(graphics,{controllers:[],displays:[]}) as Awaited<ReturnType<typeof si.graphics>>;
 const diskList=get(fs,[]) as Awaited<ReturnType<typeof si.fsSize>>;
 const proc=get(processes,{list:[],all:0,running:0,blocked:0,sleeping:0,unknown:0}) as Awaited<ReturnType<typeof si.processes>>;
 const oi=get(osInfo,{distro:os.type(),release:os.release(),codename:'',kernel:os.release(),arch:os.arch(),hostname:os.hostname(),fqdn:os.hostname(),codepage:'',logofile:'',serial:'',build:'',servicepack:'',uefi:false,platform:process.platform} as Awaited<ReturnType<typeof si.osInfo>>);
 const ns=get(network,[]) as Awaited<ReturnType<typeof si.networkStats>>;
 const stamp=Date.now();
 const gpus=gi.controllers.map((g:any)=>({name:metric(g.model||g.name||null,'','systeminformation.graphics'),utilization:unsupportedNum('%','systeminformation','GPU utilization requires a supported driver telemetry provider (NVML/Windows GPU counters).'),memoryUsed:typeof g.vramUsed==='number'?metric(g.vramUsed,'MB','systeminformation.graphics'):unsupportedNum('MB','systeminformation.graphics','VRAM usage not exposed by the active driver.'),memoryTotal:typeof g.vram==='number'?metric(g.vram,'MB','systeminformation.graphics'):unsupportedNum('MB','systeminformation.graphics','VRAM capacity not reported.'),temperature:unsupportedNum('°C','sensor-provider','Compatible sensor provider unavailable.'),power:unsupportedNum('W','sensor-provider','Compatible sensor provider unavailable.'),vendor:String(g.vendor||'Unknown')}));
 const disks:DiskData[]=diskList.map(d=>({mount:d.mount,name:d.fs||d.type||d.mount,used:metric(d.used,'bytes','systeminformation.fsSize'),total:metric(d.size,'bytes','systeminformation.fsSize'),percent:metric(safePercent(d.use)??null,'%','systeminformation.fsSize'),read:unsupportedNum('bytes/s','systeminformation','Per-drive throughput is not exposed by this collector.'),write:unsupportedNum('bytes/s','systeminformation','Per-drive throughput is not exposed by this collector.') }));
 const listed:ProcessRow[]=proc.list.map(normalizeProcessRow).sort((a,b)=>b.memory-a.memory).slice(0,100);
 const tempValid=Number.isFinite(ct.main)&&ct.main>=0;
 const net0=ns[0] as any;
 const warnings:string[]=[];
 if(process.platform!=='win32') warnings.push('Running in a non-Windows environment. Windows Performance Counters, Windows notifications, and Windows packaging cannot be verified here.');
 if(!gpus.length) warnings.push('No GPU controller information returned by the host systeminformation provider.');
 warnings.push('Motherboard sensors, per-process GPU usage, fan speeds, and frame timing require compatible Windows drivers/providers and are not available in this environment.');
 return {
  cpu:{model:metric([ci.manufacturer,ci.brand].filter(Boolean).join(' ').trim()||null,'','systeminformation.cpu'),usage:metric(safePercent(Number(la.currentLoad)),'%','systeminformation.currentLoad'),cores:ci.cores||os.cpus().length,physicalCores:ci.physicalCores||0,perCore:(la.cpus||[]).map((c:any)=>safePercent(Number(c.load))??0),speed:cs.avg>0?metric(cs.avg,'GHz','systeminformation.cpuCurrentSpeed'):unsupportedNum('GHz','systeminformation.cpuCurrentSpeed','Current CPU clock is not exposed by this platform.'),temperature:tempValid?metric(ct.main,'°C','systeminformation.cpuTemperature'):unsupportedNum('°C','systeminformation.cpuTemperature','No compatible sensor provider or CPU temperature reading found.')},
  memory:{total:metric(mm.total,'bytes','systeminformation.mem'),used:metric(mm.used,'bytes','systeminformation.mem'),available:metric(mm.available,'bytes','systeminformation.mem'),percent:metric(mm.total>0?safePercent(mm.used/mm.total*100):null,'%','systeminformation.mem'),committed:unsupportedNum('bytes','systeminformation.mem','OS commit charge is not exposed by this collector.')},
  gpu:gpus, disks, processes:listed, system:{hostname:oi.hostname||os.hostname(),os:[oi.distro,oi.release].filter(Boolean).join(' ')||os.type(),uptime:os.uptime(),platform:oi.platform||process.platform,collectedAt:stamp},
  network:{rx:typeof net0?.rx_sec==='number'?metric(net0.rx_sec,'bytes/s','systeminformation.networkStats'):unsupportedNum('bytes/s','systeminformation.networkStats','Network interface statistics unavailable.'),tx:typeof net0?.tx_sec==='number'?metric(net0.tx_sec,'bytes/s','systeminformation.networkStats'):unsupportedNum('bytes/s','systeminformation.networkStats','Network interface statistics unavailable.')},
  sourceInfo:{platform:process.platform,provider:'systeminformation (host OS APIs)',warnings}
 };
}
export async function collectProcesses(): Promise<ProcessRow[]> { const p=await si.processes(); return p.list.map(normalizeProcessRow).sort((a,b)=>b.cpu-a.cpu).slice(0,300); }
