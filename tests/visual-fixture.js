// Isolated dev-only visual fixture. Restore the previous save when leaving the page.
import {state,openPanel} from '../src/main.js';
import {newProfile} from '../src/core.js';
const raw=localStorage.getItem('nedrion.profile.v1');
addEventListener('pagehide',()=>{if(raw===null)localStorage.removeItem('nedrion.profile.v1');else localStorage.setItem('nedrion.profile.v1',raw);},{once:true});
while(!state.scene?.hero||!state.scene?.ui)await new Promise(r=>setTimeout(r,100));
state.profile=newProfile();state.panel=null;const s=state.scene,kind=new URLSearchParams(location.search).get('inspect');
if(kind==='raid'){state.mode='raid';s.startRaid();s.invincible=9999;}
else {state.mode='hub';s.startHub();if(kind==='vendor'||kind==='stash'){const o=s.objects.find(o=>o.type===kind);s.hero.setPosition(o.x,o.y+58);s.cameras.main.centerOn(s.hero.x,s.hero.y);openPanel(kind);}}
