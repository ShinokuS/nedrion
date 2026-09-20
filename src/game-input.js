const controls=new Set(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyQ','KeyR','KeyF','KeyI','KeyZ','Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','AltLeft','AltRight','F10']);
export async function toggleFullscreen(scene){
 try {if(document.fullscreenElement)await document.exitFullscreen();else await document.getElementById('game').requestFullscreen({navigationUI:'hide'});}
 catch {scene.toastCanvas('Полный экран недоступен в этом браузере. Откройте игру в отдельном окне.');}
}
export function installGameInput(scene){
 scene.input.keyboard.addCapture(['W','A','S','D','E','Q','R','F','I','Z','ALT','TAB','SPACE','F10','UP','DOWN','LEFT','RIGHT']);
 const canvas=scene.game.canvas;canvas.tabIndex=0;canvas.style.outline='none';
 const focus=()=>canvas.focus({preventScroll:true});canvas.addEventListener('pointerdown',focus);
 const key=e=>{if(!document.hasFocus()||!controls.has(e.code)||e.metaKey)return;e.preventDefault();if(e.type==='keydown'&&!e.repeat){if(e.code==='F10')toggleFullscreen(scene);if(e.code==='KeyZ')scene.lootLabelsPinned=!scene.lootLabelsPinned;}};
 // Phaser queues input before preventing browser defaults; capture-phase cancellation would discard movement.
 window.addEventListener('keydown',key);window.addEventListener('keyup',key);
 const blur=()=>scene.input.keyboard.resetKeys();window.addEventListener('blur',blur);
 const full=async()=>{focus();scene.resize();if(document.fullscreenElement){try{await navigator.keyboard?.lock([...controls].filter(k=>k!=='F10'));}catch{}}else navigator.keyboard?.unlock();};
 document.addEventListener('fullscreenchange',full);focus();
 scene.events.once('shutdown',()=>{canvas.removeEventListener('pointerdown',focus);window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',blur);document.removeEventListener('fullscreenchange',full);navigator.keyboard?.unlock();});
}
