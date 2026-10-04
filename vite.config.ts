import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
export default defineConfig({plugins:[react(),keycloakify({themeName:["psynet-light","psynet-dark"],accountThemeImplementation:"none",keycloakVersionTargets:{"22-to-25":false,"all-other-versions":"psynet-keycloak-26.jar"}})]});
