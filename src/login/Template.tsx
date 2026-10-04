import {useState} from "react";
import OriginalTemplate from "keycloakify/login/Template";
import type {TemplateProps} from "keycloakify/login/TemplateProps";
import type {KcContext} from "keycloakify/login/KcContext";
import type {I18n} from "keycloakify/login/i18n";
import emblem from "./assets/emblem.svg";
export default function Template(props:TemplateProps<KcContext,I18n>) {
 const key="psynet-appearance";
 const [mode,setMode]=useState<"light"|"dark">(()=>{try {const saved=localStorage.getItem(key);if(saved==="light"||saved==="dark")return saved;}catch{} return props.kcContext.themeName.endsWith("light")?"light":"dark";});
 const lang=props.i18n.currentLanguage.languageTag;
 const copy=lang.startsWith("ru")?{tag:"Технологии. Сознание. Связь.",caption:"Вход в пространство PsyNet",toggle:"Переключить светлую и тёмную тему"}:lang.startsWith("el")?{tag:"Τεχνολογία. Συνείδηση. Σύνδεση.",caption:"Είσοδος στον κόσμο PsyNet",toggle:"Αλλαγή φωτεινού και σκοτεινού θέματος"}:{tag:"Technology. Consciousness. Connection.",caption:"Your gateway to PsyNet",toggle:"Switch light and dark theme"};
 function toggle(){const next=mode==="dark"?"light":"dark";setMode(next);try{localStorage.setItem(key,next);}catch{}}
 return <main className="psy-shell" data-appearance={mode}>
  <section className="psy-world" aria-label="PsyNet"><div className="psy-brand"><img src={emblem} alt=""/><span className="psy-wordmark">PsyNet</span><p>{copy.tag}</p></div><div className="psy-caption"><span className="psy-contact"/>{copy.caption}</div></section>
  <section className="psy-access"><button className="psy-toggle" type="button" onClick={toggle} aria-label={copy.toggle} title={copy.toggle}>{mode==="dark"?"☀":"☾"}</button><div className="psy-form"><OriginalTemplate {...props}/></div><footer>PsyNet <span>•</span> {new Date().getFullYear()}</footer></section>
 </main>;
}
