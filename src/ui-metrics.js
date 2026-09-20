export function uiScaleFor(width,height){ return Math.max(.5,Math.floor(Math.min(Math.max(1.5,Math.floor(height/720)),width/1100,height/640)*8)/8); }
export function worldScaleFor(height){return height<720?height/720:Math.max(1,Math.floor(height/720));}
