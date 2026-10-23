import { app, BrowserWindow, ipcMain, nativeImage, Notification, dialog, shell, Tray, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { collectSnapshot, collectProcesses } from './collectors/system';
import { initializeStore, getHistory, saveSnapshot, loadSettings, saveSettings, getAlerts, getAlertRules, saveAlertRules, addAlert, exportRows } from './database/store';
import { evaluateRules } from './services/alerts';
import type { AppSettings, ProcessRow, Snapshot } from '../shared/types';
let mainWindow: BrowserWindow | null = null; let tray: Tray | null = null; let timer: NodeJS.Timeout | null = null; let lastSnapshot: Awaited<ReturnType<typeof collectSnapshot>> | null = null; let quitting = false;
let processCache:ProcessRow[]=[];let lastProcessCollection=0;let snapshotPromise:Promise<Snapshot>|null=null;
const iconSvg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#08121b"/><path d="M5 18h5l3-8 5 15 3-11 2 4h4" fill="none" stroke="#53d9fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function createWindow(){
 mainWindow=new BrowserWindow({width:1440,height:920,minWidth:1024,minHeight:700,backgroundColor:'#070b10',title:'TITAN Monitor Ultimate',show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'../preload/preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 mainWindow.once('ready-to-show',()=>mainWindow?.show());
 mainWindow.on('close',(e)=>{ if(!quitting&&tray&&process.platform==='win32'&&loadSettings().monitoring){e.preventDefault();mainWindow?.hide();} });
 if(process.env.VITE_DEV_SERVER_URL) void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL); else void mainWindow.loadFile(path.join(__dirname,'../../renderer/index.html'));
 mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 mainWindow.webContents.on('will-navigate',(event,url)=>{ const allowed=process.env.VITE_DEV_SERVER_URL; if(allowed&&new URL(url).origin===new URL(allowed).origin)return; if(!allowed&&url===pathToFileURL(path.join(__dirname,'../../renderer/index.html')).href)return; event.preventDefault(); });
}
function setupTray(){ try { const image=nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`); tray=new Tray(image); tray.setToolTip('TITAN Monitor Ultimate'); tray.setContextMenu(Menu.buildFromTemplate([{label:'Open TITAN Monitor',click:()=>{mainWindow?.show();mainWindow?.focus();}},{label:'Collect in background',type:'checkbox',checked:loadSettings().monitoring,click:(item)=>{setMonitoring(item.checked);}},{type:'separator'},{label:'Exit',click:()=>{quitting=true;app.quit();}}])); tray.on('double-click',()=>{mainWindow?.show();mainWindow?.focus();}); } catch { /* tray support is platform-dependent */ } }
function setMonitoring(enabled:boolean){ const s=loadSettings();saveSettings({...s,monitoring:enabled}); if(enabled)startCollection();else stopCollection();return enabled; }
function startCollection(){ if(timer)return; timer=setInterval(()=>void collectAndStore(),loadSettings().refreshSeconds*1000); }
function stopCollection(){if(timer){clearInterval(timer);timer=null;}}
async function collectFreshSnapshot():Promise<Snapshot>{if(snapshotPromise)return snapshotPromise;snapshotPromise=(async()=>{const includeProcesses=lastProcessCollection===0||Date.now()-lastProcessCollection>=Math.max(10_000,loadSettings().refreshSeconds*5000);const snap=await collectSnapshot({includeProcesses});if(includeProcesses){processCache=snap.processes;lastProcessCollection=Date.now();}else snap.processes=processCache;lastSnapshot=snap;return snap;})();try{return await snapshotPromise;}finally{snapshotPromise=null;}}
async function collectAndStore(){ try{const snap=await collectFreshSnapshot();saveSnapshot({timestamp:snap.system.collectedAt,cpu:snap.cpu.usage.value as number|null,memory:snap.memory.percent.value as number|null,gpu:snap.gpu.find(g=>g.utilization.value!==null)?.utilization.value as number|null??null}); const values={cpu:snap.cpu.usage.value as number|null,memory:snap.memory.percent.value as number|null,gpu:snap.gpu[0]?.utilization.value as number|null,disk:snap.disks.reduce<number|null>((a,d)=>Math.max(a??0,(d.percent.value as number|null)??0),null)}; for(const c of evaluateRules(values,getAlertRules())){const event=addAlert({...c,timestamp:Date.now()}); if(Notification.isSupported())new Notification({title:`TITAN ${event.level.toUpperCase()} alert`,body:event.message,silent:true}).show();} mainWindow?.webContents.send('monitor:update',snap);}catch(error){console.error('Metric collection failed:',error instanceof Error?error.message:'Unknown error');} }
function initIpc(){
 ipcMain.handle('monitor:snapshot',()=>collectFreshSnapshot());
 ipcMain.handle('monitor:history',(_e,range:string)=>getHistory(['1m','5m','15m','1h','24h'].includes(range)?range:'1m'));
 ipcMain.handle('monitor:processes',()=>lastSnapshot?.processes??collectProcesses());
 ipcMain.handle('settings:get',()=>loadSettings());
 ipcMain.handle('settings:save',(_e,next:AppSettings)=>{const prev=loadSettings();const value=saveSettings(next);if(prev.monitoring!==value.monitoring)setMonitoring(value.monitoring);if(prev.refreshSeconds!==value.refreshSeconds&&value.monitoring){stopCollection();startCollection();}return value;});
 ipcMain.handle('alerts:get',()=>getAlerts()); ipcMain.handle('alerts:rules',()=>getAlertRules()); ipcMain.handle('alerts:saveRules',(_e,rules)=>saveAlertRules(Array.isArray(rules)?rules:[]));
 ipcMain.handle('alerts:test',()=>{if(!Notification.isSupported())return false;new Notification({title:'TITAN test notification',body:'Desktop notifications are working.'}).show();return true;});
 ipcMain.handle('app:version',()=>app.getVersion()); ipcMain.handle('monitor:toggle',(_e,enabled:boolean)=>setMonitoring(Boolean(enabled)));
 ipcMain.handle('process:openLocation',async(_e,pid:number)=>{if(!Number.isInteger(pid)||pid<1)return{ok:false,error:'Invalid process ID.'};const item=(await collectProcesses()).find(p=>p.pid===pid);if(!item?.path||!path.isAbsolute(item.path)||!fs.existsSync(item.path))return{ok:false,error:'Executable path is unavailable or inaccessible.'};shell.showItemInFolder(item.path);return{ok:true};});
 ipcMain.handle('process:terminate',async(_e,pid:number)=>{if(!Number.isInteger(pid)||pid<=4||pid===process.pid)return{ok:false,error:'This process is protected.'};const item=(await collectProcesses()).find(p=>p.pid===pid);if(!item)return{ok:false,error:'Process is no longer running.'};const protectedNames=new Set(['system','system idle process','registry','smss.exe','csrss.exe','wininit.exe','services.exe','lsass.exe','winlogon.exe','explorer.exe','systemd','init','kthreadd']);if(protectedNames.has(item.name.toLowerCase()))return{ok:false,error:'Protected system process.'};try{if(process.platform==='win32'){const child=spawn('taskkill',['/PID',String(pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});return await new Promise(resolve=>{child.once('error',()=>resolve({ok:false,error:'Windows denied termination or taskkill is unavailable.'}));child.once('exit',code=>resolve(code===0?{ok:true}:{ok:false,error:'Windows denied termination.'}));});}process.kill(pid,'SIGTERM');return{ok:true};}catch{return{ok:false,error:'Termination failed. The process may require elevated permissions.'};}});
 ipcMain.handle('report:export',async(_e,format:string)=>{
  if(!['json','csv','html'].includes(format))return{ok:false};
  const choice=await dialog.showSaveDialog(mainWindow!,{defaultPath:`titan-report-${new Date().toISOString().slice(0,10)}.${format}`,filters:[{name:format.toUpperCase(),extensions:[format]}]});
  if(choice.canceled||!choice.filePath)return{ok:false};
  const stored=exportRows();
  const hardware=lastSnapshot?{
   collectedAt:lastSnapshot.system.collectedAt,
   system:{os:lastSnapshot.system.os,platform:lastSnapshot.system.platform,uptimeSeconds:lastSnapshot.system.uptime},
   cpu:{model:lastSnapshot.cpu.model,usage:lastSnapshot.cpu.usage,cores:lastSnapshot.cpu.cores,physicalCores:lastSnapshot.cpu.physicalCores,speed:lastSnapshot.cpu.speed,temperature:lastSnapshot.cpu.temperature},
   memory:lastSnapshot.memory,
   gpu:lastSnapshot.gpu.map(g=>({name:g.name,vendor:g.vendor,utilization:g.utilization,memoryUsed:g.memoryUsed,memoryTotal:g.memoryTotal,temperature:g.temperature,power:g.power})),
   storage:lastSnapshot.disks.map(d=>({used:d.used,total:d.total,percent:d.percent})),
   sources:lastSnapshot.sourceInfo
  }:null;
  const report={generatedAt:new Date().toISOString(),platform:process.platform,hardware,...stored};
  let content='';
  if(format==='json')content=JSON.stringify(report,null,2);
  else if(format==='csv'){const rows=stored.history as any[];content='timestamp,cpu_percent,memory_percent,gpu_percent\n'+rows.map(r=>`${r.timestamp},${r.cpu??''},${r.memory??''},${r.gpu??''}`).join('\n');}
  else{const safe=JSON.stringify(report).replace(/</g,'\\u003c');content=`<!doctype html><meta charset="utf-8"><title>TITAN diagnostic report</title><style>body{font:15px system-ui;background:#0b1117;color:#e4eef7;margin:40px}pre{white-space:pre-wrap;background:#111b24;padding:24px;border-radius:12px}</style><h1>TITAN Monitor diagnostic report</h1><p>Generated ${new Date().toLocaleString()} · platform ${process.platform}</p><p>Local report; no data uploaded. Host name and executable paths are omitted.</p><pre>${safe}</pre>`;}
  try{fs.writeFileSync(choice.filePath,content,{encoding:'utf8',flag:'w'});return{ok:true,path:choice.filePath};}catch{return{ok:false};}
 });
}
app.whenReady().then(()=>{app.setAppUserModelId('com.titanmonitor.ultimate');initializeStore();initIpc();createWindow();setupTray();if(loadSettings().monitoring){void collectAndStore();startCollection();}app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();else mainWindow?.show();});});
app.on('before-quit',()=>{quitting=true;stopCollection();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin'&&!tray)app.quit();});
