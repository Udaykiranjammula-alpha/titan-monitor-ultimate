import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, AlertRule, Snapshot, TitanApi } from '../shared/types';
const api:TitanApi={
 getSnapshot:()=>ipcRenderer.invoke('monitor:snapshot'), getHistory:(range)=>ipcRenderer.invoke('monitor:history',range), getProcesses:()=>ipcRenderer.invoke('monitor:processes'), getSettings:()=>ipcRenderer.invoke('settings:get'), saveSettings:(settings:AppSettings)=>ipcRenderer.invoke('settings:save',settings), getAlerts:()=>ipcRenderer.invoke('alerts:get'), getAlertRules:()=>ipcRenderer.invoke('alerts:rules'), saveAlertRules:(rules:AlertRule[])=>ipcRenderer.invoke('alerts:saveRules',rules), testNotification:()=>ipcRenderer.invoke('alerts:test'), exportReport:(format)=>ipcRenderer.invoke('report:export',format), openProcessLocation:(pid)=>ipcRenderer.invoke('process:openLocation',pid), terminateProcess:(pid)=>ipcRenderer.invoke('process:terminate',pid), appVersion:()=>ipcRenderer.invoke('app:version'), setMonitoring:(enabled)=>ipcRenderer.invoke('monitor:toggle',enabled)
};
contextBridge.exposeInMainWorld('titan',api);
ipcRenderer.on('monitor:update',(_event,snapshot:Snapshot)=>window.dispatchEvent(new CustomEvent('titan:snapshot',{detail:snapshot})));
