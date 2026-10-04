import DefaultPage from "keycloakify/login/DefaultPage";
import UserProfileFormFields from "keycloakify/login/UserProfileFormFields";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "./i18n";
import Template from "./Template";
import "./theme.css";
export default function KcPage({kcContext}:{kcContext:KcContext}) {
 const {i18n}=useI18n({kcContext});
 return <DefaultPage kcContext={kcContext} i18n={i18n} Template={Template} doUseDefaultCss={false} classes={{kcFormGroupClass:"form-group",kcInputGroup:"pf-c-input-group",kcFormPasswordVisibilityButtonClass:"psy-reveal",kcFormPasswordVisibilityIconShow:"fa-eye",kcFormPasswordVisibilityIconHide:"fa-eye-slash",kcFormOptionsWrapperClass:"psy-options",kcAlertClass:"alert",kcAlertTitleClass:"alert-title"}} UserProfileFormFields={UserProfileFormFields} doMakeUserConfirmPassword />;
}
