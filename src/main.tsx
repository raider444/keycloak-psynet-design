import { createRoot } from "react-dom/client";
import { createGetKcContextMock, type KcContext } from "keycloakify/login/KcContext";
import KcPage from "./login/KcPage";
declare global { interface Window { kcContext?: KcContext } }
const {getKcContextMock}=createGetKcContextMock({kcContextExtension:{},kcContextExtensionPerPage:{}});
const query=new URLSearchParams(location.search);
const allowed=["login.ftl","register.ftl","login-reset-password.ftl","login-otp.ftl","info.ftl"] as const;
const requested=query.get("page");
const pageId=allowed.find(x=>x===requested)??"login.ftl";
const preview=getKcContextMock({pageId,overrides:{themeName:query.get("theme")==="light"?"psynet-light":"psynet-dark",realm:{displayName:"PsyNet",displayNameHtml:"PsyNet"},locale:{currentLanguageTag:query.get("lang")??"en"}}});
createRoot(document.getElementById("root")!).render(<KcPage kcContext={window.kcContext??preview}/>);
