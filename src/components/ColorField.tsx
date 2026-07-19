import { useEffect, useState } from 'react';

const validColor=(value:string|undefined)=>/^#[0-9a-f]{6}$/i.test(value??'')?value!:'#000000';

export function ColorField({label,value,onChange,help}:{label:string;value:string|undefined;onChange:(value:string)=>void;help?:string}):React.JSX.Element{
  const transparent=!value||value==='transparent'||value==='none';
  const [lastColor,setLastColor]=useState(validColor(value));
  useEffect(()=>{if(!transparent)setLastColor(validColor(value))},[value,transparent]);
  return <div className="field color-field" title={help}><span>{label}</span><div><input type="color" value={transparent?lastColor:validColor(value)} disabled={transparent} onChange={event=>{setLastColor(event.target.value);onChange(event.target.value)}}/><label><input type="checkbox" checked={transparent} onChange={event=>onChange(event.target.checked?'transparent':lastColor)}/> Transparente</label></div></div>;
}
