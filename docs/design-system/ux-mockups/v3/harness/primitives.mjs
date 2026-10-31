const root=document.querySelector("main");
const SVG="http://www.w3.org/2000/svg";
export const glyphs={
 leaf:'M20 3C9 2 3 7 4 14c1 6 11 8 15 2 3-4 1-10 1-13ZM5 20 17 7M9 16l-1-5m5 1 5 1',
 star:'M12 2v10m0 0L3 21m9-9 9 9',
 foot:'M10 23c3-3 4-6 2-9L5 7 4 4c0-2 3-2 3 0l4 4V2c0-2 3-2 3 0v6l4-4c2-2 4 0 2 2l-2 3-3 5c-1 3-1 6 1 8M7 6l4 5 2-5 3 5 3-4M12 14l3 0',
 jump:'M2 19c5-1 8-5 10-11M10 9l6-2 4 4m-8-3-4-3m6 2 1-4M5 22l4-3m4-4 4 3M18 2l2 1m1 4 2 1',
 shield:'M12 2 21 6l-1 8c-1 5-5 7-8 9-3-2-7-4-8-9L3 6l9-4Zm-5 10 3 3 7-7',
 wind:'M2 7h12c6 0 6-6 1-5M2 12h17c5 0 5 7 0 7M2 17h8c5 0 5 6 0 6',
 drop:'M12 2c-2 5-7 9-7 13a7 7 0 0 0 14 0c0-4-5-8-7-13ZM8 15c0 3 2 4 4 4',
 bond:'M5 13c-5-7 5-13 9-5l3 7c2 4 6 0 4-3M8 21c-4-2-2-8 2-6l7 3M5 13l5 2m4-7 3 7',
 lamp:'M9 6V4c0-4 6-4 6 0v2M6 6h12l2 13H4L6 6ZM4 22h16M12 9v7m-3-5 3 5 3-5',
 sun:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
 next:'m9 4 8 8-8 8',
 lock:'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4V10Zm8 5v3',
 gear:'m9 2 6 0 1 3 3 1 3 4-2 3 0 3-4 4-3-1-3 1-4-4 1-3-2-3 3-4 3-1 1-3Zm3 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
 pouch:'M6 6c0-6 12-6 12 0M3 7h18v15H3V7ZM5 9h6v5H5V9Zm8 0h6v5h-6V9ZM5 16h6v4H5v-4Zm8 0h6v4h-6v-4Z'
};
export function node(tag,cls,text,parent=root){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;if(parent)parent.append(n);return n;}
export function svgNode(tag,attrs,parent){const n=document.createElementNS(SVG,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));parent?.append(n);return n;}
export function icon(name,parent,cls='icon'){const s=svgNode('svg',{viewBox:'0 0 24 24',class:cls,fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true','data-icon':name},parent);svgNode('path',{d:glyphs[name]||glyphs.star},s);return s;}

glyphs.eye="M2 12Q12 0 22 12Q12 24 2 12ZM12 7v5m0 0-4 5m4-5 4 5";
glyphs.moth="M12 10C4 0 0 7 8 13C0 19 8 23 12 15C16 23 24 19 16 13C24 7 20 0 12 10ZM12 8v11m0-11-3-4m3 4 3-4";
glyphs.bandage="M3 10 10 3l11 11-7 7L3 10Zm4-1 8 8m-6-10 8 8";
glyphs.hem="M4 5 9 2h6l5 3-3 5v12H7V10L4 5Zm8 7v4m0 0-3 4m3-4 3 4";
glyphs.lamp="M8 21h8m-4-2V6M5 5Q12-4 19 5l2 5H3L5 5Zm5 9 2-2 2 2";
glyphs.lantern="M8 5V3Q12-1 16 3v2M6 5h12l2 15H4L6 5Zm-2 18h16M12 9v8m-4-7 8 7m0-7-8 7";
glyphs.slit="M3 5h18v15H3V5Zm3 5h12M7 13l-3 5m8-5v6m5-6 3 5";

// Source-specific glyphs from the v3 icon brief, drawn as code-native paths.
glyphs.shield="M12 22C4 18 1 9 4 3C8 2 11 4 12 7C13 4 17 2 20 3C23 9 20 18 12 22ZM12 7v15M5 7l7 10 7-10M4 12l8 7 8-7";
glyphs.flashlight="M3 9h9l4-4v14l-4-4H3V9Zm5 0v6M19 8l4-3m-4 7h5m-5 4 4 3";
glyphs.bandage="M3 15C0 5 11 1 21 3C23 12 18 21 8 21L3 15Zm2-2 6 6m-3-9 6 6M5 19 18 6M14 6l2 4 4 2";
glyphs.lamp="M7 22h10m-5 0V11m-3-2V6a3 3 0 0 1 6 0v3H9Zm-1-8L6 1m10 0 2-1M4 6H1m19 0h3M5 11l-2 2m16-2 2 2";
glyphs.advance=glyphs.foot+"M17 20h7m-3-3 3 3-3 3";
