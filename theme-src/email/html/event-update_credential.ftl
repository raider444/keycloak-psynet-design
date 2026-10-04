<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("eventUpdateCredentialBodyHtml", event.getDetail("credential_type")!"unknown", event.date, event.ipAddress))?replace('<a ', '<a style="color:@ACCENT@;text-decoration:underline;" ')?no_esc}
</@layout.emailLayout>
