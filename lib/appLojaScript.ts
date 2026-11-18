// 18/11/2026 — script do <head> que liga a marca "app da loja" antes de pintar (ver lib/appLoja.ts). Arquivo à parte
// porque o layout é componente de servidor e não pode importar de módulo 'use client'.
export const SCRIPT_APP_LOJA =
  "try{var q=new URLSearchParams(location.search).get('app');var a=(q==='ios'||q==='android')?q:null;" +
  "if(!a&&document.referrer.indexOf('android-app://')===0)a='android';" +
  "var m=navigator.userAgent.match(/OraculoApp\\/(ios|android)/);if(!a&&m)a=m[1];" +
  "if(a)sessionStorage.setItem('oraculo_app',a);else a=sessionStorage.getItem('oraculo_app');" +
  "if(a)document.documentElement.setAttribute('data-app-loja',a);}catch(e){}"
