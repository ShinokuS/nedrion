// Shared by drawing, pointer placement and the drag validity preview.
export function dragCell(target, held, px, py) {
  return {x:Math.floor((px-target.x)/target.cell)-(held.grabX||0),y:Math.floor((py-target.y)/target.cell)-(held.grabY||0)};
}
export function socketLayout(count, width, height) {
  const columns=width<58||count<2?1:2, rows=Math.ceil(count/columns),gap=24;
  return Array.from({length:count},(_,i)=>{
    const row=Math.floor(i/columns),col=columns===1?0:row%2?1-i%2:i%2;
    return [Math.round(width/2+(col-(columns-1)/2)*gap),Math.round(height/2+(row-(rows-1)/2)*gap)];
  });
}
